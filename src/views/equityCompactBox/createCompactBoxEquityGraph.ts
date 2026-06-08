import {
  Graph,
  isCollapsed,
  treeToGraphData,
  type Graph as G6Graph,
  type GraphData,
  type IPointerEvent,
  type NodeData,
} from '@antv/g6'
import type { CompactEquityGraphData, CompactEquityNodeType } from './compactEquityData'
import { registerStableTreePolyline, stopAllStableTreePolylineEdges, syncAllStableTreePolylineEdges } from './stableTreePolylineEdge'

registerStableTreePolyline()

interface CompactEquityGraphNodeData {
  name: string
  type?: CompactEquityNodeType
  region?: string
}

const NODE_WIDTH = 200
const NODE_HEIGHT = 56
const H_GAP = 44
const V_GAP = 92

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

function nodeStyle(type?: CompactEquityNodeType) {
  return type === 'target' ? TARGET_STYLE : OFFSHORE_STYLE
}

function formatLabel(data: CompactEquityGraphNodeData) {
  if (data.type === 'person') return data.name
  if (data.region) return `${data.name}\n(${data.region})`
  return data.name
}

function getNodeData(datum: { data?: Record<string, unknown> }): CompactEquityGraphNodeData {
  return (datum.data ?? {}) as unknown as CompactEquityGraphNodeData
}

function hasCollapsibleChildren(datum: NodeData) {
  return (datum.children?.length ?? 0) > 0
}

/** 折叠/展开：节点底边居中的圆形 +/- 按钮 */
function collapseExpandBadge(datum: NodeData) {
  if (!hasCollapsibleChildren(datum)) return []
  const collapsed = !!datum.style?.collapsed
  const isTarget = getNodeData(datum).type === 'target'
  return [
    {
      text: collapsed ? '+' : '−',
      placement: 'bottom' as const,
      offsetY: 10,
      padding: [6, 6, 6, 6],
      fontSize: 13,
      fontWeight: 600,
      backgroundRadius: '50%',
      backgroundFill: '#ffffff',
      backgroundStroke: isTarget ? '#1a5fb4' : '#7eb2dd',
      backgroundLineWidth: 1.5,
      fill: '#1a5fb4',
      textAlign: 'center' as const,
      textBaseline: 'middle' as const,
    },
  ]
}

function toCompactBoxData(tree: CompactEquityGraphData) {
  const graphData = treeToGraphData(tree) as GraphData

  // Force parent->child edges to connect bottom-to-top ports.
  graphData.edges = (graphData.edges ?? []).map((edge) => ({
    ...edge,
    sourcePort: 'bottom',
    targetPort: 'top',
  })) as typeof graphData.edges

  return graphData
}

function debugCompactBoxData(data: unknown) {
  const graphData = data as {
    nodes?: Array<{ id?: string; data?: { name?: string } }>
    edges?: Array<{ source?: string; target?: string }>
  }
  console.log('[compact-box] nodes:', (graphData.nodes ?? []).map((n) => ({ id: n.id, name: n.data?.name })))
  console.log('[compact-box] edges:', (graphData.edges ?? []).map((e) => `${e.source} -> ${e.target}`))
}

/** G6 默认边层级为 max(端点) - 1；高亮边略高但仍低于节点，避免遮住 +/- 按钮 */
function getEdgeEndpointMaxZIndex(graph: G6Graph, source: string, target: string) {
  return Math.max(graph.getElementZIndex(source), graph.getElementZIndex(target))
}

function getDefaultEdgeZIndex(graph: G6Graph, source: string, target: string) {
  return getEdgeEndpointMaxZIndex(graph, source, target) - 1
}

function getActiveEdgeZIndex(graph: G6Graph, source: string, target: string) {
  return getEdgeEndpointMaxZIndex(graph, source, target) - 0.5
}

function getBackgroundEdgeZIndex(graph: G6Graph, source: string, target: string) {
  return getEdgeEndpointMaxZIndex(graph, source, target) - 2
}

function isGraphCollapsingExpanding(graph: G6Graph) {
  return (graph as unknown as { isCollapsingExpanding?: boolean }).isCollapsingExpanding === true
}

