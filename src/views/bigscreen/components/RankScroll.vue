<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    interval?: number
    duration?: number
  }>(),
  {
    interval: 3000,
    duration: 700,
  },
)

const wrapRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const offset = ref(0)
const paused = ref(false)
const instant = ref(false)

let timer: number | null = null
let resizeObserver: ResizeObserver | null = null

const getRowHeight = () => {
  const first = listRef.value?.firstElementChild as HTMLElement | null
  if (!first) return 0
  const style = window.getComputedStyle(first)
  const marginTop = Number.parseFloat(style.marginTop) || 0
  const marginBottom = Number.parseFloat(style.marginBottom) || 0
  return first.offsetHeight + marginTop + marginBottom
}

const maxOffset = () => {
  const wrap = wrapRef.value
  const list = listRef.value
  if (!wrap || !list) return 0
  return Math.max(0, list.scrollHeight - wrap.clientHeight)
}

const clampOffset = (value: number) => {
  const max = maxOffset()
  if (max <= 0) return 0
  return Math.min(max, Math.max(0, value))
}

const snapOffset = (value: number) => {
  const row = getRowHeight() || 44
  if (row <= 0) return clampOffset(value)
  return clampOffset(Math.round(value / row) * row)
}

const fitViewport = () => {
  const wrap = wrapRef.value
  if (!wrap) return
  wrap.style.height = ''
  const available = wrap.clientHeight
  const row = getRowHeight() || 44
  if (available <= 0 || row <= 0) return
  const visible = Math.max(1, Math.floor(available / row))
  wrap.style.height = `${visible * row}px`
  offset.value = snapOffset(offset.value)
}

const tick = () => {
  if (paused.value) return
  instant.value = false
  const max = maxOffset()
  if (max <= 0) {
    offset.value = 0
    return
  }
  if (offset.value >= max - 1) {
    offset.value = 0
    return
  }
  const row = getRowHeight() || 44
  offset.value = Math.min(max, offset.value + row)
}

const onEnter = () => {
  const wrap = wrapRef.value
  instant.value = true
  paused.value = true
  if (wrap) wrap.scrollTop = offset.value
}

const onLeave = () => {
  const wrap = wrapRef.value
  if (wrap) {
    offset.value = snapOffset(wrap.scrollTop)
    wrap.scrollTop = 0
  }
  paused.value = false
  instant.value = true
  requestAnimationFrame(() => {
    instant.value = false
  })
}

const stop = () => {
  if (timer == null) return
  window.clearInterval(timer)
  timer = null
}

const start = () => {
  stop()
  timer = window.setInterval(tick, props.interval)
}

const listStyle = computed(() => {
  if (paused.value) {
    return { transform: 'none', transition: 'none' }
  }
  return {
    transform: `translateY(${-offset.value}px)`,
    transition: instant.value ? 'none' : `transform ${props.duration}ms ease-in-out`,
  }
})

onMounted(async () => {
  await nextTick()
  fitViewport()
  start()
  const parent = wrapRef.value?.parentElement
  if (!parent) return
  resizeObserver = new ResizeObserver(() => {
    fitViewport()
  })
  resizeObserver.observe(parent)
})

onBeforeUnmount(() => {
  stop()
  resizeObserver?.disconnect()
})

watch(paused, (value) => {
  if (value) stop()
  else start()
})
</script>

<template>
  <div
    ref="wrapRef"
    class="rank-scroll"
    :class="{ 'is-hover': paused }"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <div ref="listRef" class="rank-scroll__list" :style="listStyle">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.rank-scroll {
  height: 100%;
  overflow: hidden;
  cursor: default;
  scrollbar-width: none;

  &.is-hover {
    overflow-y: auto;
    cursor: ns-resize;
    scrollbar-width: thin;
    scrollbar-color: #1a4ea8 rgba(3, 34, 144, 0.45);
  }

  &.is-hover::-webkit-scrollbar {
    width: 6px;
  }

  &.is-hover::-webkit-scrollbar-track {
    background: rgba(3, 34, 144, 0.45);
    border-radius: 3px;
  }

  &.is-hover::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #4a9ae8 0%, #1a4ea8 50%, #032290 100%);
    border-radius: 3px;
  }

  &.is-hover::-webkit-scrollbar-thumb:hover {
    background: #4a9ae8;
  }
}

.rank-scroll::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.rank-scroll__list {
  will-change: transform;
}
</style>
