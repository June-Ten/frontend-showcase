export type SealType = 'person' | 'company'

export interface SealOption {
  id: string
  type: SealType
  name: string
  src: string
  width: number
  height: number
}

export interface PlacedSeal {
  id: string
  type: SealType
  src: string
  x: number
  y: number
  width: number
  height: number
}

export interface PageMetrics {
  pageWidth: number
  pageHeight: number
  pageGap: number
  viewerPaddingTop: number
  viewerPaddingLeft: number
  scale: number
}

export interface SealSubmitPayload {
  page: number
  x: number
  y: number
  width: number
  height: number
  type: SealType
}

export interface PlacedPagingSeal {
  id: string
  type: SealType
  src: string
  x: number
  y: number
  width: number
  height: number
}

export interface PagingSealSubmitPayload {
  x: number
  y: number
  width: number
  height: number
  type: SealType
}

export type PickerMode = 'normal' | 'paging'

export interface SignSubmitResult {
  stamp: SealSubmitPayload | null
  paging: PagingSealSubmitPayload | null
}
