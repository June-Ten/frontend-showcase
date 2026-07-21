import dagre from '@dagrejs/dagre'
import { getNodeSize, type ComplianceLayout, type MindmapNodeKind } from './mindmapData'

interface LayoutNodeDef {
  id: string
  kind: MindmapNodeKind
}

interface LayoutEdgeDef {
  source: string
  target: string
}

const layoutNodeDefs: LayoutNodeDef[] = [
  { id: 'root', kind: 'file' },
  { id: 'summary', kind: 'section' },
  { id: 'business', kind: 'section' },
  { id: 'policy-top', kind: 'policy' },
  { id: 'policy-mid', kind: 'policy' },
  { id: 'policy-bot', kind: 'policy' },
  { id: 'analysis-top', kind: 'analysis-blue' },
  { id: 'analysis-mid', kind: 'analysis-yellow' },
  { id: 'analysis-bot', kind: 'analysis-yellow' },
  { id: 'advice-top', kind: 'advice' },
  { id: 'advice-mid', kind: 'advice' },
  { id: 'advice-bot', kind: 'advice' },
  { id: 'conclusion', kind: 'conclusion' },
]

const layoutEdgeDefs: LayoutEdgeDef[] = [
  { source: 'root', target: 'summary' },
  { source: 'summary', target: 'business' },
  { source: 'business', target: 'policy-top' },
  { source: 'business', target: 'policy-mid' },
  { source: 'business', target: 'policy-bot' },
  { source: 'policy-top', target: 'analysis-top' },
  { source: 'policy-mid', target: 'analysis-mid' },
  { source: 'policy-bot', target: 'analysis-bot' },
  { source: 'analysis-top', target: 'advice-top' },
  { source: 'analysis-mid', target: 'advice-mid' },
  { source: 'analysis-bot', target: 'advice-bot' },
  { source: 'advice-top', target: 'conclusion' },
  { source: 'advice-mid', target: 'conclusion' },
  { source: 'advice-bot', target: 'conclusion' },
]

export function computeComplianceLayout(): ComplianceLayout {
  const graph = new dagre.graphlib.Graph()
  graph.setGraph({ rankdir: 'LR', nodesep: 46, ranksep: 104 })
  graph.setDefaultEdgeLabel(() => ({}))

  for (const node of layoutNodeDefs) {
    const [width, height] = getNodeSize(node.kind)
    graph.setNode(node.id, { width, height })
  }
  for (const edge of layoutEdgeDefs) {
    graph.setEdge(edge.source, edge.target)
  }

  dagre.layout(graph)

  const positions: ComplianceLayout = new Map()
  for (const node of layoutNodeDefs) {
    const point = graph.node(node.id)
    if (point?.x == null || point?.y == null) {
      throw new Error(`Layout failed for node: ${node.id}`)
    }
    positions.set(node.id, { x: point.x, y: point.y })
  }
  return positions
}

// 兼容旧引用
export type { ComplianceLayout } from './mindmapData'
