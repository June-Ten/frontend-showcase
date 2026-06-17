import {
  Graph,
  treeToGraphData,
  type Graph as G6Graph,
  type IPointerEvent,
  type NodeData,
} from '@antv/g6'
import {
  fetchInvestChildren,
  investTreeInitialData,
  type InvestTreeChild,
  type InvestTreeData,
} from './testGraphData'
import { G6_TEST_TREE_POLYLINE_TYPE, registerG6TestTreePolyline } from './g6TestTreePolylineEdge'

registerG6TestTreePolyline()

const NODE_W = 168
const NODE_H = 46

function getPosition(hierarchyNode?: { data?: Record<string, unknown> }) {
  const raw = hierarchyNode?.data
  if (!raw) return undefined
  const inner = raw.data as Record<string, unknown> | undefined
  return (inner?.position ?? raw.position) as string | undefined
}

function getNodeData(datum: { data?: Record<string, unknown> }) {
  return (datum.data ?? {}) as Record<string, unknown>
}

function isRootNode(datum: NodeData) {
  return getNodeData(datum).kind === 'target'
}

function hasLoadedChildren(datum: NodeData) {
  return (datum.children?.length ?? 0) > 0
}

function hasLazyChildren(datum: NodeData) {
  return getNodeData(datum).hasChildren === true
}

function canShowExpandBadge(datum: NodeData) {
  if (isRootNode(datum)) return false
  return hasLoadedChildren(datum) || hasLazyChildren(datum)
}

function toGraphData(tree: InvestTreeData) {
  const data = treeToGraphData(tree)

  for (const node of data.nodes ?? []) {
    if (canShowExpandBadge(node as NodeData)) {
      node.style = { ...(node.style ?? {}), collapsed: true }
    }
  }

  data.edges = (data.edges ?? []).map((edge) => ({
    ...edge,
    sourcePort: 'bottom',
    targetPort: 'top',
  }))
  return data
}

function toLazyChildNodeData(child: InvestTreeChild): NodeData {
  return {
    id: child.id,
    data: { ...child.data },
    style: child.data.hasChildren ? { collapsed: true } : undefined,
  }
}

function patchTreeEdgePorts(graph: G6Graph, sourceId: string, targetIds: string[]) {
  const targetSet = new Set(targetIds)
  const edges = graph.getEdgeData().filter(
    (edge) => edge.source === sourceId && targetSet.has(String(edge.target)),
  )
  if (edges.length === 0) return

  graph.updateEdgeData(
    edges.map((edge) => ({
      id: edge.id,
      sourcePort: 'bottom',
      targetPort: 'top',
    })),
  )
}

function nodeColors(position?: string, kind?: string) {
  if (kind === 'target') {
    return { fill: '#364fc7', stroke: '#24318f', label: '#ffffff' }
  }
  if (position === 'up') {
    return kind === 'person'
      ? { fill: '#fff4e6', stroke: '#fd7e14', label: '#8a4b08' }
      : { fill: '#e7f5ff', stroke: '#339af0', label: '#1864ab' }
  }
  return { fill: '#ebfbee', stroke: '#51cf66', label: '#2b8a3e' }
}

function collapseBadgePlacement(datum: NodeData): 'top' | 'bottom' {
  const data = getNodeData(datum)
  return data.position === 'up' ? 'top' : 'bottom'
}

interface CollapseBadgeStyle {
  text: string
  placement: 'top' | 'bottom'
  offsetY: number
  padding: [number, number, number, number]
  fontSize: number
  fontWeight: number
  backgroundWidth: number
  backgroundHeight: number
  backgroundRadius: number
  backgroundFill: string
  backgroundStroke: string
  backgroundLineWidth: number
  fill: string
  textAlign: 'center'
  textBaseline: 'middle'
}

function createCollapseBadge(datum: NodeData, text: string): CollapseBadgeStyle {
  const data = getNodeData(datum)
  const colors = nodeColors(data.position as string | undefined, data.kind as string | undefined)
  const placement = collapseBadgePlacement(datum)

  return {
    text,
    placement,
    offsetY: placement === 'top' ? -10 : 10,
    padding: [0, 0, 0, 0],
    fontSize: 11,
    fontWeight: 600,
    backgroundWidth: 18,
    backgroundHeight: 18,
    backgroundRadius: 9,
    backgroundFill: '#ffffff',
    backgroundStroke: colors.stroke,
    backgroundLineWidth: 1.5,
    fill: colors.stroke,
    textAlign: 'center' as const,
    textBaseline: 'middle' as const,
  }
}

function collapseExpandBadge(
  datum: NodeData,
  loadingNodeIds: Set<string>,
  badgeVersion: number,
): CollapseBadgeStyle[] {
  void badgeVersion
  if (!canShowExpandBadge(datum)) return []

  const nodeId = String(datum.id)
  if (loadingNodeIds.has(nodeId)) {
    return [createCollapseBadge(datum, '…')]
  }

  const collapsed = !!datum.style?.collapsed
  return [createCollapseBadge(datum, collapsed ? '+' : '−')]
}

