import { Graph, type AnimationOptions, type Graph as G6Graph, type IPointerEvent, type NodeBadgeStyleProps } from '@antv/g6'
import type { EquityGraphData, EquityNodeType } from './equityData'
import {
  buildEquityTopology,
  computeEquityHiddenNodes,
  findCollapseAnchorId,
  hasDownstreamBranch,
  hasUpstreamBranch,
} from './equityCollapse'
import {
  registerHoverAntPolyline,
  setEquityVisibilityAnimating,
  stopAllHoverAntPolylineEdges,
  syncAllHoverAntPolylineEdges,
} from './hoverAntPolylineEdge'

registerHoverAntPolyline()

interface EquityGraphNodeData {
  name: string
  type?: EquityNodeType
  region?: string
}

interface EquityGraphController {
  reset: () => Promise<void>
  expandAll: () => Promise<void>
  collapseAll: () => Promise<void>
}

const controllers = new WeakMap<G6Graph, EquityGraphController>()

/** 参考穿透图：境外/中间主体浅蓝描边，境内目标主体实心蓝 */
const OFFSHORE_STYLE = {
  fill: '#f5f9fd',
  stroke: '#7eb2dd',
  labelFill: '#1f2937',
}

const TARGET_STYLE = {
  fill: '#1a5fb4',
  stroke: '#1a5fb4',
  labelFill: '#ffffff',
}

