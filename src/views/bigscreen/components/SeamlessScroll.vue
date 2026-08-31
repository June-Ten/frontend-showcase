<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    speed?: number
  }>(),
  {
    disabled: false,
    speed: 32,
  },
)

const wrapRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const offset = ref(0)
const paused = ref(false)
const shouldLoop = ref(false)

let frame = 0
let lastTime = 0

const measure = () => {
  const wrap = wrapRef.value
  const list = listRef.value
  if (!wrap || !list) return
  shouldLoop.value = list.scrollHeight > wrap.clientHeight + 4
  if (!shouldLoop.value) offset.value = 0
}

const tick = (time: number) => {
  if (!lastTime) lastTime = time
  const delta = time - lastTime
  lastTime = time

  if (!props.disabled && shouldLoop.value && !paused.value) {
    const list = listRef.value
    const height = list?.scrollHeight ?? 0
    if (height > 0) {
      offset.value = (offset.value + (props.speed * delta) / 1000) % height
    }
  }

  frame = window.requestAnimationFrame(tick)
}

onMounted(() => {
  measure()
  frame = window.requestAnimationFrame(tick)
  window.addEventListener('resize', measure)
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(frame)
  window.removeEventListener('resize', measure)
})

watch(
  () => props.disabled,
  () => {
    offset.value = 0
    measure()
  },
)

defineExpose({ measure })
</script>

<template>
  <div
    ref="wrapRef"
    class="seamless"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <div class="seamless__track" :style="{ transform: `translateY(${-offset}px)` }">
      <div ref="listRef" class="seamless__list">
        <slot />
      </div>
      <div v-if="shouldLoop" class="seamless__list" aria-hidden="true">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.seamless {
  height: 100%;
  overflow: hidden;
}

.seamless__track {
  will-change: transform;
}
</style>
