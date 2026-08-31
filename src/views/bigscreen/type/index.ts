export type AiFileCount = {
  aiReview: number
  jingViolateDelNum: number
  jingViolateNum: number
  laoViolateNum: number
  provinceCode: string
  provinceName: string
  toLib: number
  userCount: number
  violateCount: number
}

export type AiViolation = {
  percent?: string
  standardId?: number
  standardName?: string
  violationCode?: string
  violationCount: number
  violationName?: string
}

export type FileGuide = {
  replyCount: number
  requestCount: number
}

export type MapData = {
  toFileCount: number
  uploadFileCount: number
  userCount: number
  violateCount: number
}

export type OpenDiscuss = {
  attentionFileCount: Record<string, number>
  openDiscussCount: number
  replyCount: number
}

export type ScreenData = {
  aiFileCountList: AiFileCount[]
  aiViolationList: AiViolation[]
  aiViolationListAll: AiViolation[]
  fileGuide: FileGuide
  mapData: MapData
  openDiscuss: OpenDiscuss
}
