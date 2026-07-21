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
  content?: string
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
  { id: 'root', data: { kind: 'file', title: '资质证书.docx', content: '待核验材料' } },
  {
    id: 'summary',
    data: {
      kind: 'section',
      title: '综合管理要求',
      content: '围绕资质、授权、履约与数据安全\n对合同执行过程开展合规核验',
    },
  },
  {
    id: 'business',
    data: {
      kind: 'section',
      title: '业务背景',
      content: '项目涉及采购服务与工程交付。\n需按合同类型匹配监管要求，\n识别材料、流程与责任边界。',
    },
  },
  {
    id: 'policy-top', data: {
      kind: 'policy',
      title: '政策依据 · 政府采购',
      content: '• 采购文件应完整留存\n• 供应商资质应在有效期内\n• 评审与验收过程可追溯',
    },
  },
  {
    id: 'policy-mid', data: {
      kind: 'policy',
      title: '政策依据 · 数据安全',
      content: '• 明确数据处理授权范围\n• 建立访问、备份与审计记录\n• 禁止超范围共享与使用',
    },
  },
  {
    id: 'policy-bot', data: {
      kind: 'policy',
      title: '政策依据 · 工程监管',
      content: '• 施工许可与人员证照齐备\n• 过程签证及变更履行审批\n• 验收资料与结算依据一致',
    },
  },
  {
    id: 'analysis-top', data: {
      kind: 'analysis-blue',
      title: '采购合同分析',
      content: '已核验采购方式、供应商资质与\n验收记录，关键流程材料完整。',
      verdict: 'compliant',
    },
  },
  {
    id: 'analysis-mid', data: {
      kind: 'analysis-yellow',
      title: '服务合同分析',
      content: '数据处理条款未明确留存期限，\n部分授权记录需要补充佐证。',
      verdict: 'suspected',
    },
  },
  {
    id: 'analysis-bot', data: {
      kind: 'analysis-yellow',
      title: '工程合同分析',
      content: '个别设计变更尚未见完整审批链，\n需补齐签证和验收资料。',
      verdict: 'suspected',
    },
  },
  {
    id: 'advice-top', data: {
      kind: 'advice',
      title: '合规判定建议',
      content: '维持现有归档要求，按年度复核\n供应商资质和验收材料。',
      verdict: 'compliant',
    },
  },
  {
    id: 'advice-mid', data: {
      kind: 'advice',
      title: '合规判定建议',
      content: '补充授权清单和留存期限约定，\n完成数据处理活动台账。',
      verdict: 'suspected',
    },
  },
  {
    id: 'advice-bot', data: {
      kind: 'advice',
      title: '合规判定建议',
      content: '完成变更审批与验收资料归档后，\n再进行工程结算确认。',
      verdict: 'suspected',
    },
  },
  {
    id: 'conclusion',
    data: {
      kind: 'conclusion',
      title: '最终结论',
      content: '存在需整改事项，整改完成并复核\n通过前，不建议关闭合规审查。',
      verdict: 'violation',
    },
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
      { kind: 'edge', source: 'summary', target: 'business' },
    ],
  },
  {
    id: 'layer-policy',
    label: '第二层',
    steps: [
      { kind: 'edge', source: 'business', target: 'policy-bot' },
      { kind: 'edge', source: 'business', target: 'policy-mid' },
      { kind: 'edge', source: 'business', target: 'policy-top' },
    ],
  },
  {
    id: 'layer-analysis',
    label: '第三层',
    steps: [
      { kind: 'edge', source: 'policy-bot', target: 'analysis-bot' },
      { kind: 'edge', source: 'analysis-bot', target: 'advice-bot' },
      { kind: 'edge', source: 'policy-mid', target: 'analysis-mid' },
      { kind: 'edge', source: 'analysis-mid', target: 'advice-mid' },
      { kind: 'edge', source: 'policy-top', target: 'analysis-top' },
      { kind: 'edge', source: 'analysis-top', target: 'advice-top' },
      { kind: 'edge', source: 'advice-bot', target: 'conclusion' },
      { kind: 'edge', source: 'advice-mid', target: 'conclusion' },
      { kind: 'edge', source: 'advice-top', target: 'conclusion' },
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
    sourcePort: 'right',
    targetPort: 'left',
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
  file: [164, 52],
  section: [224, 108],
  policy: [230, 126],
  'analysis-blue': [246, 120],
  'analysis-yellow': [246, 120],
  advice: [228, 110],
  conclusion: [220, 112],
}

export function getNodeSize(kind: MindmapNodeKind): [number, number] {
  return NODE_SIZE[kind] ?? [224, 96]
}
