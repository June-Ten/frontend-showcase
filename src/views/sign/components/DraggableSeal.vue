<script setup lang="ts">
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

function onPointerDown(event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()
  emit('select')
  dragging = true
  startX = event.clientX
  startY = event.clientY
  originX = x.value
  originY = y.value
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging) return
  if (!props.lockX) {
    x.value = originX + event.clientX - startX
  }
  y.value = originY + event.clientY - startY
}

function onPointerUp() {
  dragging = false
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  emit('drag-end')
}

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
