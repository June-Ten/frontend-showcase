import { computed, ref } from 'vue'
import type {
  PageMetrics,
  PagingSealSubmitPayload,
  PickerMode,
  PlacedPagingSeal,
  PlacedSeal,
  SealOption,
  SealSubmitPayload,
  SignSubmitResult,
} from '../types'

export const SEAL_OPTIONS: SealOption[] = [
  {
    id: 'person',
    type: 'person',
    name: '个人印章',
    src: '/person.webp',
    width: 72,
    height: 72,
  },
  {
    id: 'company',
    type: 'company',
    name: '企业印章',
    src: '/company.webp',
    width: 120,
    height: 120,
  },
]

export const PAGING_STRIP_WIDTH = 88

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getSealSize(option: SealOption, metrics: PageMetrics | null) {
  const scale = metrics?.scale ?? 1
  return {
    width: Math.round(option.width * scale),
    height: Math.round(option.height * scale),
  }
}

function getCenterPosition(
  container: HTMLElement,
  sealWidth: number,
  sealHeight: number,
) {
  const rect = container.getBoundingClientRect()
  return {
    x: (window.innerWidth - sealWidth) / 2 - rect.left + container.scrollLeft,
    y: (window.innerHeight - sealHeight) / 2 - rect.top + container.scrollTop,
  }
}

function getRowHeight(metrics: PageMetrics) {
  return metrics.pageHeight + metrics.pageGap
}

function getPageVerticalBounds(pageIndex: number, metrics: PageMetrics) {
  const top = metrics.viewerPaddingTop + pageIndex * getRowHeight(metrics)
  return { top, bottom: top + metrics.pageHeight }
}

function resolveTargetPageIndex(
  seal: PlacedSeal,
  metrics: PageMetrics,
  totalPages: number,
): number {
  const rowHeight = getRowHeight(metrics)
  const centerY = seal.y + seal.height / 2
  let pageIndex = Math.floor((centerY - metrics.viewerPaddingTop) / rowHeight)
  pageIndex = Math.max(0, Math.min(pageIndex, totalPages - 1))

  const { top, bottom } = getPageVerticalBounds(pageIndex, metrics)
  if (centerY > bottom && pageIndex < totalPages - 1) {
    return pageIndex + 1
  }
  if (centerY < top && pageIndex > 0) {
    return pageIndex - 1
  }
  return pageIndex
}

export function isSealWithinSinglePage(
  seal: PlacedSeal,
  metrics: PageMetrics,
  totalPages: number,
): boolean {
  for (let i = 0; i < totalPages; i++) {
    const { top, bottom } = getPageVerticalBounds(i, metrics)
    if (seal.y >= top && seal.y + seal.height <= bottom) {
      return true
    }
  }
  return false
}

