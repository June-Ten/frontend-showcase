import dagre from '@dagrejs/dagre'
import type { EquityEdgeItem, EquityGraphData } from './equityData'

const NODE_WIDTH = 200
const NODE_HEIGHT = 56
const RANKSEP = 64

export function computeEquityNodePositions(data: EquityGraphData): Map<string, { x: number; y: number }> {
  const graph = new dagre.graphlib.Graph()
  graph.setGraph({
    rankdir: 'TB',
    nodesep: 36,
    ranksep: RANKSEP,
    marginx: 0,
    marginy: 0,
  })
  graph.setDefaultEdgeLabel(() => ({}))

  for (const node of data.nodes) {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const edge of data.edges) {
    graph.setEdge(edge.source, edge.target)
  }

  dagre.layout(graph)

  return new Map(
    data.nodes.map((node) => {
      const positioned = graph.node(node.id)
      return [node.id, { x: positioned.x, y: positioned.y }]
    }),
  )
}

export function applyNodePositions(
  data: EquityGraphData,
  positions: Map<string, { x: number; y: number }>,
): EquityGraphData {
  return {
    nodes: data.nodes.map((node) => {
      const pos = positions.get(node.id)
      if (!pos) return node
      return {
        ...node,
        style: {
          ...(node.style as object | undefined),
          x: pos.x,
          y: pos.y,
        },
      }
    }),
    edges: data.edges,
  }
}

function collectShareholderAncestors(targetId: string, edges: EquityEdgeItem[]) {
  const parents = new Map<string, string[]>()
  for (const edge of edges) {
    if (edge.data?.relation !== 'shareholder') continue
    const list = parents.get(edge.target) ?? []
    list.push(edge.source)
    parents.set(edge.target, list)
  }

  const ids = new Set<string>([targetId])
  const queue = [...(parents.get(targetId) ?? [])]
  while (queue.length > 0) {
    const id = queue.shift()!
    if (ids.has(id)) continue
    ids.add(id)
    for (const parent of parents.get(id) ?? []) queue.push(parent)
  }

  return ids
}

function collectInvestmentDescendants(targetId: string, edges: EquityEdgeItem[]) {
  const children = new Map<string, string[]>()
  for (const edge of edges) {
    if (edge.data?.relation !== 'investment') continue
    const list = children.get(edge.source) ?? []
    list.push(edge.target)
    children.set(edge.source, list)
  }

  const ids = new Set<string>([targetId])
  const queue = [...(children.get(targetId) ?? [])]
  while (queue.length > 0) {
    const id = queue.shift()!
    if (ids.has(id)) continue
    ids.add(id)
    for (const child of children.get(id) ?? []) queue.push(child)
  }

  return ids
}

/** 股东链与对外投资分树布局，根节点居中衔接上下半图 */
export function layoutPenetrationGraph(
  data: EquityGraphData,
  targetId = 'n-target',
): EquityGraphData {
  const shareholderEdges = data.edges.filter((edge) => edge.data?.relation === 'shareholder')
  const investmentEdges = data.edges.filter((edge) => edge.data?.relation === 'investment')

  const upstreamIds = collectShareholderAncestors(targetId, shareholderEdges)
  const downstreamIds = collectInvestmentDescendants(targetId, investmentEdges)

  const upstreamNodes = data.nodes.filter((node) => upstreamIds.has(node.id))
  const downstreamNodes = data.nodes.filter((node) => downstreamIds.has(node.id))
  const upstreamEdgeList = shareholderEdges.filter(
    (edge) => upstreamIds.has(edge.source) && upstreamIds.has(edge.target),
  )
  const downstreamEdgeList = investmentEdges.filter(
    (edge) => downstreamIds.has(edge.source) && downstreamIds.has(edge.target),
  )

  const upstreamPositions = computeEquityNodePositions({
    nodes: upstreamNodes,
    edges: upstreamEdgeList,
  })
  const downstreamPositions = computeEquityNodePositions({
    nodes: downstreamNodes,
    edges: downstreamEdgeList,
  })

  const targetUpstream = upstreamPositions.get(targetId)
  const targetDownstream = downstreamPositions.get(targetId)
  if (!targetUpstream || !targetDownstream) {
    return applyNodePositions(data, computeEquityNodePositions(data))
  }

  const merged = new Map<string, { x: number; y: number }>()
  merged.set(targetId, { x: 0, y: 0 })

  for (const [id, pos] of upstreamPositions) {
    if (id === targetId) continue
    merged.set(id, {
      x: pos.x - targetUpstream.x,
      y: pos.y - targetUpstream.y,
    })
  }

  for (const [id, pos] of downstreamPositions) {
    if (id === targetId) continue
    merged.set(id, {
      x: pos.x - targetDownstream.x,
      y: pos.y - targetDownstream.y,
    })
  }

  return applyNodePositions(data, merged)
}

export function layoutEquityGraphData(data: EquityGraphData, targetId = 'n-target'): EquityGraphData {
  return layoutPenetrationGraph(data, targetId)
}

/** 按锚点节点对齐：保持与全量布局的相对间距，适配首屏子集坐标 */
export function alignBranchToAnchor(
  data: EquityGraphData,
  anchorNodeId: string,
  anchorRenderedPos: { x: number; y: number },
  masterPositions: Map<string, { x: number; y: number }>,
): EquityGraphData {
  const anchorMaster = masterPositions.get(anchorNodeId)
  if (!anchorMaster) return data

  const dx = anchorRenderedPos.x - anchorMaster.x
  const dy = anchorRenderedPos.y - anchorMaster.y

  const aligned = new Map(
    data.nodes.map((node) => {
      const master = masterPositions.get(node.id)
      if (!master) return [node.id, { x: 0, y: 0 }] as const
      return [node.id, { x: master.x + dx, y: master.y + dy }] as const
    }),
  )

  return applyNodePositions(data, aligned)
}
