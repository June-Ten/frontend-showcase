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

export interface MindmapCitation {
  label: string
  count: number
}

export interface MindmapNodePayload extends Record<string, unknown> {
  kind: MindmapNodeKind
  title: string
  content?: string
  subtitle?: string
  verdict?: ComplianceVerdict
  footer?: string
  citation?: MindmapCitation
  viewLink?: string
  expandText?: string
  expanded?: boolean
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
  { id: 'root', data: { kind: 'file', title: '文件开始解析' } },
  {
    id: 'summary',
    data: {
      kind: 'section',
      title: '综合管理要求',
      content:
        '围绕资质、授权、履约与数据安全四个维度，对合同执行全过程开展合规核验，重点核查供应商资质有效性、审批链条完整性与档案留存要求，识别潜在违规风险点，形成可追溯的核验结论与整改建议。',
      footer: '本文档属于部门规章级法规',
    },
  },
  {
    id: 'business',
    data: {
      kind: 'section',
      title: '业务背景',
      content:
        '项目涉及政府采购、数据服务与工程交付，合同类型多、监管口径不一，需按合同类型匹配对应监管要求，逐项识别材料、流程与责任边界，明确各环节的合规义务主体，为后续分项分析提供业务基线。',
      footer: '点击查看文章详情',
    },
  },
  {
    id: 'policy-top', data: {
      kind: 'policy',
      title: '政策依据 · 政府采购',
      content:
        '• 采购方式与预算审批应匹配\n• 采购文件应完整留存备查\n• 供应商资质应在有效期内\n• 评审专家抽取程序合规\n• 中标结果公示满足法定期限\n• 验收与付款流程可追溯',
    },
  },
  {
    id: 'policy-mid', data: {
      kind: 'policy',
      title: '政策依据 · 数据安全',
      content:
        '• 明确数据处理授权范围与期限\n• 数据分类分级并落实防护措施\n• 建立访问、备份与审计记录\n• 跨境传输需单独评估审批\n• 禁止超范围共享与二次使用\n• 定期开展数据安全自查',
    },
  },
  {
    id: 'policy-bot', data: {
      kind: 'policy',
      title: '政策依据 · 工程监管',
      content:
        '• 施工许可与人员证照齐备\n• 分包行为需经发包方书面同意\n• 过程签证及变更履行审批\n• 隐蔽工程验收留存影像资料\n• 验收资料与结算依据一致\n• 质保金比例符合合同约定',
    },
  },
  {
    id: 'analysis-top', data: {
      kind: 'analysis-blue',
      title: '采购合同分析',
      content:
        '已核验采购方式、预算批复与供应商资质，评审记录完整，中标公示与合同签订时序合规，验收单据与付款凭证一一对应，关键流程材料齐备且全程可追溯。',
      verdict: 'compliant',
    },
  },
  {
    id: 'analysis-mid', data: {
      kind: 'analysis-yellow',
      title: '服务合同分析',
      content:
        '数据处理条款未明确留存期限，部分接口调用超出授权清单范围，访问日志与备份记录不完整，个别环节缺少安全评估报告，需补充佐证材料后再行判定。',
      verdict: 'suspected',
    },
  },
  {
    id: 'analysis-bot', data: {
      kind: 'analysis-yellow',
      title: '工程合同分析',
      content:
        '个别设计变更尚未见完整审批链，两笔过程签证金额与台账不符，隐蔽工程影像资料留存不全，结算书部分单价缺少组价依据，需补齐签证与验收资料。',
      verdict: 'suspected',
    },
  },
  {
    id: 'advice-top', data: {
      kind: 'advice',
      title: '合规判定建议',
      content:
        '维持现有归档与审批要求，按年度复核供应商资质材料，对验收与付款流程做抽样检查，无需额外整改措施。',
      expandText:
        '采购档案齐全、审批链完整，建议按现有内控制度持续抽检，无需启动专项整改。',
      citation: { label: '法律法规依据', count: 1 },
      viewLink: '查看第十二条内容',
      verdict: 'compliant',
    },
  },
  {
    id: 'advice-mid', data: {
      kind: 'advice',
      title: '合规判定建议',
      content:
        '限期补充授权清单与留存期限约定，完善访问日志与备份审计记录，补做数据安全评估并归档，完成数据处理活动台账登记。',
      expandText:
        '建议在 15 个工作日内补齐授权范围、留存期限与安全评估报告，完成前暂停超范围接口调用。',
      citation: { label: '法律法规依据', count: 2 },
      viewLink: '查看第二十八条内容',
      verdict: 'suspected',
    },
  },
  {
    id: 'advice-bot', data: {
      kind: 'advice',
      title: '合规判定建议',
      content:
        '补办设计变更的完整审批手续，核对签证金额并更正台账差异，补齐隐蔽工程验收影像资料，完成后再进行工程结算确认。',
      expandText:
        '签证与验收资料未闭环前，工程结算不得作为付款依据，需由项目负责人书面确认补件清单。',
      citation: { label: '法律法规依据', count: 1 },
      viewLink: '查看第四十一条内容',
      verdict: 'suspected',
    },
  },
  {
    id: 'conclusion',
    data: {
      kind: 'conclusion',
      title: '最终结论',
      content:
        '存在多项待整改事项，数据安全与工程签证问题突出，复核通过前不建议关闭本次审查。',
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
  /** 多条边同时生长、共同汇入同一个目标节点，目标节点在所有边长完后才显示 */
  | { kind: 'edge-group'; sources: string[]; target: string }

export interface PlaybackLayer {
  id: string
  label: string
  steps: PlaybackStep[]
}

/** 四层水平展开：主干 → 政策依据 → 分析/建议 → 结论（三线汇聚） */
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
    ],
  },
  {
    id: 'layer-conclusion',
    label: '第四层',
    steps: [
      {
        kind: 'edge-group',
        sources: ['advice-bot', 'advice-mid', 'advice-top'],
        target: 'conclusion',
      },
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

export function buildEmptyGraphData(): GraphData {
  return {
    nodes: [],
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
  file: [204, 42],
  section: [268, 214],
  policy: [268, 214],
  'analysis-blue': [276, 156],
  'analysis-yellow': [276, 156],
  advice: [300, 236],
  conclusion: [228, 112],
}

export const MINIMAP_NODE_COLOR: Record<MindmapNodeKind, { fill: string; stroke: string }> = {
  file: { fill: '#e8f3ff', stroke: '#b7d4f5' },
  section: { fill: '#fff8e6', stroke: '#ead7a3' },
  policy: { fill: '#fff8e6', stroke: '#ead7a3' },
  'analysis-blue': { fill: '#e8f4ff', stroke: '#7eb6ea' },
  'analysis-yellow': { fill: '#fff8e6', stroke: '#ead7a3' },
  advice: { fill: '#e8f4ff', stroke: '#6ba9e8' },
  conclusion: { fill: '#e8f6ee', stroke: '#b5d9c4' },
}

export function getComplianceNodeKind(id: string): MindmapNodeKind {
  return complianceNodeById.get(id)?.data.kind ?? 'file'
}

export function getNodeSize(kind: MindmapNodeKind): [number, number] {
  return NODE_SIZE[kind] ?? [224, 96]
}

export function getHtmlNodeOffset(size: [number, number]): { dx: number; dy: number } {
  return { dx: -size[0] / 2, dy: -size[1] / 2 }
}