/** 折叠/展开：淡出 + 向父/子节点收拢，展开时反向展开 */
const VISIBILITY_ANIM_DURATION = 280
const NODE_VISIBILITY_ANIMATION: Record<string, AnimationOptions[]> = {
  show: [
    { fields: ['opacity'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-out' },
    { fields: ['x', 'y'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-out' },
  ],
  hide: [
    { fields: ['opacity'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-in' },
    { fields: ['x', 'y'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-in' },
  ],
}

const EDGE_VISIBILITY_ANIMATION: Record<string, AnimationOptions[]> = {
  show: [
    { fields: ['opacity'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-out' },
    { fields: ['sourceNode', 'targetNode'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-out' },
  ],
  hide: [
    { fields: ['opacity'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-in' },
    { fields: ['sourceNode', 'targetNode'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-in' },
  ],
}

function nodeStyle(type?: EquityNodeType) {
  return type === 'target' ? TARGET_STYLE : OFFSHORE_STYLE
}

function buildShareholderPercentMap(data: EquityGraphData): Map<string, string> {
  const map = new Map<string, string>()
  for (const edge of data.edges) {
    if (edge.data?.relation === 'shareholder' && edge.data.percent) {
      map.set(edge.source, edge.data.percent)
    }
  }
  return map
}

function formatLabel(data: EquityGraphNodeData, _nodeId: string, _percentMap: Map<string, string>) {
  if (data.type === 'person') {
    return data.name
  }
  if (data.region) {
    return `${data.name}\n(${data.region})`
  }
  return data.name
}

function getNodeData(datum: { data?: Record<string, unknown> }): EquityGraphNodeData {
  return (datum.data ?? {}) as unknown as EquityGraphNodeData
}

function getShapeMarker(shape: { className?: string | string[]; name?: string }) {
  const className = Array.isArray(shape.className)
    ? shape.className.join(' ')
    : (shape.className ?? '')
  return `${className} ${shape.name ?? ''}`
}

function isPointerOnNodeBadge(event: IPointerEvent) {
  if (event.targetType !== 'node') return false

  let shape: { className?: string | string[]; name?: string; parentElement?: unknown } | null =
    event.originalTarget
  const nodeElement = event.target

  while (shape && shape !== nodeElement) {
    if (getShapeMarker(shape).includes('badge-')) return true
    shape = (shape.parentElement ?? null) as typeof shape
  }

  return false
}

function getBadgeIndexFromEvent(event: IPointerEvent): number | null {
  let shape: { className?: string | string[]; name?: string; parentElement?: unknown } | null =
    event.originalTarget
  const nodeElement = event.target

  while (shape && shape !== nodeElement) {
    const marker = getShapeMarker(shape)
    const match = marker.match(/badge-(\d+)/)
    if (match) return Number(match[1])
    shape = (shape.parentElement ?? null) as typeof shape
  }

  return null
}

function createCollapseBadgeStyle(
  text: string,
  placement: 'top' | 'bottom',
  borderColor: string,
): NodeBadgeStyleProps {
  const size = 18

  return {
    text,
    placement,
    offsetY: placement === 'top' ? -8 : 8,
    padding: [0, 0, 0, 0],
    fontSize: 10,
    fontWeight: 600,
    backgroundWidth: size,
    backgroundHeight: size,
    backgroundRadius: size / 2,
    backgroundFill: '#ffffff',
    backgroundStroke: borderColor,
    backgroundLineWidth: 1,
    fill: '#1a5fb4',
    textAlign: 'center',
    textBaseline: 'middle',
  }
}

function createCollapseBadges(
  nodeId: string,
  nodeType: EquityNodeType | undefined,
  topo: ReturnType<typeof buildEquityTopology>,
  collapsedUpstream: Set<string>,
  collapsedDownstream: Set<string>,
) {
  const borderColor = nodeType === 'target' ? '#1a5fb4' : '#7eb2dd'
  const badges: NodeBadgeStyleProps[] = []

  if (hasUpstreamBranch(topo, nodeId)) {
    badges.push(
      createCollapseBadgeStyle(
        collapsedUpstream.has(nodeId) ? '+' : '−',
        'top',
        borderColor,
      ),
    )
  }

  if (hasDownstreamBranch(topo, nodeId)) {
    badges.push(
      createCollapseBadgeStyle(
        collapsedDownstream.has(nodeId) ? '+' : '−',
        'bottom',
        borderColor,
      ),
    )
  }

  return badges
}

function hasCollapsibleBranch(
  nodeId: string,
  topo: ReturnType<typeof buildEquityTopology>,
) {
  return hasUpstreamBranch(topo, nodeId) || hasDownstreamBranch(topo, nodeId)
}

export function createEquityGraph(container: HTMLElement, data: EquityGraphData): G6Graph {
  const width = container.clientWidth || 800
  const height = container.clientHeight || 600
  const shareholderPercents = buildShareholderPercentMap(data)
  const topo = buildEquityTopology(data)
  const collapsedUpstream = new Set<string>()
  const collapsedDownstream = new Set<string>()
  let previousHidden = new Set<string>()
  let collapseBadgeVersion = 0
  const nodePositions = new Map<string, { x: number; y: number }>()
  const nodeIdSet = new Set(data.nodes.map((node) => node.id))

  let graph!: G6Graph

  function getNodePosition(id: string) {
    const style = graph.getNodeData(id).style as { x?: number; y?: number } | undefined
    return { x: style?.x ?? 0, y: style?.y ?? 0 }
  }

  function rememberNodePosition(id: string) {
    if (!nodePositions.has(id)) {
      nodePositions.set(id, getNodePosition(id))
    }
  }

  function buildPositionUpdatesForVisibility(
    visibilityChanges: Record<string, 'visible' | 'hidden'>,
    hidden: Set<string>,
  ) {
    const updates: { id: string; style: { x: number; y: number } }[] = []

    for (const [id, visibility] of Object.entries(visibilityChanges)) {
      if (!nodeIdSet.has(id)) continue

      if (visibility === 'hidden') {
        rememberNodePosition(id)
        const anchorId = findCollapseAnchorId(data, id, hidden)
        updates.push({ id, style: getNodePosition(anchorId) })
      } else {
        const original = nodePositions.get(id)
        if (original) updates.push({ id, style: original })
      }
    }

    return updates
  }

  function buildVisibilityChanges(hidden: Set<string>) {
    const changes: Record<string, 'visible' | 'hidden'> = {}

    for (const node of data.nodes) {
      const nextHidden = hidden.has(node.id)
      const prevHidden = previousHidden.has(node.id)
      if (nextHidden !== prevHidden) {
        changes[node.id] = nextHidden ? 'hidden' : 'visible'
      }
    }

    for (const edge of data.edges) {
      const id = String(edge.id)
      const nextHidden = hidden.has(edge.source) || hidden.has(edge.target)
      const prevHidden = previousHidden.has(edge.source) || previousHidden.has(edge.target)
      if (nextHidden !== prevHidden) {
        changes[id] = nextHidden ? 'hidden' : 'visible'
      }
    }

    previousHidden = new Set(hidden)
    return changes
  }

  async function refreshCollapseBadges(nodeIds: string[]) {
    const visibleIds = nodeIds.filter(
      (id) => hasCollapsibleBranch(id, topo) && !previousHidden.has(id),
    )
    if (visibleIds.length === 0) return

    collapseBadgeVersion += 1
    graph.updateNodeData(
      visibleIds.map((id) => ({
        id,
        style: { collapseBadgeVersion },
      })),
    )
    await graph.draw()
  }

  async function applyVisibility(badgeNodeIds?: Iterable<string>) {
    const hidden = computeEquityHiddenNodes(topo, collapsedUpstream, collapsedDownstream)
    const visibilityChanges = buildVisibilityChanges(hidden)

    if (Object.keys(visibilityChanges).length > 0) {
      stopAllHoverAntPolylineEdges(graph)
      const positionUpdates = buildPositionUpdatesForVisibility(visibilityChanges, hidden)
      if (positionUpdates.length > 0) {
        graph.updateNodeData(positionUpdates)
      }
      setEquityVisibilityAnimating(true)
      try {
        await graph.setElementVisibility(visibilityChanges, true)
      } finally {
        setEquityVisibilityAnimating(false)
      }
    }

    const badgeIds = badgeNodeIds
      ? [...badgeNodeIds]
      : data.nodes
          .filter((node) => hasCollapsibleBranch(node.id, topo))
          .map((node) => node.id)
    await refreshCollapseBadges(badgeIds)
  }

  async function toggleUpstream(nodeId: string) {
    if (collapsedUpstream.has(nodeId)) collapsedUpstream.delete(nodeId)
    else collapsedUpstream.add(nodeId)
    await applyVisibility([nodeId])
  }

  async function toggleDownstream(nodeId: string) {
    if (collapsedDownstream.has(nodeId)) collapsedDownstream.delete(nodeId)
    else collapsedDownstream.add(nodeId)
    await applyVisibility([nodeId])
  }

  function handleBadgeClick(event: IPointerEvent) {
    if (!isPointerOnNodeBadge(event)) return
    if (!('id' in event.target)) return

    const nodeId = String(event.target.id)
    const badgeIndex = getBadgeIndexFromEvent(event)
    if (badgeIndex == null) return

    const up = hasUpstreamBranch(topo, nodeId)
    const down = hasDownstreamBranch(topo, nodeId)

    if (up && badgeIndex === 0) {
      void toggleUpstream(nodeId)
      return
    }
    if (down && badgeIndex === (up ? 1 : 0)) {
      void toggleDownstream(nodeId)
    }
  }

  graph = new Graph({
    container,
    width,
    height,
    autoFit: 'view',
    padding: [48, 56, 48, 56],
    data,
    layout: {
      type: 'antv-dagre',
      rankdir: 'TB',
      nodesep: 36,
      ranksep: 64,
      controlPoints: true,
    },
    node: {
      type: 'rect',
      style: {
        size: () => [200, 56],
        radius: 4,
        lineWidth: 1,
        fill: (datum) => nodeStyle(getNodeData(datum).type).fill,
        stroke: (datum) => nodeStyle(getNodeData(datum).type).stroke,
        labelText: (datum) =>
          formatLabel(getNodeData(datum), String(datum.id), shareholderPercents),
        labelFill: (datum) => nodeStyle(getNodeData(datum).type).labelFill,
        labelFontSize: 12,
        labelFontWeight: (datum) => (getNodeData(datum).type === 'target' ? 600 : 500),
        labelLineHeight: 18,
        labelWordWrap: true,
        labelMaxLines: (datum) => {
          const nodeData = getNodeData(datum)
          if (nodeData.type === 'person' || nodeData.region) return 2
          return 3
        },
        labelMaxWidth: (datum) => (getNodeData(datum).type === 'person' ? 116 : 188),
        labelPlacement: 'center',
        labelTextAlign: 'center',
        cursor: (datum) => (hasCollapsibleBranch(String(datum.id), topo) ? 'pointer' : 'default'),
        badge: (datum) => hasCollapsibleBranch(String(datum.id), topo),
        badges: (datum) => {
          void collapseBadgeVersion
          return createCollapseBadges(
            String(datum.id),
            getNodeData(datum).type,
            topo,
            collapsedUpstream,
            collapsedDownstream,
          )
        },
        ports: [{ placement: 'top' }, { placement: 'bottom' }],
      },
      animation: NODE_VISIBILITY_ANIMATION,
      state: {
        active: {
          halo: false,
        },
      },
    },
    edge: {
      type: 'hover-ant-polyline',
      style: {
        lineWidth: 1,
        stroke: '#99ADD1',
        endArrow: true,
      },
      animation: EDGE_VISIBILITY_ANIMATION,
      state: {
        active: {
          halo: false,
          lineWidth: 2,
          stroke: '#1a5fb4',
          lineDash: [6, 4],
        },
      },
    },
    behaviors: [
      'drag-canvas',
      {
        type: 'zoom-canvas',
        sensitivity: 0.15,
      },
      {
        type: 'hover-activate',
        degree: 1,
        onHover: () => {
          requestAnimationFrame(() => syncAllHoverAntPolylineEdges(graph))
        },
        onHoverEnd: () => {
          stopAllHoverAntPolylineEdges(graph)
          requestAnimationFrame(() => syncAllHoverAntPolylineEdges(graph))
        },
      },
    ],
  })

  graph.on('node:pointerdown', handleBadgeClick)

  const controller: EquityGraphController = {
    async reset() {
      collapsedUpstream.clear()
      collapsedDownstream.clear()
      await applyVisibility()
      await graph.fitView()
    },
    async expandAll() {
      collapsedUpstream.clear()
      collapsedDownstream.clear()
      await applyVisibility()
    },
    async collapseAll() {
      collapsedUpstream.clear()
      collapsedDownstream.clear()
      for (const node of data.nodes) {
        if (hasUpstreamBranch(topo, node.id)) collapsedUpstream.add(node.id)
        if (hasDownstreamBranch(topo, node.id)) collapsedDownstream.add(node.id)
      }
      await applyVisibility()
    },
  }

  controllers.set(graph, controller)

  void graph.render()
  return graph
}

function getController(graph: G6Graph) {
  const controller = controllers.get(graph)
  if (!controller) throw new Error('Equity graph controller not found')
  return controller
}

export async function resetEquityGraph(graph: G6Graph, _data: EquityGraphData) {
  await getController(graph).reset()
}

export async function expandAllEquityNodes(graph: G6Graph) {
  await getController(graph).expandAll()
}

export async function collapseAllEquityNodes(graph: G6Graph) {
  await getController(graph).collapseAll()
}