export function useStamp() {
  const seals = ref<PlacedSeal[]>([])
  const pagingSeal = ref<PlacedPagingSeal | null>(null)
  const pagingMode = ref(false)
  const pickerVisible = ref(false)
  const pickerMode = ref<PickerMode>('normal')
  const activeSealId = ref<string | null>(null)

  const hasSeal = computed(() => seals.value.length > 0 || pagingSeal.value !== null)
  const hasPagingSeal = computed(() => pagingSeal.value !== null)

  function openPicker(mode: PickerMode = 'normal') {
    pickerMode.value = mode
    pickerVisible.value = true
  }

  function closePicker() {
    pickerVisible.value = false
  }

  function enterPagingMode() {
    pagingMode.value = true
  }

  function exitPagingMode() {
    pagingMode.value = false
  }

  function addSeal(
    option: SealOption,
    container: HTMLElement,
    metrics: PageMetrics | null,
    totalPages: number,
  ) {
    const { width, height } = getSealSize(option, metrics)
    const { x, y } = getCenterPosition(container, width, height)

    seals.value = [
      {
        id: createId(),
        type: option.type,
        src: option.src,
        x,
        y,
        width,
        height,
      },
    ]
    activeSealId.value = seals.value[0]?.id ?? null

    const seal = seals.value[0]
    if (seal && metrics && totalPages > 0) {
      clampSealPosition(seal, metrics, container, totalPages)
    }

    closePicker()
  }

  function addPagingSeal(option: SealOption, metrics: PageMetrics | null) {
    const { width, height } = getSealSize(option, metrics)
    const stripInnerWidth = PAGING_STRIP_WIDTH - 16

    pagingSeal.value = {
      id: createId(),
      type: option.type,
      src: option.src,
      x: Math.max(8, (stripInnerWidth - width) / 2 + 8),
      y: 24,
      width,
      height,
    }
    closePicker()
  }

  function removeSeal(id: string) {
    seals.value = seals.value.filter((item) => item.id !== id)
    if (activeSealId.value === id) {
      activeSealId.value = seals.value[0]?.id ?? null
    }
  }

  function removePagingSeal() {
    pagingSeal.value = null
  }

  function clampSealPosition(
    seal: PlacedSeal,
    metrics: PageMetrics | null,
    container: HTMLElement,
    totalPages: number,
  ) {
    if (!metrics || totalPages < 1) return

    const minX = metrics.viewerPaddingLeft
    const minY = metrics.viewerPaddingTop
    const maxX = container.clientWidth - metrics.viewerPaddingLeft - seal.width
    const maxY = container.scrollHeight - seal.height

    seal.x = Math.min(Math.max(seal.x, minX), Math.max(minX, maxX))
    seal.y = Math.min(Math.max(seal.y, minY), Math.max(minY, maxY))

    const pageIndex = resolveTargetPageIndex(seal, metrics, totalPages)
    const { top, bottom } = getPageVerticalBounds(pageIndex, metrics)
    const pageMaxY = Math.max(top, bottom - seal.height)
    seal.y = Math.min(Math.max(seal.y, top), pageMaxY)
  }

  function clampPagingSealPosition(seal: PlacedPagingSeal, panelHeight: number) {
    const minY = 8
    const maxY = Math.max(minY, panelHeight - seal.height - 8)
    seal.y = Math.min(Math.max(seal.y, minY), maxY)
  }

  function toSubmitPayload(
    seal: PlacedSeal,
    metrics: PageMetrics | null,
    totalPages: number,
  ): SealSubmitPayload | null {
    if (!metrics) return null

    const rowHeight = metrics.pageHeight + metrics.pageGap
    const pageIndex = Math.floor((seal.y - metrics.viewerPaddingTop) / rowHeight)
    const page = Math.min(Math.max(pageIndex + 1, 1), totalPages)
    const pageTop = metrics.viewerPaddingTop + (page - 1) * rowHeight

    return {
      page,
      x: Math.round((seal.x - metrics.viewerPaddingLeft) / metrics.scale),
      y: Math.round((seal.y - pageTop) / metrics.scale),
      width: Math.round(seal.width / metrics.scale),
      height: Math.round(seal.height / metrics.scale),
      type: seal.type,
    }
  }

  function toPagingSubmitPayload(
    seal: PlacedPagingSeal,
    metrics: PageMetrics | null,
    totalPages: number,
  ): PagingSealSubmitPayload | null {
    if (!metrics || totalPages < 1) return null

    const rawWidth = seal.width / metrics.scale
    const rawHeight = seal.height / metrics.scale
    const panelHeight = metrics.pageHeight
    const rawY = ((panelHeight - seal.y - seal.height) / metrics.scale)

    let rawX: number
    if (totalPages === 1) {
      rawX = metrics.pageWidth - rawWidth
    } else {
      rawX =
        metrics.pageWidth -
        (rawWidth / 2 + rawWidth / totalPages / 2)
    }

    return {
      x: Math.round(rawX),
      y: Math.round(rawY),
      width: Math.round(rawWidth),
      height: Math.round(rawHeight),
      type: seal.type,
    }
  }

  function buildSubmitResult(
    metrics: PageMetrics | null,
    totalPages: number,
  ): SignSubmitResult {
    return {
      stamp: seals.value[0]
        ? toSubmitPayload(seals.value[0], metrics, totalPages)
        : null,
      paging: pagingSeal.value
        ? toPagingSubmitPayload(pagingSeal.value, metrics, totalPages)
        : null,
    }
  }

  return {
    seals,
    pagingSeal,
    pagingMode,
    pickerVisible,
    pickerMode,
    activeSealId,
    hasSeal,
    hasPagingSeal,
    openPicker,
    closePicker,
    enterPagingMode,
    exitPagingMode,
    addSeal,
    addPagingSeal,
    removeSeal,
    removePagingSeal,
    clampSealPosition,
    clampPagingSealPosition,
    toSubmitPayload,
    toPagingSubmitPayload,
    buildSubmitResult,
  }
}
