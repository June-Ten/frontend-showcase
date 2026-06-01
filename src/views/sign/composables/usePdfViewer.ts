import Pdfh5 from 'pdfh5'
import 'pdfh5/css/style.css'
import { nextTick, onMounted, onUnmounted, ref, type Ref } from 'vue'
import type { PageMetrics } from '../types'

const PDFH5_ASSETS = {
  workerSrc: '/pdf.worker.min.js',
  cMapUrl: '/cmaps/',
  standardFontDataUrl: '/standard_fonts/',
  iccUrl: '/iccs/',
  wasmUrl: '/wasm/',
}

export function usePdfViewer(containerRef: Ref<HTMLElement | undefined>, pdfUrl: string) {
  const loading = ref(true)
  const ready = ref(false)
  const totalPages = ref(0)
  const error = ref('')

  let viewer: Pdfh5 | null = null

  function getViewerContainer() {
    return containerRef.value?.querySelector('.viewerContainer') as HTMLElement | null
  }

  function getPageMetrics(): PageMetrics | null {
    const page = containerRef.value?.querySelector('.pageContainer') as HTMLElement | null
    const pdfViewer = containerRef.value?.querySelector('.pdfViewer') as HTMLElement | null
    if (!page || !pdfViewer) return null

    const pageWidth =
      parseFloat(page.style.width) ||
      parseFloat(page.style.maxWidth) ||
      page.clientWidth
    const pageHeight =
      parseFloat(page.style.height) ||
      parseFloat(page.style.maxHeight) ||
      page.clientHeight
    const pdfViewerStyle = window.getComputedStyle(pdfViewer)
    const pageStyle = window.getComputedStyle(page)

    return {
      pageWidth,
      pageHeight,
      pageGap: parseFloat(pageStyle.marginBottom) || 8,
      viewerPaddingTop: parseFloat(pdfViewerStyle.paddingTop) || 0,
      viewerPaddingLeft: parseFloat(pdfViewerStyle.paddingLeft) || 0,
      scale: page.clientWidth / pageWidth || 1,
    }
  }

  onMounted(() => {
    if (!containerRef.value) {
      error.value = 'PDF 容器未就绪'
      loading.value = false
      return
    }

    try {
      viewer = new Pdfh5(containerRef.value, {
        pdfurl: pdfUrl,
        ...PDFH5_ASSETS,
        backTop: false,
        scale: 1,
        zoomEnable: true,
      })

      viewer.on('complete', () => {
        totalPages.value = viewer?.totalNum ?? 0
        loading.value = false
        nextTick(() => {
          ready.value = !!getViewerContainer()
        })
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'PDF 加载失败'
      loading.value = false
    }
  })

  onUnmounted(() => {
    viewer?.destroy()
    viewer = null
  })

  return {
    loading,
    ready,
    totalPages,
    error,
    getViewerContainer,
    getPageMetrics,
  }
}
