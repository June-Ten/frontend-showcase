import { Graph, type Graph as G6Graph, type IPointerEvent, type NodeBadgeStyleProps } from '@antv/g6'
import type { EquityGraphData, EquityNodeType } from './equityData'
import {
  buildEquityTopology,
  computeEquityHiddenNodes,
  hasDownstreamBranch,
  hasUpstreamBranch,
} from './equityCollapse'
import { registerHoverAntPolyline, stopAllHoverAntPolylineEdges, syncAllHoverAntPolylineEdges } from './hoverAntPolylineEdge'

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

  let graph!: G6Graph

  async function applyVisibility() {
    const hidden = computeEquityHiddenNodes(topo, collapsedUpstream, collapsedDownstream)
    const visibility: Record<string, 'visible' | 'hidden'> = {}

    for (const node of data.nodes) {
      visibility[node.id] = hidden.has(node.id) ? 'hidden' : 'visible'
    }
    for (const edge of data.edges) {
      const id = String(edge.id)
      visibility[id] =
        hidden.has(edge.source) || hidden.has(edge.target) ? 'hidden' : 'visible'
    }

    stopAllHoverAntPolylineEdges(graph)
    // 勿调用 graph.draw()：全量绘制会重算样式并把 visibility 重置为 visible
    await graph.setElementVisibility(visibility, false)
  }

  async function toggleUpstream(nodeId: string) {
    if (collapsedUpstream.has(nodeId)) collapsedUpstream.delete(nodeId)
    else collapsedUpstream.add(nodeId)
    await applyVisibility()
  }

  async function toggleDownstream(nodeId: string) {
    if (collapsedDownstream.has(nodeId)) collapsedDownstream.delete(nodeId)
    else collapsedDownstream.add(nodeId)
    await applyVisibility()
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
        badges: (datum) =>
          createCollapseBadges(
            String(datum.id),
            getNodeData(datum).type,
            topo,
            collapsedUpstream,
            collapsedDownstream,
          ),
        ports: [{ placement: 'top' }, { placement: 'bottom' }],
      },
      state: {
        active: {
          halo: false,
        },
      },
    },
    edge: {
      type: 'hover-ant-polyline',
      style: {
        router: { type: 'orth' },
        lineWidth: 1,
        stroke: '#99ADD1',
        endArrow: true,
      },
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