function createEdgeHoverLayerController(graph: G6Graph) {
  function emphasizeRelatedEdges(nodeId: string) {
    if (isGraphCollapsingExpanding(graph)) return
    const relatedIds = new Set(graph.getRelatedEdgesData(nodeId).map((edge) => String(edge.id)))
    const zIndexes: Record<string, number> = {}

    graph.getEdgeData().forEach((edge) => {
      const id = String(edge.id)
      if (relatedIds.has(id)) return
      zIndexes[id] = getBackgroundEdgeZIndex(graph, String(edge.source), String(edge.target))
    })

    if (Object.keys(zIndexes).length > 0) {
      void graph.setElementZIndex(zIndexes)
    }
  }

  function resetEdgeLayers() {
    if (isGraphCollapsingExpanding(graph)) return
    const zIndexes = Object.fromEntries(
      graph.getEdgeData().map((edge) => [
        String(edge.id),
        getDefaultEdgeZIndex(graph, String(edge.source), String(edge.target)),
      ]),
    )

    if (Object.keys(zIndexes).length > 0) {
      void graph.setElementZIndex(zIndexes)
    }
  }

  return { emphasizeRelatedEdges, resetEdgeLayers }
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

function getNodeHoverActiveIds(graph: G6Graph, nodeId: string) {
  const ids = new Set<string>([nodeId])
  for (const edge of graph.getRelatedEdgesData(nodeId)) {
    ids.add(String(edge.id))
    ids.add(String(edge.source))
    ids.add(String(edge.target))
  }
  return ids
}

function clearActiveHoverStates(graph: G6Graph) {
  if (isGraphCollapsingExpanding(graph)) return
  const updates: Record<string, string[]> = {}

  for (const datum of graph.getElementDataByState('node', 'active')) {
    const id = String(datum.id)
    updates[id] = graph.getElementState(id).filter((state) => state !== 'active')
  }

  for (const datum of graph.getElementDataByState('edge', 'active')) {
    const id = String(datum.id)
    updates[id] = graph.getElementState(id).filter((state) => state !== 'active')
  }

  if (Object.keys(updates).length > 0) {
    void graph.setElementState(updates, false)
  }
}

function applyActiveHoverStates(graph: G6Graph, nodeId: string) {
  if (isGraphCollapsingExpanding(graph)) return
  const updates: Record<string, string[]> = {}

  for (const id of getNodeHoverActiveIds(graph, nodeId)) {
    const current = graph.getElementState(id)
    if (!current.includes('active')) {
      updates[id] = [...current, 'active']
    }
  }

  if (Object.keys(updates).length > 0) {
    void graph.setElementState(updates, false)
  }
}

function createNodeHoverController(
  graph: G6Graph,
  edgeHoverLayerController: ReturnType<typeof createEdgeHoverLayerController>,
) {
  let hoveredNodeId: string | null = null

  function endHover(force = false) {
    if (!force && !hoveredNodeId) return

    clearActiveHoverStates(graph)
    stopAllStableTreePolylineEdges(graph)
    requestAnimationFrame(() => syncAllStableTreePolylineEdges(graph))

    if (hoveredNodeId || force) {
      edgeHoverLayerController.resetEdgeLayers()
    }
    hoveredNodeId = null
  }

  function startHover(nodeId: string) {
    if (isGraphCollapsingExpanding(graph)) return
    if (hoveredNodeId === nodeId) return
    if (hoveredNodeId) endHover()
    applyActiveHoverStates(graph, nodeId)
    edgeHoverLayerController.emphasizeRelatedEdges(nodeId)
    requestAnimationFrame(() => syncAllStableTreePolylineEdges(graph))
    hoveredNodeId = nodeId
  }

  function handleNodePointer(event: IPointerEvent) {
    if (isGraphCollapsingExpanding(graph)) return
    if (!('id' in event.target)) return
    const nodeId = String(event.target.id)

    if (isPointerOnNodeBadge(event)) {
      endHover()
      return
    }

    startHover(nodeId)
  }

  const onEnter = (event: IPointerEvent) => {
    if (event.targetType !== 'node') return
    handleNodePointer(event)
  }

  const onMove = (event: IPointerEvent) => {
    if (event.targetType !== 'node') return
    handleNodePointer(event)
  }

  const onLeave = (event: IPointerEvent) => {
    if (event.targetType !== 'node' || !('id' in event.target)) return
    if (hoveredNodeId === String(event.target.id)) {
      endHover()
    }
  }

  const onPointerDown = (event: IPointerEvent) => {
    if (event.targetType !== 'node') return
    if (isPointerOnNodeBadge(event)) {
      endHover(true)
    }
  }

  graph.on('node:pointerenter', onEnter)
  graph.on('node:pointermove', onMove)
  graph.on('node:pointerleave', onLeave)
  graph.on('node:pointerdown', onPointerDown)

  return { endHover }
}

export function createCompactBoxEquityGraph(container: HTMLElement, data: CompactEquityGraphData): G6Graph {
  const width = container.clientWidth || 800
  const height = container.clientHeight || 600
  const compactLayoutData = toCompactBoxData(data)
  debugCompactBoxData(compactLayoutData)

  let graph!: G6Graph
  let edgeHoverLayerController!: ReturnType<typeof createEdgeHoverLayerController>
  let nodeHoverController!: ReturnType<typeof createNodeHoverController>

  graph = new Graph({
    container,
    width,
    height,
    data: compactLayoutData,
    layout: {
      type: 'compact-box',
      direction: 'V',
      getId: (d?: { id?: string | number }) => String(d?.id ?? ''),
      getHeight: () => NODE_HEIGHT,
      getWidth: () => NODE_WIDTH,
      getVGap: () => V_GAP,
      getHGap: () => H_GAP,
    },
    behaviors: [
      {
        type: 'zoom-canvas',
        sensitivity: 0.5,
      },
      {
        type: 'drag-canvas',
      },
      {
        type: 'collapse-expand',
        key: 'collapse-expand',
        trigger: 'click',
        animation: true,
        align: true,
        enable: (event: IPointerEvent) => {
          if (isGraphCollapsingExpanding(graph)) return false
          if (event.targetType !== 'node') return false
          const { target } = event
          if (!('id' in target)) return false
          if (!isPointerOnNodeBadge(event)) return false
          const nodeData = graph.getNodeData(target.id)
          return hasCollapsibleChildren(nodeData)
        },
        onCollapse: () => {
          nodeHoverController?.endHover(true)
        },
        onExpand: () => {
          nodeHoverController?.endHover(true)
        },
      },
    ],
    node: {
      type: 'rect',
      style: {
        size: () => [NODE_WIDTH, NODE_HEIGHT],
        fill: (datum) => nodeStyle(getNodeData(datum).type).fill,
        stroke: (datum) => nodeStyle(getNodeData(datum).type).stroke,
        lineWidth: 1,
        labelText: (datum) => formatLabel(getNodeData(datum)),
        labelPlacement: 'center',
        labelFill: (datum) => nodeStyle(getNodeData(datum).type).labelFill,
        labelFontSize: 12,
        labelLineHeight: 16,
        cursor: (datum) => (hasCollapsibleChildren(datum) ? 'pointer' : 'default'),
        badge: (datum) => hasCollapsibleChildren(datum),
        badgeFontSize: 13,
        badgeFontWeight: 600,
        badgePadding: [6, 6, 6, 6],
        badgeBackgroundRadius: '50%',
        badges: (datum) => collapseExpandBadge(datum),
        ports: [
          { key: 'top', placement: 'top' },
          { key: 'bottom', placement: 'bottom' },
        ],
      },
      state: {
        active: {
          halo: false,
        },
      },
    },
    edge: {
      type: 'stable-tree-polyline',
      style: {
        lineWidth: 1,
        stroke: '#99ADD1',
        endArrow: true,
      },
      state: {
        active: {
          halo: false,
          lineWidth: 2,
          stroke: '#1a5fb4',
          zIndex: (datum) => getActiveEdgeZIndex(graph, String(datum.source), String(datum.target)),
        },
      },
      animation: {
        collapse: [{ fields: ['sourceNode', 'targetNode'] }],
        expand: [{ fields: ['sourceNode', 'targetNode'] }],
        update: [{ fields: ['sourceNode', 'targetNode'] }],
      },
    },
  })

  edgeHoverLayerController = createEdgeHoverLayerController(graph)
  nodeHoverController = createNodeHoverController(graph, edgeHoverLayerController)
  graph.render()
  return graph
}

export async function resetCompactBoxEquityGraph(graph: G6Graph, data: CompactEquityGraphData) {
  const compactLayoutData = toCompactBoxData(data)
  debugCompactBoxData(compactLayoutData)
  graph.setData(compactLayoutData)
  await graph.render()
}

function getCollapsibleNodes(graph: G6Graph) {
  return graph.getNodeData().filter((node) => hasCollapsibleChildren(node))
}

export async function collapseAllCompactBoxNodes(graph: G6Graph) {
  const nodes = getCollapsibleNodes(graph).sort((a, b) => (b.depth ?? 0) - (a.depth ?? 0))
  for (const node of nodes) {
    if (!isCollapsed(graph.getNodeData(node.id))) {
      await graph.collapseElement(node.id, { animation: true, align: true })
    }
  }
}

export async function expandAllCompactBoxNodes(graph: G6Graph) {
  const nodes = getCollapsibleNodes(graph).sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0))
  for (const node of nodes) {
    if (isCollapsed(graph.getNodeData(node.id))) {
      await graph.expandElement(node.id, { animation: true, align: true })
    }
  }
}
