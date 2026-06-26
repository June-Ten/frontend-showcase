import type { EdgeData, GraphData, NodeData } from '@antv/g6'

export type ComplianceLayout = Map<string, { x: number; y: number }>

export type MindmapNodeKind =
  | 'file'
  | 'section'
  | 'policy'
  | 'analysis-blue'
  | 'analysis-yellow'
  | 'advice'
  | 'conclusion'

/** 合规判定：中间节点疑似违规，最终节点合规/违规 */
export type ComplianceVerdict = 'compliant' | 'suspected' | 'violation'

export interface MindmapNodePayload extends Record<string, unknown> {
  kind: MindmapNodeKind
  title: string
  subtitle?: string
  verdict?: ComplianceVerdict
}

interface ComplianceNodeDef {
  id: string
  data: MindmapNodePayload
}

interface ComplianceEdgeDef {
  id: string
  source: string
  target: string
}

export function complianceEdgeId(source: string, target: string) {
  return `${source}__${target}`
}

const complianceNodeDefs: ComplianceNodeDef[] = [
  { id: 'root', data: { kind: 'file', title: '资质证书.docx' } },
  { id: 'summary', data: { kind: 'section', title: '综合管理要求' } },
  { id: 'business', data: { kind: 'section', title: '业务背景' } },
  {
    id: 'policy-top',
    data: { kind: 'policy', title: '国家政策依据', subtitle: '政府采购' },
  },
  {
    id: 'policy-mid',
    data: { kind: 'policy', title: '国家政策依据', subtitle: '数据安全' },
  },
  {
    id: 'policy-bot',
    data: { kind: 'policy', title: '国家政策依据', subtitle: '工程监管' },
  },
  {
    id: 'analysis-top',
    data: { kind: 'analysis-blue', title: '采购合同分析', verdict: 'compliant' },
  },
  {
    id: 'analysis-mid',
    data: { kind: 'analysis-yellow', title: '服务合同分析', verdict: 'suspected' },
  },
  {
    id: 'analysis-bot',
    data: { kind: 'analysis-yellow', title: '工程合同分析', verdict: 'suspected' },
  },
  {
    id: 'advice-top',
    data: { kind: 'advice', title: '合规判定建议', verdict: 'compliant' },
  },
  {
    id: 'advice-mid',
    data: { kind: 'advice', title: '合规判定建议', verdict: 'suspected' },
  },
  {
    id: 'advice-bot',
    data: { kind: 'advice', title: '合规判定建议', verdict: 'suspected' },
  },
  {
    id: 'conclusion',
    data: { kind: 'conclusion', title: '最终结论', verdict: 'violation' },
  },
]

const complianceEdgeDefs: ComplianceEdgeDef[] = [
  { id: complianceEdgeId('root', 'summary'), source: 'root', target: 'summary' },
  { id: complianceEdgeId('summary', 'business'), source: 'summary', target: 'business' },
  { id: complianceEdgeId('business', 'policy-top'), source: 'business', target: 'policy-top' },
  { id: complianceEdgeId('business', 'policy-mid'), source: 'business', target: 'policy-mid' },
  { id: complianceEdgeId('business', 'policy-bot'), source: 'business', target: 'policy-bot' },
  { id: complianceEdgeId('policy-top', 'analysis-top'), source: 'policy-top', target: 'analysis-top' },
  { id: complianceEdgeId('policy-mid', 'analysis-mid'), source: 'policy-mid', target: 'analysis-mid' },
  { id: complianceEdgeId('policy-bot', 'analysis-bot'), source: 'policy-bot', target: 'analysis-bot' },
  { id: complianceEdgeId('analysis-top', 'advice-top'), source: 'analysis-top', target: 'advice-top' },
  { id: complianceEdgeId('analysis-mid', 'advice-mid'), source: 'analysis-mid', target: 'advice-mid' },
  { id: complianceEdgeId('analysis-bot', 'advice-bot'), source: 'analysis-bot', target: 'advice-bot' },
  { id: complianceEdgeId('advice-top', 'conclusion'), source: 'advice-top', target: 'conclusion' },
  { id: complianceEdgeId('advice-mid', 'conclusion'), source: 'advice-mid', target: 'conclusion' },
  { id: complianceEdgeId('advice-bot', 'conclusion'), source: 'advice-bot', target: 'conclusion' },
]

