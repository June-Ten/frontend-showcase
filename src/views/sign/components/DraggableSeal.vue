<script setup lang="ts">
import { onUnmounted } from 'vue'

const x = defineModel<number>('x', { required: true })
const y = defineModel<number>('y', { required: true })

const props = defineProps<{
  width: number
  height: number
  src: string
  active?: boolean
  lockX?: boolean
}>()

const emit = defineEmits<{
  select: []
  remove: []
  'drag-end': []
}>()

let startX = 0
let startY = 0
let originX = 0
let originY = 0
let dragging = false
let activePointerId: number | null = null
let capturedEl: HTMLElement | null = null

function detachPointerListeners() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
}

function stopDragging() {
  if (!dragging) return
  dragging = false
  if (capturedEl && activePointerId != null && capturedEl.hasPointerCapture(activePointerId)) {
    try {
      capturedEl.releasePointerCapture(activePointerId)
    } catch {
      // Capture can already be released by pointercancel.
    }
  }
  capturedEl = null
  activePointerId = null
  detachPointerListeners()
}

function onPointerDown(event: PointerEvent) {
  if (event.button > 0) return
  event.preventDefault()
  event.stopPropagation()
  emit('select')
  if (dragging) stopDragging()
  dragging = true
  activePointerId = event.pointerId
  startX = event.clientX
  startY = event.clientY
  originX = x.value
  originY = y.value
  capturedEl = event.currentTarget as HTMLElement
  try {
    capturedEl.setPointerCapture(event.pointerId)
  } catch {
    capturedEl = null
  }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging) return
  if (activePointerId != null && event.pointerId !== activePointerId) return
  if (!props.lockX) {
    x.value = originX + event.clientX - startX
  }
  y.value = originY + event.clientY - startY
}

function endDrag(event: PointerEvent) {
  if (activePointerId != null && event.pointerId !== activePointerId) return
  if (!dragging) return
  stopDragging()
  emit('drag-end')
}

onUnmounted(() => {
  stopDragging()
})

function onRemoveClick(event: MouseEvent) {
  event.stopPropagation()
  emit('remove')
}
</script>

<template>
  <div
    class="draggable-seal"
    :class="{ 'draggable-seal--active': active }"
    :style="{
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
    }"
    @pointerdown="onPointerDown"
  >
    <img :src="src" alt="印章" draggable="false" />
    <button
      v-if="active"
      type="button"
      class="draggable-seal__remove"
      aria-label="删除印章"
      @click="onRemoveClick"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.draggable-seal {
  position: absolute;
  z-index: 200;
  touch-action: none;
  cursor: grab;
  user-select: none;
}

.draggable-seal:active {
  cursor: grabbing;
}

.draggable-seal img {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.draggable-seal--active {
  outline: 2px dashed #409eff;
  outline-offset: 2px;
}

.draggable-seal__remove {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: #ff4d4f;
  color: #fff;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
</style>
