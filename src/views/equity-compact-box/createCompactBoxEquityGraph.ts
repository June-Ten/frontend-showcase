import {
  Graph,
  treeToGraphData,
  type AnimationOptions,
  type Graph as G6Graph,
  type IPointerEvent,
  type NodeData,
} from '@antv/g6'
import {
  fetchInvestChildren,
  investTreeInitialData,
  type InvestTreeChild,
  type InvestTreeData,
} from './investTreeData'
import {
  COMPACT_BOX_TREE_POLYLINE_TYPE,
  COMPACT_BOX_NODE_ZINDEX,
  registerCompactBoxTreePolyline,
  isCompactBoxVisibilityAnimating,
  setCompactBoxVisibilityAnimating,
  stopAllCompactBoxTreePolylineEdges,
  syncAllCompactBoxTreePolylineEdges,
} from './treePolylineEdge'
import {
  formatNodeLabel,
  getPenetrationNodeVisual,
  EDGE_PERCENT_LABEL_STYLE,
  PENETRATION_THEME,
} from './penetrationTheme'

registerCompactBoxTreePolyline()

const NODE_W = 200
const NODE_H = 62
const NODE_RADIUS = 10

/** 折叠/展开动画：默认 500ms 偏慢，且 align 会带动画布平移 */
const VISIBILITY_ANIM_DURATION = 300
const EXPAND_COLLAPSE_OPTIONS = { animation: true, align: false } as const

