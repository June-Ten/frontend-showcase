<template>
  <div class="mindmap-page">
    <header class="mindmap-toolbar">
      <RouterLink to="/" class="mindmap-toolbar__back">← 返回</RouterLink>
      <h1 class="mindmap-toolbar__title">合规分析思维导图</h1>
      <div class="mindmap-toolbar__actions">
        <button
          type="button"
          class="mindmap-toolbar__action mindmap-toolbar__action--primary"
          :disabled="isPlaying"
          @click="handlePlay"
        >
          {{ isPlaying ? '生成中…' : '播放生成' }}
        </button>
        <button
          type="button"
          class="mindmap-toolbar__action"
          :disabled="isPlaying"
          @click="handleReset"
        >
          重置
        </button>
        <button type="button" class="mindmap-toolbar__action" @click="handleFitView">适应画布</button>
      </div>
    </header>

    <section class="mindmap-body">
      <div class="mindmap-canvas">
        <div ref="chartRef" class="mindmap-chart" />
        <button
          type="button"
          class="mindmap-canvas__fit"
          title="适应画布"
          aria-label="适应画布"
          @click="handleFitView"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2.5 6V3.5H6M10 3.5h3.5V6M13.5 10v2.5H10M6 12.5H2.5V10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="detail"
        class="mindmap-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'mindmap-dialog-title'"
        @click.self="closeDetail"
      >
        <div class="mindmap-dialog__panel">
          <header class="mindmap-dialog__header">
            <h2 id="mindmap-dialog-title">{{ detailTitle }}</h2>
            <button type="button" class="mindmap-dialog__close" aria-label="关闭" @click="closeDetail">
              ×
            </button>
          </header>
          <div class="mindmap-dialog__body">
            <p v-for="(line, index) in detailLines" :key="index">{{ line }}</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Graph } from '@antv/g6'
import { createComplianceMindmapGraph } from './createComplianceMindmapGraph'
import { unmountAllComplianceNodes } from './mountComplianceNode'
import { onMindmapNodeDetail, type MindmapNodeDetailAction } from './nodeEvents'
import {
  fitComplianceMindmapView,
  playComplianceGraphGeneration,
  resetComplianceGraphPlayback,
} from './graphPlayback'

const chartRef = ref<HTMLElement | null>(null)
const isPlaying = ref(false)
const detail = ref<MindmapNodeDetailAction | null>(null)
let graph: Graph | null = null
let resizeObserver: ResizeObserver | null = null
let stopDetailListener: (() => void) | null = null

const detailTitle = computed(() => {
  if (!detail.value) return ''
  if (detail.value.source === 'citation') {
    return detail.value.payload.citation
      ? `${detail.value.payload.citation.label} · ${detail.value.payload.citation.count}条`
      : '分析引用'
  }
  if (detail.value.source === 'viewLink') {
    return detail.value.payload.viewLink || detail.value.payload.title
  }
  return detail.value.payload.title
})

const detailLines = computed(() => {
  if (!detail.value) return []
  const { payload, source } = detail.value
  if (source === 'viewLink' && payload.viewLink) {
    return [payload.content, payload.expandText].filter(Boolean) as string[]
  }
  return (payload.content || payload.footer || '').split('\n').filter(Boolean)
})

function openDetail(action: MindmapNodeDetailAction) {
  detail.value = action
}

function closeDetail() {
  detail.value = null
}

async function initChart() {
  if (!chartRef.value) return
  graph = await createComplianceMindmapGraph(chartRef.value)
}

async function handlePlay() {
  if (!graph || isPlaying.value) return
  isPlaying.value = true
  try {
    await playComplianceGraphGeneration(graph)
  } finally {
    isPlaying.value = false
  }
}

async function handleReset() {
  if (!graph || isPlaying.value) return
  await resetComplianceGraphPlayback(graph)
}

function handleFitView() {
  if (!graph) return
  void fitComplianceMindmapView(graph)
}

function handleResize() {
  if (!graph || !chartRef.value) return
  graph.resize(chartRef.value.clientWidth, chartRef.value.clientHeight)
}

onMounted(async () => {
  stopDetailListener = onMindmapNodeDetail(openDetail)
  await nextTick()
  await initChart()
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(chartRef.value)
  }
})

onBeforeUnmount(() => {
  stopDetailListener?.()
  resizeObserver?.disconnect()
  unmountAllComplianceNodes()
  graph?.destroy()
  graph = null
})
</script>

<style scoped lang="scss">
.mindmap-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f4f6f8;
}

.mindmap-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e6edf5;
  flex-shrink: 0;

  &__back {
    font-size: 14px;
    color: #5f7f9d;
    text-decoration: none;

    &:hover {
      color: #3b8cff;
    }
  }

  &__title {
    flex: 1;
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #1a3b66;
    letter-spacing: 0.02em;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__action {
    padding: 6px 14px;
    font-size: 13px;
    color: #3b8cff;
    background: #ffffff;
    border: 1px solid #cfe0f2;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease;

    &:hover:not(:disabled) {
      background: #f3f8ff;
      border-color: #93c5fd;
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    &--primary {
      color: #fff;
      background: #3b8cff;
      border-color: #3b8cff;

      &:hover:not(:disabled) {
        background: #2f7ef0;
      }
    }
  }
}

.mindmap-body {
  flex: 1;
  min-height: 0;
  padding: 0;
}

.mindmap-canvas {
  position: relative;
  width: 100%;
  height: 100%;
}

.mindmap-chart {
  position: relative;
  width: 100%;
  height: 100%;
  background: #f7f8fa;
  overflow: hidden;
}

.mindmap-canvas__fit {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #d5e4f3;
  border-radius: 6px;
  background: #ffffff;
  color: #5f7f9d;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    color: #3b8cff;
    border-color: #93c5fd;
  }
}
</style>

<style lang="scss">
.mindmap-dialog {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.28);
}

.mindmap-dialog__panel {
  width: min(560px, 100%);
  max-height: min(72vh, 640px);
  overflow: auto;
  border: 1px solid #d5e4f3;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.16);
}

.mindmap-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid #e6edf5;

  h2 {
    margin: 0;
    color: #1a3b66;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.4;
  }
}

.mindmap-dialog__close {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #5f7f9d;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: #f3f8ff;
    color: #1a3b66;
  }
}

.mindmap-dialog__body {
  padding: 16px 18px 20px;

  p {
    margin: 0;
    color: #3d5f80;
    font-size: 14px;
    line-height: 1.7;
  }

  p + p {
    margin-top: 10px;
  }
}
</style>
