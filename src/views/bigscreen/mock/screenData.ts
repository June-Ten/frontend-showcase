import location from '../../../assets/map/location.json'
import type { AiFileCount, ScreenData } from '../type'

type ProvinceMeta = {
  name: string
  nameId: string
}

const provinces = location.province as ProvinceMeta[]

/** 按经济活跃度给各省造审查量，沿海高、西部低，柱子才有层次 */
const reviewByProvince: Record<string, number> = {
  广东省: 1862,
  江苏省: 1724,
  浙江省: 1586,
  山东省: 1498,
  北京市: 1360,
  上海市: 1288,
  河南省: 1126,
  四川省: 1084,
  湖北省: 972,
  福建省: 916,
  湖南省: 888,
  安徽省: 842,
  河北省: 806,
  重庆市: 764,
  辽宁省: 698,
  陕西省: 652,
  江西省: 604,
  广西壮族自治区: 558,
  云南省: 512,
  山西省: 476,
  黑龙江省: 438,
  吉林省: 392,
  贵州省: 364,
  天津市: 348,
  内蒙古自治区: 312,
  新疆维吾尔自治区: 276,
  甘肃省: 242,
  海南省: 198,
  宁夏回族自治区: 156,
  青海省: 118,
  西藏自治区: 86,
  台湾省: 64,
}

const hash = (text: string) => {
  let value = 0
  for (let i = 0; i < text.length; i += 1) {
    value = (value * 31 + text.charCodeAt(i)) >>> 0
  }
  return value
}

const ranged = (seed: number, min: number, span: number) => min + (seed % span)

const aiFileCountList: AiFileCount[] = provinces.map((province) => {
  const seed = hash(province.name)
  const aiReview = reviewByProvince[province.name] ?? ranged(seed, 80, 420)
  const toLib = Math.round(aiReview * (0.48 + (seed % 18) / 100))
  const jingViolateNum = Math.max(6, Math.round(aiReview * 0.12))
  const laoViolateNum = Math.max(3, Math.round(aiReview * 0.05))
  const jingViolateDelNum = Math.max(1, Math.round(aiReview * 0.02))
  return {
    provinceName: province.name,
    provinceCode: province.nameId,
    aiReview,
    toLib,
    userCount: Math.max(8, Math.round(aiReview / 7) + ranged(seed >> 1, 0, 24)),
    violateCount: jingViolateNum + laoViolateNum,
    jingViolateNum,
    laoViolateNum,
    jingViolateDelNum,
  }
})

const totals = aiFileCountList.reduce(
  (acc, item) => {
    acc.userCount += item.userCount
    acc.uploadFileCount += item.aiReview
    acc.toFileCount += item.toLib
    acc.violateCount += item.violateCount
    return acc
  },
  { userCount: 0, uploadFileCount: 0, toFileCount: 0, violateCount: 0 },
)

const aiViolationListAll = [
  { standardId: 100, standardName: '市场准入和退出标准', violationCount: 721 },
  { standardId: 101, standardName: '商品和要素自由流动标准', violationCount: 546 },
  { standardId: 102, standardName: '影响生产经营成本标准', violationCount: 749 },
  { standardId: 103, standardName: '影响生产经营行为标准', violationCount: 656 },
]

const aiViolationList = [
  {
    standardName:
      '第九条 起草涉及经营者经济活动的政策措施，不得含有下列对市场准入负面清单以外的行业、领域、业务等违法设置市场准入审批程序的内容',
    violationCount: 721,
  },
  {
    standardName: '第十条 起草涉及经营者经济活动的政策措施，不得含有下列违法设置或者授予政府特许经营权的内容',
    violationCount: 654,
  },
  {
    standardName: '第十一条 起草涉及经营者经济活动的政策措施，不得含有下列违法设置市场准入行政许可的内容',
    violationCount: 546,
  },
  {
    standardName: '第十二条 起草涉及经营者经济活动的政策措施，不得含有下列违法设置市场准入行政强制措施的内容',
    violationCount: 749,
  },
  {
    standardName: '第十三条 不得违法设置歧视性资质标准、评审标准或者不依法公开招标投标信息',
    violationCount: 488,
  },
  {
    standardName: '第十四条 不得违法给予特定经营者财政奖励、补贴或税收优惠',
    violationCount: 412,
  },
  {
    standardName: '第十五条 不得强制经营者从事垄断行为或限定交易',
    violationCount: 365,
  },
  {
    standardName: '第十六条 不得设置不合理的市场准入和退出条件',
    violationCount: 298,
  },
]

export const mockScreenData: ScreenData = {
  aiFileCountList,
  aiViolationListAll,
  aiViolationList,
  mapData: totals,
  openDiscuss: {
    openDiscussCount: 1286,
    replyCount: 3542,
    attentionFileCount: {
      市场准入和退出: 186,
      产业发展: 142,
      招商引资: 128,
      招标投标: 96,
      政府采购: 88,
      资质标准: 74,
      监管执法: 61,
      其他: 43,
    },
  },
  fileGuide: {
    requestCount: 236,
    replyCount: 198,
  },
}
