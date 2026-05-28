export type EquityNodeType = 'person' | 'company' | 'target'

/** shareholder：股东持股；investment：对外投资。边方向均为 投资方(source) → 被投资方(target)，配合 TB 自上而下排列 */
export type EquityEdgeRelation = 'shareholder' | 'investment'

export interface EquityNodeItem {
  id: string
  data: {
    name: string
    type?: EquityNodeType
    /** 注册地/辖区，展示在名称下方 */
    region?: string
  }
  [key: string]: unknown
}

export interface EquityEdgeItem {
  id: string
  source: string
  target: string
  data?: {
    percent?: string
    relation?: EquityEdgeRelation
  }
  [key: string]: unknown
}

export interface EquityGraphData {
  nodes: EquityNodeItem[]
  edges: EquityEdgeItem[]
}

export const nodes: EquityNodeItem[] = [
  { id: 'n-target', data: { name: '星链科技股份有限公司', type: 'target', region: '中国大陆' } },
  // —— 被投资：股东穿透（上方）——
  { id: 'n-yuanjing', data: { name: '远景控股集团有限公司', type: 'company' } },
  { id: 'n-chen', data: { name: '陈建国', type: 'person' } },
  { id: 'n-lin', data: { name: '林晓峰', type: 'person' } },
  { id: 'n-esop', data: { name: '远景员工持股平台', type: 'company' } },
  { id: 'n-sequoia', data: { name: '红杉资本中国基金', type: 'company' } },
  { id: 'n-sequoia-cn', data: { name: '红杉资本（中国）', type: 'company' } },
  { id: 'n-wang', data: { name: '王明远', type: 'person' } },
  { id: 'n-sz-fund', data: { name: '深圳创新产业投资基金', type: 'company' } },
  { id: 'n-sasac', data: { name: '深圳市国资委', type: 'company' } },
  { id: 'n-szvc', data: { name: '深创投', type: 'company' } },
  { id: 'n-lp', data: { name: '其他LP', type: 'company' } },
  // —— 对外投资（下方）——
  { id: 'n-cloud', data: { name: '星链云计算有限公司', type: 'company' } },
  { id: 'n-data', data: { name: '星链数据服务有限公司', type: 'company' } },
  { id: 'n-hardware', data: { name: '深圳星链智能硬件有限公司', type: 'company' } },
]

export const edges: EquityEdgeItem[] = [
  // 股东穿透：投资方 → 被投资方（TB 布局，股东在上、目标在中）
  { id: 'e-yuanjing-target', source: 'n-yuanjing', target: 'n-target', data: { percent: '42.5%', relation: 'shareholder' } },
  { id: 'e-sequoia-target', source: 'n-sequoia', target: 'n-target', data: { percent: '28%', relation: 'shareholder' } },
  { id: 'e-wang-target', source: 'n-wang', target: 'n-target', data: { percent: '18.5%', relation: 'shareholder' } },
  { id: 'e-sz-fund-target', source: 'n-sz-fund', target: 'n-target', data: { percent: '11%', relation: 'shareholder' } },
  { id: 'e-chen-yuanjing', source: 'n-chen', target: 'n-yuanjing', data: { percent: '55%', relation: 'shareholder' } },
  { id: 'e-lin-yuanjing', source: 'n-lin', target: 'n-yuanjing', data: { percent: '30%', relation: 'shareholder' } },
  { id: 'e-esop-yuanjing', source: 'n-esop', target: 'n-yuanjing', data: { percent: '15%', relation: 'shareholder' } },
  { id: 'e-sequoia-cn-sequoia', source: 'n-sequoia-cn', target: 'n-sequoia', data: { percent: '100%', relation: 'shareholder' } },
  { id: 'e-sasac-sz-fund', source: 'n-sasac', target: 'n-sz-fund', data: { percent: '40%', relation: 'shareholder' } },
  { id: 'e-szvc-sz-fund', source: 'n-szvc', target: 'n-sz-fund', data: { percent: '35%', relation: 'shareholder' } },
  { id: 'e-lp-sz-fund', source: 'n-lp', target: 'n-sz-fund', data: { percent: '25%', relation: 'shareholder' } },
  // 对外投资：母公司 → 子公司（TB 布局，子公司在下）
  { id: 'e-target-cloud', source: 'n-target', target: 'n-cloud', data: { percent: '60%', relation: 'investment' } },
  { id: 'e-target-data', source: 'n-target', target: 'n-data', data: { percent: '35%', relation: 'investment' } },
  { id: 'e-target-hardware', source: 'n-target', target: 'n-hardware', data: { percent: '51%', relation: 'investment' } },
]

export const equityGraphData: EquityGraphData = { nodes, edges }

export const companyInfo = {
  name: '星链科技股份有限公司',
  creditCode: '91440300MA5XXXXX8X',
  legalPerson: '陈建国',
  registeredCapital: '5000 万元',
  establishDate: '2018-06-12',
  status: '存续',
}