function isPointerOnNodeBadge(event: IPointerEvent) {
  if (event.targetType !== 'node') return false

  let shape: { className?: string; parentElement?: unknown } | null = event.originalTarget
  const nodeElement = event.target

  while (shape && shape !== nodeElement) {
    if (typeof shape.className === 'string' && shape.className.startsWith('badge-')) {
      return true
    }
    shape = (shape.parentElement ?? null) as typeof shape
  }

  return false
}

export async function createG6TestGraph(
  container: HTMLElement,
  tree: InvestTreeData = investTreeInitialData,
): Promise<G6Graph> {
  let graph!: G6Graph
  const loadingNodeIds = new Set<string>()
  let badgeVersion = 0

  async function refreshBadges(nodeIds?: string[]) {
    badgeVersion += 1
    const ids = nodeIds ?? graph.getNodeData().map((node) => String(node.id))
    graph.updateNodeData(ids.map((id) => ({ id, style: { badgeVersion } })))
    await graph.draw()
  }

  async function handleBadgeClick(nodeId: string) {
    if (loadingNodeIds.has(nodeId)) return

    const nodeData = graph.getNodeData(nodeId)
    if (!canShowExpandBadge(nodeData)) return

    const collapsed = !!nodeData.style?.collapsed

    if (!collapsed) {
      await graph.collapseElement(nodeId, { animation: true, align: true })
      await refreshBadges([nodeId])
      return
    }

    const loaded = hasLoadedChildren(nodeData)
    const lazy = hasLazyChildren(nodeData)

    if (!loaded && lazy) {
      loadingNodeIds.add(nodeId)
      await refreshBadges([nodeId])
      try {
        const children = await fetchInvestChildren(nodeId)
        if (children.length === 0) {
          graph.updateNodeData([{ id: nodeId, data: { ...nodeData.data, hasChildren: false } }])
          await refreshBadges([nodeId])
          return
        }
        const childIds = children.map((child) => child.id)
        graph.addChildrenData(nodeId, children.map(toLazyChildNodeData))
        patchTreeEdgePorts(graph, nodeId, childIds)
        await graph.expandElement(nodeId, { animation: true, align: true })
        await refreshBadges([nodeId])
      } finally {
        loadingNodeIds.delete(nodeId)
      }
      return
    }

    await graph.expandElement(nodeId, { animation: true, align: true })
    await refreshBadges([nodeId])
  }

  graph = new Graph({
    container,
    width: container.clientWidth || 800,
    height: container.clientHeight || 600,
    padding: 40,
    data: toGraphData(tree),
    layout: {
      type: 'compact-box',
      direction: 'V',
      getId: (d?: { id?: string | number }) => String(d?.id ?? ''),
      getWidth: () => NODE_W,
      getHeight: () => NODE_H,
      getVGap: () => 72,
      getHGap: () => 36,
      getSide: (child: { data?: Record<string, unknown> }) => {
        return getPosition(child) === 'up' ? 'left' : 'right'
      },
    },
    node: {
      type: 'rect',
      style: {
        size: [NODE_W, NODE_H],
        radius: 8,
        lineWidth: 1.5,
        fill: (d) => {
          const data = getNodeData(d)
          return nodeColors(data.position as string | undefined, data.kind as string | undefined).fill
        },
        stroke: (d) => {
          const data = getNodeData(d)
          return nodeColors(data.position as string | undefined, data.kind as string | undefined).stroke
        },
        labelText: (d) => {
          const data = getNodeData(d)
          const name = String(data.name ?? '')
          const percent = data.percent ? `\n${data.percent}` : ''
          return `${name}${percent}`
        },
        labelFill: (d) => {
          const data = getNodeData(d)
          return nodeColors(data.position as string | undefined, data.kind as string | undefined).label
        },
        labelFontSize: 12,
        labelLineHeight: 16,
        labelPlacement: 'center',
        labelWordWrap: true,
        labelMaxWidth: NODE_W - 16,
        cursor: (datum) => (canShowExpandBadge(datum) ? 'pointer' : 'default'),
        badge: (datum) => canShowExpandBadge(datum),
        badges: (datum) => collapseExpandBadge(datum, loadingNodeIds, badgeVersion),
        ports: [{ placement: 'top' }, { placement: 'bottom' }],
      },
    },
    edge: {
      type: G6_TEST_TREE_POLYLINE_TYPE,
      style: {
        stroke: '#868e96',
        lineWidth: 1,
        endArrow: true,
      },
      animation: {
        collapse: [{ fields: ['sourceNode', 'targetNode'] }],
        expand: [{ fields: ['sourceNode', 'targetNode'] }],
        update: [{ fields: ['sourceNode', 'targetNode'] }],
      },
    },
    behaviors: [
      {
        type: 'drag-canvas',
        enable: (event: IPointerEvent) => !isPointerOnNodeBadge(event),
      },
      { type: 'zoom-canvas', sensitivity: 0.15 },
    ],
  })

  graph.on('node:pointerup', (event: IPointerEvent) => {
    if (!isPointerOnNodeBadge(event)) return
    if (!('id' in event.target)) return
    void handleBadgeClick(String(event.target.id))
  })

  await graph.render()
  return graph
}
