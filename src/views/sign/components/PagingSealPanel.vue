<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import DraggableSeal from './DraggableSeal.vue'
import { PAGING_STRIP_WIDTH } from '../composables/useStamp'
import type { PageMetrics, PlacedPagingSeal } from '../types'

const props = defineProps<{
  visible: boolean
  totalPages: number
  metrics: PageMetrics | null
  seal: PlacedPagingSeal | null
}>()

const emit = defineEmits<{
  close: []
  'pick-seal': []
  remove: []
  'drag-end': []
}>()

const previewUrl = ref('')

const panelWidth = computed(() => (props.metrics?.pageWidth ?? 320) + PAGING_STRIP_WIDTH)
const panelHeight = computed(() => props.metrics?.pageHeight ?? 480)

const fitScale = computed(() => {
  if (!props.metrics) return 1
  return Math.min(
    1,
    (window.innerWidth - 32) / panelWidth.value,
    (window.innerHeight - 140) / panelHeight.value,
  )
})

function buildPreview() {
  const pageEl = document.querySelector('.pageContainer') as HTMLElement | null
  const canvas = pageEl?.querySelector('canvas') as HTMLCanvasElement | null
  if (!pageEl || !canvas || !props.metrics) {
    previewUrl.value = ''
    return
  }

  const pageCssWidth = pageEl.clientWidth
  const cropCssWidth = Math.max(
    1,
    pageCssWidth - PAGING_STRIP_WIDTH * (pageCssWidth / props.metrics.pageWidth),
  )

  const output = document.createElement('canvas')
  output.width = cropCssWidth
  output.height = pageEl.clientHeight
  const ctx = output.getContext('2d')
  if (!ctx) return

  const sourceCropWidth = canvas.width * (cropCssWidth / pageCssWidth)
  ctx.drawImage(
    canvas,
    0,
    0,
    sourceCropWidth,
    canvas.height,
    0,
    0,
    cropCssWidth,
    pageEl.clientHeight,
  )
  previewUrl.value = output.toDataURL('image/png')
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) requestAnimationFrame(buildPreview)
  },
)

onMounted(() => {
  if (props.visible) buildPreview()
})
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="paging-mask">
      <div
        class="paging-panel-wrap"
        :style="{ transform: `scale(${fitScale})` }"
      >
        <section
          class="paging-panel"
          :style="{ width: `${panelWidth}px`, height: `${panelHeight}px` }"
        >
          <div
            class="paging-panel__preview"
            :style="{ width: `${panelWidth - PAGING_STRIP_WIDTH}px` }"
          >
            <img v-if="previewUrl" :src="previewUrl" alt="文档预览" />
            <div v-else class="paging-panel__preview-placeholder">文档预览</div>
          </div>

          <div class="paging-panel__strip">
            <div class="paging-panel__lines">
              <div
                v-for="index in totalPages"
                :key="index"
                class="paging-panel__line"
              />
            </div>

            <DraggableSeal
              v-if="seal"
              v-model:x="seal.x"
              v-model:y="seal.y"
              :width="seal.width"
              :height="seal.height"
              :src="seal.src"
              active
              lock-x
              @drag-end="emit('drag-end')"
              @remove="emit('remove')"
            />

            <button
              v-else
              type="button"
              class="paging-panel__add"
              @click="emit('pick-seal')"
            >
              + 选择印章
            </button>

            <span class="paging-panel__label">骑缝区</span>
          </div>
        </section>
      </div>

      <footer class="paging-panel__actions">
        <button type="button" class="paging-panel__btn" @click="emit('close')">完成</button>
      </footer>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.paging-mask {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(15, 23, 42, 0.55);
}

.paging-panel-wrap {
  transform-origin: center center;
}

.paging-panel {
  display: flex;
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.28);
}

.paging-panel__preview {
  flex-shrink: 0;
  background: #f8fafc;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: left center;
  }
}

.paging-panel__preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #94a3b8;
  font-size: 14px;
}

.paging-panel__strip {
  position: relative;
  flex-shrink: 0;
  width: 88px;
  border-left: 1px dashed #409eff;
  background: #fff;
}

.paging-panel__lines {
  display: flex;
  width: 100%;
  height: 100%;
}

.paging-panel__line {
  flex: 1;
  border-right: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);

  &:last-child {
    border-right: none;
  }
}

.paging-panel__label {
  position: absolute;
  top: 50%;
  left: 50%;
  color: #cbd5e1;
  font-size: 14px;
  letter-spacing: 4px;
  writing-mode: vertical-rl;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.paging-panel__add {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 72px;
  padding: 8px 4px;
  border: 1px dashed #93c5fd;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  line-height: 1.4;
  transform: translate(-50%, -50%);
  cursor: pointer;
}

.paging-panel__actions {
  display: flex;
  justify-content: center;
}

.paging-panel__btn {
  min-width: 120px;
  height: 40px;
  border: none;
  border-radius: 999px;
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
</style>