export type PlaybackStep =
  | { kind: 'node'; id: string }
  | { kind: 'edge'; source: string; target: string }

export interface PlaybackLayer {
  id: string
  label: string
  steps: PlaybackStep[]
}

/** 三层水平展开：主干 → 政策依据 → 分析/建议/结论 */
export const COMPLIANCE_PLAYBACK_LAYERS: PlaybackLayer[] = [
  {
    id: 'layer-trunk',
    label: '第一层',
    steps: [
      { kind: 'edge', source: 'root', target: 'summary' },
      { kind: 'node', id: 'summary' },
      { kind: 'edge', source: 'summary', target: 'business' },
      { kind: 'node', id: 'business' },
    ],
  },
  {
    id: 'layer-policy',
    label: '第二层',
    steps: [
      { kind: 'edge', source: 'business', target: 'policy-bot' },
      { kind: 'node', id: 'policy-bot' },
      { kind: 'edge', source: 'business', target: 'policy-mid' },
      { kind: 'node', id: 'policy-mid' },
      { kind: 'edge', source: 'business', target: 'policy-top' },
      { kind: 'node', id: 'policy-top' },
    ],
  },
  {
    id: 'layer-analysis',
    label: '第三层',
    steps: [
      { kind: 'edge', source: 'policy-bot', target: 'analysis-bot' },
      { kind: 'node', id: 'analysis-bot' },
      { kind: 'edge', source: 'analysis-bot', target: 'advice-bot' },
      { kind: 'node', id: 'advice-bot' },
      { kind: 'edge', source: 'policy-mid', target: 'analysis-mid' },
      { kind: 'node', id: 'analysis-mid' },
      { kind: 'edge', source: 'analysis-mid', target: 'advice-mid' },
      { kind: 'node', id: 'advice-mid' },
      { kind: 'edge', source: 'policy-top', target: 'analysis-top' },
      { kind: 'node', id: 'analysis-top' },
      { kind: 'edge', source: 'analysis-top', target: 'advice-top' },
      { kind: 'node', id: 'advice-top' },
      { kind: 'edge', source: 'advice-bot', target: 'conclusion' },
      { kind: 'edge', source: 'advice-mid', target: 'conclusion' },
      { kind: 'edge', source: 'advice-top', target: 'conclusion' },
      { kind: 'node', id: 'conclusion' },
    ],
  },
]

export const COMPLIANCE_NODE_IDS = complianceNodeDefs.map((node) => node.id)
export const COMPLIANCE_EDGE_IDS = complianceEdgeDefs.map((edge) => edge.id)

const complianceNodeById = new Map(complianceNodeDefs.map((node) => [node.id, node]))

export function getComplianceNodeDatum(
  id: string,
  layout: ComplianceLayout,
  style?: NonNullable<NodeData['style']>,
): NodeData {
  const node = complianceNodeById.get(id)
  if (!node) throw new Error(`Unknown compliance node: ${id}`)
  const position = layout.get(id)
  if (!position) throw new Error(`Missing layout position for node: ${id}`)

  return {
    id: node.id,
    data: node.data,
    style: {
      x: position.x,
      y: position.y,
      ...style,
    },
  }
}

export function getComplianceEdgeDatum(source: string, target: string): EdgeData {
  return {
    id: complianceEdgeId(source, target),
    source,
    target,
  }
}

export function buildRootGraphData(layout: ComplianceLayout): GraphData {
  return {
    nodes: [getComplianceNodeDatum('root', layout)],
    edges: [],
  }
}

export function buildComplianceGraphData(): GraphData {
  return {
    nodes: complianceNodeDefs.map(
      (node): NodeData => ({
        id: node.id,
        data: node.data,
      }),
    ),
    edges: complianceEdgeDefs.map(
      (edge): EdgeData => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      }),
    ),
  }
}

export const NODE_SIZE: Record<MindmapNodeKind, [number, number]> = {
  file: [148, 40],
  section: [148, 44],
  policy: [148, 52],
  'analysis-blue': [148, 52],
  'analysis-yellow': [148, 52],
  advice: [148, 52],
  conclusion: [148, 52],
}

export function getNodeSize(kind: MindmapNodeKind): [number, number] {
  return NODE_SIZE[kind] ?? [148, 44]
}