const NODE_VISIBILITY_ANIMATION: Record<string, AnimationOptions[]> = {
  expand: [
    { fields: ['opacity'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-out' },
    { fields: ['x', 'y'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-out' },
  ],
  collapse: [
    { fields: ['opacity'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-in' },
    { fields: ['x', 'y'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-in' },
  ],
}

const EDGE_VISIBILITY_ANIMATION: Record<string, AnimationOptions[]> = {
  expand: [
    { fields: ['opacity'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-out' },
    { fields: ['sourceNode', 'targetNode'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-out' },
  ],
  collapse: [
    { fields: ['opacity'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-in' },
    { fields: ['sourceNode', 'targetNode'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-in' },
  ],
  update: [
    { fields: ['sourceNode', 'targetNode'], duration: VISIBILITY_ANIM_DURATION, easing: 'ease-out' },
  ],
}

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
  console.log('treeToGraphData转换后的数据', data);

  for (const node of data.nodes ?? []) {
    if (canShowExpandBadge(node as NodeData)) {
      node.style = { ...(node.style ?? {}), collapsed: true }
    }
  }

  data.edges = (data.edges ?? []).map((edge) => {
    const targetNode = data.nodes?.find((node) => node.id === edge.target)
    const targetData = (targetNode?.data ?? {}) as Record<string, unknown>
    const percent = targetData.percent ? String(targetData.percent) : ''

    return {
      ...edge,
      sourcePort: 'bottom',
      targetPort: 'top',
      style: {
        labelText: percent,
        ...EDGE_PERCENT_LABEL_STYLE,
      },
    }
  })
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
    edges.map((edge) => {
      const target = graph.getNodeData(String(edge.target))
      const percent = getNodeData(target).percent
      return {
        id: edge.id,
        sourcePort: 'bottom',
        targetPort: 'top',
        style: {
          labelText: percent ? String(percent) : '',
          ...EDGE_PERCENT_LABEL_STYLE,
        },
      }
    }),
  )
}

function nodeColors(position?: string, kind?: string) {
  return getPenetrationNodeVisual(position, kind)
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
  const placement = collapseBadgePlacement(datum)

  return {
    text,
    placement,
    offsetY: placement === 'top' ? -12 : 12,
    padding: [0, 0, 0, 0],
    fontSize: 13,
    fontWeight: 600,
    backgroundWidth: 20,
    backgroundHeight: 20,
    backgroundRadius: 10,
    backgroundFill: PENETRATION_THEME.badgeFill,
    backgroundStroke: '#ffffff',
    backgroundLineWidth: 2,
    fill: PENETRATION_THEME.badgeText,
    textAlign: 'center' as const,
    textBaseline: 'middle' as const,
  }
}

function createLoadingBadge(datum: NodeData): CollapseBadgeStyle {
  const placement = collapseBadgePlacement(datum)

  return {
    text: '…',
    placement,
    offsetY: placement === 'top' ? -12 : 12,
    padding: [0, 0, 0, 0],
    fontSize: 14,
    fontWeight: 700,
    backgroundWidth: 22,
    backgroundHeight: 22,
    backgroundRadius: 11,
    backgroundFill: '#e6f4ff',
    backgroundStroke: PENETRATION_THEME.badgeFill,
    backgroundLineWidth: 2,
    fill: PENETRATION_THEME.badgeFill,
    textAlign: 'center' as const,
    textBaseline: 'middle' as const,
  }
}

function collapseExpandBadge(
  datum: NodeData,
  lazyLoadingNodeId: string | null,
  badgeVersion: number,
): CollapseBadgeStyle[] {
  void badgeVersion
  if (!canShowExpandBadge(datum)) return []

  const nodeId = String(datum.id)
  if (lazyLoadingNodeId === nodeId) {
    return [createLoadingBadge(datum)]
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

function clearActiveHoverStates(graph: G6Graph) {
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

async function runWithVisibilityAnimation(graph: G6Graph, task: () => Promise<void>) {
  clearActiveHoverStates(graph)
  stopAllCompactBoxTreePolylineEdges(graph)
  setCompactBoxVisibilityAnimating(true)
  try {
    await task()
  } finally {
    setCompactBoxVisibilityAnimating(false)
    syncAllCompactBoxTreePolylineEdges(graph)
  }
}

export async function createCompactBoxEquityGraph(
  container: HTMLElement,
  tree: InvestTreeData = investTreeInitialData,
): Promise<G6Graph> {
  let graph!: G6Graph
  /** 全局仅允许一个懒加载任务进行 */
  let lazyLoadingNodeId: string | null = null
  let badgeVersion = 0

  async function refreshBadges(nodeIds?: string[]) {
    badgeVersion += 1
    const ids = nodeIds ?? graph.getNodeData().map((node) => String(node.id))
    graph.updateNodeData(ids.map((id) => ({ id, style: { badgeVersion } })))
    await graph.draw()
  }

  async function handleBadgeClick(nodeId: string) {
    if (lazyLoadingNodeId !== null) return

    const nodeData = graph.getNodeData(nodeId)
    if (!canShowExpandBadge(nodeData)) return

    const collapsed = !!nodeData.style?.collapsed

    if (!collapsed) {
      await runWithVisibilityAnimation(graph, async () => {
        await graph.collapseElement(nodeId, EXPAND_COLLAPSE_OPTIONS)
        await refreshBadges([nodeId])
      })
      return
    }

    const loaded = hasLoadedChildren(nodeData)
    const lazy = hasLazyChildren(nodeData)

    if (!loaded && lazy) {
      lazyLoadingNodeId = nodeId
      await refreshBadges([nodeId])

      try {
        const children = await fetchInvestChildren(nodeId)

        lazyLoadingNodeId = null

        if (children.length === 0) {
          graph.updateNodeData([{ id: nodeId, data: { ...nodeData.data, hasChildren: false } }])
          await refreshBadges([nodeId])
          return
        }

        const childIds = children.map((child) => child.id)
        await runWithVisibilityAnimation(graph, async () => {
          graph.addChildrenData(nodeId, children.map(toLazyChildNodeData))
          patchTreeEdgePorts(graph, nodeId, childIds)
          await graph.expandElement(nodeId, EXPAND_COLLAPSE_OPTIONS)
        })
        await refreshBadges([nodeId])
      } catch {
        lazyLoadingNodeId = null
        await refreshBadges([nodeId])
      }
      return
    }

    await runWithVisibilityAnimation(graph, async () => {
      await graph.expandElement(nodeId, EXPAND_COLLAPSE_OPTIONS)
      await refreshBadges([nodeId])
    })
  }

  graph = new Graph({
    container,
    width: container.clientWidth || 800,
    height: container.clientHeight || 600,
    padding: 40,
    background: 'transparent',
    animation: {
      duration: VISIBILITY_ANIM_DURATION,
    },
    data: toGraphData(tree),
    layout: {
      type: 'compact-box',
      direction: 'V',
      getId: (d?: { id?: string | number }) => String(d?.id ?? ''),
      getWidth: () => NODE_W,
      getHeight: () => NODE_H,
      getVGap: () => 80,
      getHGap: () => 48,
      getSide: (child: { data?: Record<string, unknown> }) => {
        return getPosition(child) === 'up' ? 'left' : 'right'
      },
    },
    node: {
      type: 'rect',
      style: {
        size: [NODE_W, NODE_H],
        radius: NODE_RADIUS,
        zIndex: COMPACT_BOX_NODE_ZINDEX,
        fill: (d) => {
          const data = getNodeData(d)
          return nodeColors(data.position as string | undefined, data.kind as string | undefined).fill
        },
        stroke: (d) => {
          const data = getNodeData(d)
          return nodeColors(data.position as string | undefined, data.kind as string | undefined).stroke
        },
        lineWidth: (d) => {
          const data = getNodeData(d)
          return nodeColors(data.position as string | undefined, data.kind as string | undefined).lineWidth
        },
        shadowColor: (d) => {
          const data = getNodeData(d)
          return nodeColors(data.position as string | undefined, data.kind as string | undefined).shadowColor
        },
        shadowBlur: (d) => {
          const data = getNodeData(d)
          return nodeColors(data.position as string | undefined, data.kind as string | undefined).shadowBlur
        },
        shadowOffsetY: (d) => {
          const data = getNodeData(d)
          return nodeColors(data.position as string | undefined, data.kind as string | undefined).shadowOffsetY
        },
        labelText: (d) => {
          const data = getNodeData(d)
          const name = String(data.name ?? '')
          const percent = data.percent ? String(data.percent) : undefined
          return formatNodeLabel(name, percent, data.kind as string | undefined)
        },
        labelFill: (d) => {
          const data = getNodeData(d)
          return nodeColors(data.position as string | undefined, data.kind as string | undefined).label
        },
        labelFontSize: 12,
        labelFontWeight: (d: { data?: Record<string, unknown> }) =>
          (getNodeData(d).kind === 'target' ? 600 : 500),
        labelLineHeight: 18,
        labelPlacement: 'center',
        labelWordWrap: true,
        labelMaxWidth: NODE_W - 20,
        cursor: (datum) => (canShowExpandBadge(datum) ? 'pointer' : 'default'),
        badge: (datum) => canShowExpandBadge(datum),
        badges: (datum) => collapseExpandBadge(datum, lazyLoadingNodeId, badgeVersion),
        ports: [{ placement: 'top' }, { placement: 'bottom' }],
      },
      animation: NODE_VISIBILITY_ANIMATION,
      state: {
        active: {
          halo: false,
          stroke: PENETRATION_THEME.primary,
          lineWidth: 2,
          shadowColor: 'rgba(24, 144, 255, 0.45)',
          shadowBlur: 20,
          shadowOffsetY: 6,
        },
      },
    },
    edge: {
      type: COMPACT_BOX_TREE_POLYLINE_TYPE,
      style: {
        stroke: PENETRATION_THEME.edgeStroke,
        lineWidth: 1,
        endArrow: true,
        zIndex: 1,
        ...EDGE_PERCENT_LABEL_STYLE,
        labelText: (datum) => {
          const target = graph.getNodeData(String(datum.target))
          const percent = getNodeData(target).percent
          return percent ? String(percent) : ''
        },
      },
      state: {
        active: {
          halo: false,
          lineWidth: 2,
          stroke: PENETRATION_THEME.primary,
          zIndex: 3,
        },
      },
      animation: EDGE_VISIBILITY_ANIMATION,
    },
    behaviors: [
      {
        type: 'drag-canvas',
        enable: (event: IPointerEvent) => !isPointerOnNodeBadge(event),
      },
      { type: 'zoom-canvas', sensitivity: 0.15 },
      {
        type: 'hover-activate',
        degree: 1,
        enable: (event: IPointerEvent) =>
          !isPointerOnNodeBadge(event) && lazyLoadingNodeId === null && !isCompactBoxVisibilityAnimating(),
        onHover: () => {
          if (isCompactBoxVisibilityAnimating()) return
          requestAnimationFrame(() => syncAllCompactBoxTreePolylineEdges(graph))
        },
        onHoverEnd: () => {
          if (isCompactBoxVisibilityAnimating()) return
          stopAllCompactBoxTreePolylineEdges(graph)
          requestAnimationFrame(() => syncAllCompactBoxTreePolylineEdges(graph))
        },
      },
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
