<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import DraggableSeal from './components/DraggableSeal.vue'
import PagingSealPanel from './components/PagingSealPanel.vue'
import { usePdfViewer } from './composables/usePdfViewer'
import { isSealWithinSinglePage, SEAL_OPTIONS, useStamp } from './composables/useStamp'
import type { SealOption } from './types'

const PDF_URL = '/git.pdf'
const MOBILE_MAX_WIDTH = 768
const mobileMediaQuery = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`)

const pdfContainerRef = ref<HTMLElement>()
const toast = ref('')
const isMobileViewport = ref(mobileMediaQuery.matches)
const mobileTipDismissed = ref(false)

const showMobileTip = computed(
  () => !isMobileViewport.value && !mobileTipDismissed.value,
)
const canSign = computed(() => isMobileViewport.value)

function updateViewportMode() {
  isMobileViewport.value = mobileMediaQuery.matches
}

function onViewportModeChange() {
  updateViewportMode()
  if (isMobileViewport.value) {
    mobileTipDismissed.value = false
  }
}

function dismissMobileTip() {
  mobileTipDismissed.value = true
}

function ensureMobileMode(action: string) {
  if (canSign.value) return true
  showToast(`请切换至手机模式后再${action}`)
  mobileTipDismissed.value = false
  return false
}

onMounted(() => {
  updateViewportMode()
  mobileMediaQuery.addEventListener('change', onViewportModeChange)
})

onUnmounted(() => {
  mobileMediaQuery.removeEventListener('change', onViewportModeChange)
})

const {
  loading,
  ready,
  totalPages,
  error,
  getViewerContainer,
  getPageMetrics,
} = usePdfViewer(pdfContainerRef, PDF_URL)

const {
  seals,
  pagingSeal,
  pagingMode,
  pickerVisible,
  pickerMode,
  activeSealId,
  hasSeal,
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
  buildSubmitResult,
} = useStamp()

const pickerTitle = computed(() =>
  pickerMode.value === 'paging' ? '选择骑缝章' : '选择印章',
)

function showToast(message: string) {
  toast.value = message
  window.setTimeout(() => {
    toast.value = ''
  }, 2200)
}

function handleAddSeal() {
  if (!ensureMobileMode('添加印章')) return
  if (!ready.value) {
    showToast('PDF 尚未加载完成')
    return
  }
  openPicker('normal')
}

function handleOpenPaging() {
  if (!ensureMobileMode('盖骑缝章')) return
  if (!ready.value) {
    showToast('PDF 尚未加载完成')
    return
  }
  enterPagingMode()
}

function handlePickSeal(option: SealOption) {
  const metrics = getPageMetrics()

  if (pickerMode.value === 'paging') {
    addPagingSeal(option, metrics)
    return
  }

  const container = getViewerContainer()
  if (!container) {
    showToast('未找到 PDF 预览区域')
    return
  }
  addSeal(option, container, metrics, totalPages.value)
}

function handleDragEnd(sealId: string) {
  const seal = seals.value.find((item) => item.id === sealId)
  const container = getViewerContainer()
  if (!seal || !container) return
  clampSealPosition(seal, getPageMetrics(), container, totalPages.value)
}

function handlePagingDragEnd() {
  if (!pagingSeal.value) return
  const metrics = getPageMetrics()
  clampPagingSealPosition(pagingSeal.value, metrics?.pageHeight ?? 480)
}

function handleSubmit() {
  if (!ensureMobileMode('提交签署')) return
  if (!hasSeal.value) {
    showToast('请先添加印章或骑缝章')
    return
  }

  const metrics = getPageMetrics()
  const stamp = seals.value[0]
  if (stamp && metrics && !isSealWithinSinglePage(stamp, metrics, totalPages.value)) {
    showToast('印章不能跨页，请调整位置')
    return
  }

  const result = buildSubmitResult(metrics, totalPages.value)
  console.log('签署结果', result)

  const parts: string[] = []
  if (result.stamp) parts.push(`正文第 ${result.stamp.page} 页`)
  if (result.paging) parts.push('骑缝章')
  showToast(`已提交：${parts.join(' + ')}`)
}
</script>

<template>
  <div class="pdf-sign">
    <div ref="pdfContainerRef" class="pdf-sign__viewer" />

    <div v-if="loading" class="pdf-sign__overlay pdf-sign__loading">
      <span class="pdf-sign__spinner" />
      <p>PDF 加载中...</p>
    </div>

    <div v-else-if="error" class="pdf-sign__overlay pdf-sign__error">
      {{ error }}
    </div>

    <Teleport v-if="ready && seals.length && !pagingMode" to=".viewerContainer">
      <DraggableSeal
        v-for="seal in seals"
        :key="seal.id"
        v-model:x="seal.x"
        v-model:y="seal.y"
        :width="seal.width"
        :height="seal.height"
        :src="seal.src"
        :active="seal.id === activeSealId"
        @select="activeSealId = seal.id"
        @remove="removeSeal(seal.id)"
        @drag-end="handleDragEnd(seal.id)"
      />
    </Teleport>

    <header class="pdf-sign__header">
      <h1 class="pdf-sign__title">PDF 签署</h1>
      <span v-if="totalPages" class="pdf-sign__meta">共 {{ totalPages }} 页</span>
    </header>

    <button
      v-if="ready && !pagingMode && canSign"
      type="button"
      class="pdf-sign__paging-entry"
      @click="handleOpenPaging"
    >
      骑缝章
    </button>

    <footer v-if="!pagingMode" class="pdf-sign__footer">
      <button
        type="button"
        class="pdf-sign__btn pdf-sign__btn--ghost"
        :disabled="!canSign"
        @click="handleAddSeal"
      >
        {{ seals.length ? '更换印章' : '添加印章' }}
      </button>
      <button
        type="button"
        class="pdf-sign__btn pdf-sign__btn--primary"
        :disabled="!canSign || !hasSeal"
        @click="handleSubmit"
      >
        提交签署
      </button>
    </footer>

    <PagingSealPanel
      :visible="pagingMode"
      :total-pages="totalPages"
      :metrics="getPageMetrics()"
      :seal="pagingSeal"
      @close="exitPagingMode"
      @pick-seal="openPicker('paging')"
      @remove="removePagingSeal"
      @drag-end="handlePagingDragEnd"
    />

    <Transition name="fade">
      <div v-if="pickerVisible" class="picker-mask" @click.self="closePicker">
        <section class="picker-panel">
          <div class="picker-panel__header">
            <h2>{{ pickerTitle }}</h2>
            <button type="button" class="picker-panel__close" @click="closePicker">×</button>
          </div>
          <div class="picker-panel__list">
            <button
              v-for="option in SEAL_OPTIONS"
              :key="option.id"
              type="button"
              class="picker-panel__item"
              @click="handlePickSeal(option)"
            >
              <img :src="option.src" :alt="option.name" />
              <span>{{ option.name }}</span>
            </button>
          </div>
        </section>
      </div>
    </Transition>

    <div v-if="showMobileTip" class="mobile-tip-mask">
      <section class="mobile-tip">
        <div class="mobile-tip__icon">📱</div>
        <h2 class="mobile-tip__title">请使用手机模式签署</h2>
        <p class="mobile-tip__desc">
          签署功能面向移动端设计，请在手机打开本页面，或在浏览器中切换设备模拟后再操作。
        </p>
        <ul class="mobile-tip__list">
          <li>Chrome / Edge：按 F12，点击工具栏「切换设备仿真」</li>
          <li>建议宽度：375px 及以下</li>
        </ul>
        <button type="button" class="mobile-tip__btn" @click="dismissMobileTip">
          我知道了
        </button>
      </section>
    </div>

    <Transition name="fade">
      <div v-if="toast" class="pdf-sign__toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.pdf-sign {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #fff;
  color: #1f2937;
}

.pdf-sign__viewer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.pdf-sign__overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  pointer-events: none;
}

.pdf-sign__header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  padding-top: env(safe-area-inset-top);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.72) 100%);
  backdrop-filter: blur(8px);
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.pdf-sign__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.pdf-sign__meta {
  font-size: 13px;
  color: #6b7280;
}

.pdf-sign__error {
  color: #dc2626;
}

.pdf-sign__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #dbeafe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.pdf-sign__paging-entry {
  position: absolute;
  top: 50%;
  right: 0;
  z-index: 30;
  width: 32px;
  padding: 12px 8px;
  border: none;
  border-radius: 10px 0 0 10px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: -2px 0 8px rgba(15, 23, 42, 0.12);
  color: #2563eb;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 2px;
  writing-mode: vertical-rl;
  cursor: pointer;
}

.pdf-sign__footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  display: flex;
  gap: 12px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: linear-gradient(0deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.85) 100%);
  backdrop-filter: blur(8px);
}

.pdf-sign__btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.pdf-sign__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pdf-sign__btn--ghost {
  background: #eef2ff;
  color: #2563eb;
}

.pdf-sign__btn--primary {
  background: #2563eb;
  color: #fff;
}

.picker-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  background: rgba(15, 23, 42, 0.45);
}

.picker-panel {
  width: 100%;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
  background: #fff;
  border-radius: 16px 16px 0 0;
}

.picker-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
}

.picker-panel__close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f3f4f6;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.picker-panel__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.picker-panel__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fafafa;
  cursor: pointer;

  img {
    width: 64px;
    height: 64px;
    object-fit: contain;
  }

  span {
    font-size: 14px;
    color: #374151;
  }
}

.pdf-sign__toast {
  position: fixed;
  left: 50%;
  bottom: calc(80px + env(safe-area-inset-bottom));
  z-index: 1100;
  max-width: calc(100vw - 32px);
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.88);
  color: #fff;
  font-size: 14px;
  transform: translateX(-50%);
}

.mobile-tip-mask {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.55);
}

.mobile-tip {
  width: min(100%, 360px);
  padding: 24px 20px;
  border-radius: 16px;
  background: #fff;
  text-align: center;
}

.mobile-tip__icon {
  font-size: 40px;
  line-height: 1;
}

.mobile-tip__title {
  margin: 12px 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.mobile-tip__desc {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #4b5563;
  text-align: left;
}

.mobile-tip__list {
  margin: 0 0 20px;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.7;
  color: #6b7280;
  text-align: left;
}

.mobile-tip__btn {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<style lang="scss">
.pdf-sign__viewer .pdfjs {
  width: 100%;
  height: 100%;
}

.pdf-sign__viewer .viewerContainer {
  width: 100%;
  height: 100%;
}
</style>
