export type CompactEquityNodeType = 'person' | 'company' | 'target'

export interface CompactEquityNodeItem {
  id: string
  data: {
    name: string
    type?: CompactEquityNodeType
    region?: string
  }
  children?: CompactEquityNodeItem[]
}

export type CompactEquityGraphData = CompactEquityNodeItem

export const compactEquityGraphData: CompactEquityGraphData = {
  id: 'n-target',
  data: { name: '星链科技股份有限公司', type: 'target', region: '中国大陆' },
  children: [
    {
      id: 'n-yuanjing',
      data: { name: '远景控股集团有限公司', type: 'company' },
      children: [
        { id: 'n-chen', data: { name: '陈建国', type: 'person' } },
        { id: 'n-lin', data: { name: '林晓峰', type: 'person' } },
        { id: 'n-esop', data: { name: '远景员工持股平台', type: 'company' } },
      ],
    },
    {
      id: 'n-sequoia',
      data: { name: '红杉资本中国基金', type: 'company' },
      children: [{ id: 'n-sequoia-cn', data: { name: '红杉资本（中国）', type: 'company' } }],
    },
    { id: 'n-wang', data: { name: '王明远', type: 'person' } },
    {
      id: 'n-sz-fund',
      data: { name: '深圳创新产业投资基金', type: 'company' },
      children: [
        { id: 'n-sasac', data: { name: '深圳市国资委', type: 'company' } },
        { id: 'n-szvc', data: { name: '深创投', type: 'company' } },
        { id: 'n-lp', data: { name: '其他LP', type: 'company' } },
      ],
    },
    { id: 'n-cloud', data: { name: '星链云计算有限公司', type: 'company' } },
    { id: 'n-data', data: { name: '星链数据服务有限公司', type: 'company' } },
    { id: 'n-hardware', data: { name: '深圳星链智能硬件有限公司', type: 'company' } },
  ],
}

export const compactCompanyInfo = {
  name: '星链科技股份有限公司',
  creditCode: '91440300MA5XXXXX8X',
  legalPerson: '陈建国',
  registeredCapital: '5000 万元',
  establishDate: '2018-06-12',
  status: '存续',
}
