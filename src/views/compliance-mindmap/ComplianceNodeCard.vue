<template>
  <div
    class="mm-card"
    :class="cardClass"
    :data-node-id="nodeId"
    :style="{ width: `${size[0]}px`, height: `${size[1]}px` }"
  >
    <template v-if="payload.kind === 'file'">
      <div class="mm-card__title">{{ payload.title }}</div>
      <span class="mm-card__check" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.6 6.2 5 8.6 9.5 3.6"
            stroke="#fff"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </template>

    <template v-else-if="payload.kind === 'advice'">
      <div class="mm-card__header">
        <div class="mm-card__title">{{ payload.title }}</div>
        <button type="button" class="mm-card__expand" @pointerdown.stop @click.stop="emit('toggleExpand')">
          {{ payload.expanded ? '收起' : '展开' }}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path
              :d="payload.expanded ? 'M2 6.5 5 3.5 8 6.5' : 'M2 3.5 5 6.5 8 3.5'"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
      <div class="mm-card__body">
        <template v-for="(line, index) in contentLines(payload.content)" :key="`c-${index}`">
          <div v-if="line.type === 'bullet'" class="mm-card__bullet">
            <span class="mm-card__dot" />
            <span>{{ line.text }}</span>
          </div>
          <p v-else>{{ line.text }}</p>
        </template>
        <template v-if="payload.expanded && payload.expandText">
          <template v-for="(line, index) in contentLines(payload.expandText)" :key="`e-${index}`">
            <div v-if="line.type === 'bullet'" class="mm-card__bullet">
              <span class="mm-card__dot" />
              <span>{{ line.text }}</span>
            </div>
            <p v-else>{{ line.text }}</p>
          </template>
        </template>
      </div>
      <button
        v-if="payload.citation"
        type="button"
        class="mm-card__cite"
        @pointerdown.stop
        @click.stop="emit('viewDetail', 'citation')"
      >
        <span class="mm-card__cite-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 2.5h5.2L12 5.4V13a.8.8 0 0 1-.8.8H4.8A.8.8 0 0 1 4 13V2.5Z" stroke="currentColor" stroke-width="1.2" />
            <path d="M9.1 2.5V5.6H12" stroke="currentColor" stroke-width="1.2" />
            <path d="M6 8.2h4.2M6 10.6h3.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
          </svg>
        </span>
        <span class="mm-card__cite-text">
          分析引用：{{ payload.citation.label }} · {{ payload.citation.count }}条
        </span>
        <svg class="mm-card__cite-arrow" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M3.2 1.8 7 5 3.2 8.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        v-if="payload.viewLink"
        type="button"
        class="mm-card__view"
        @pointerdown.stop
        @click.stop="emit('viewDetail', 'viewLink')"
      >
        {{ payload.viewLink }}
      </button>
    </template>

    <template v-else>
      <div class="mm-card__title">{{ payload.title }}</div>
      <div v-if="payload.content" class="mm-card__body">
        <template v-for="(line, index) in contentLines(payload.content)" :key="index">
          <div v-if="line.type === 'bullet'" class="mm-card__bullet">
            <span class="mm-card__dot" />
            <span>{{ line.text }}</span>
          </div>
          <p v-else>{{ line.text }}</p>
        </template>
      </div>
      <button
        v-if="payload.footer"
        type="button"
        class="mm-card__footer"
        @pointerdown.stop
        @click.stop="emit('viewDetail', 'footer')"
      >
        {{ payload.footer }}
      </button>
      <span
        v-if="payload.kind === 'conclusion' && payload.verdict"
        class="mm-card__verdict"
        :class="verdictClass"
      >
        {{ verdictLabel }}
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getNodeSize, type ComplianceVerdict, type MindmapNodePayload } from './mindmapData'

const VERDICT_LABEL: Record<ComplianceVerdict, string> = {
  compliant: '合规',
  suspected: '疑似违规',
  violation: '违规',
}

const VERDICT_CLASS: Record<ComplianceVerdict, string> = {
  compliant: 'is-ok',
  suspected: 'is-warn',
  violation: '',
}

function contentLines(content?: string) {
  if (!content) return []
  return content.split('\n').map((line) =>
    line.startsWith('• ')
      ? { type: 'bullet' as const, text: line.slice(2) }
      : { type: 'text' as const, text: line },
  )
}

const props = defineProps<{
  payload: MindmapNodePayload
  nodeId: string
}>()

const emit = defineEmits<{
  toggleExpand: []
  viewDetail: [source: 'footer' | 'citation' | 'viewLink']
}>()

const size = computed(() => getNodeSize(props.payload.kind))

const cardClass = computed(() => {
  switch (props.payload.kind) {
    case 'file':
      return 'mm-card--start'
    case 'section':
    case 'policy':
      return 'mm-card--doc'
    case 'analysis-blue':
      return 'mm-card--process is-blue'
    case 'analysis-yellow':
      return 'mm-card--process is-yellow'
    case 'advice':
      return 'mm-card--analysis'
    case 'conclusion':
      return 'mm-card--summary'
    default:
      return ''
  }
})

const verdictLabel = computed(() =>
  props.payload.verdict ? VERDICT_LABEL[props.payload.verdict] : '',
)

const verdictClass = computed(() =>
  props.payload.verdict ? VERDICT_CLASS[props.payload.verdict] : '',
)
</script>

<style lang="scss" scoped>
.mm-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  user-select: none;
}

.mm-card__title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  line-height: 1.35;
}

.mm-card__body {
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.65;
}

.mm-card__body p {
  margin: 0;
}

.mm-card__body p + p {
  margin-top: 6px;
}

.mm-card__bullet {
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin-top: 3px;
  line-height: 1.55;
}

.mm-card__bullet:first-child {
  margin-top: 0;
}

.mm-card__dot {
  flex-shrink: 0;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  transform: translateY(-2px);
}

.mm-card--start {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 10px 0 14px;
  border: 1px solid #b7d4f5;
  border-radius: 8px;
  background: #e8f3ff;
  box-shadow: 0 1px 3px rgba(37, 99, 168, 0.08);
  color: #2b6cb0;
}

.mm-card--start .mm-card__title {
  font-size: 13px;
  font-weight: 600;
  color: #2b6cb0;
}

.mm-card__check {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #3b8cff;
  box-shadow: 0 2px 6px rgba(59, 140, 255, 0.28);
}

.mm-card--doc {
  padding: 14px 16px 12px;
  border: 1px solid #ead7a3;
  border-radius: 6px;
  background: #fff8e6;
  box-shadow: 0 1px 4px rgba(120, 90, 30, 0.08);
}

.mm-card--doc .mm-card__title {
  color: #b45309;
}

.mm-card--doc .mm-card__body {
  color: #4a4538;
  flex: 1;
  min-height: 0;
}

.mm-card--doc .mm-card__dot {
  background: #c2781a;
}

.mm-card__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 10px;
  padding: 7px 10px;
  border: 0;
  border-radius: 4px;
  background: #f3e6c0;
  color: #8a5a16;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    background: #ead6a8;
  }
}

.mm-card--process {
  padding: 14px 16px;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(37, 99, 168, 0.08);
}

.mm-card--process.is-blue {
  border: 1px solid #7eb6ea;
  background: #e8f4ff;
}

.mm-card--process.is-blue .mm-card__title {
  color: #1f5f9e;
}

.mm-card--process.is-blue .mm-card__body {
  color: #3d5f80;
}

.mm-card--process.is-yellow {
  border: 1px solid #ead7a3;
  background: #fff8e6;
}

.mm-card--process.is-yellow .mm-card__title {
  color: #b45309;
}

.mm-card--process.is-yellow .mm-card__body {
  color: #4a4538;
}

.mm-card--analysis {
  padding: 12px 14px 10px;
  border: 1px solid #6ba9e8;
  border-radius: 6px;
  background: #e8f4ff;
  box-shadow: 0 1px 4px rgba(37, 99, 168, 0.1);
}

.mm-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mm-card--analysis .mm-card__title {
  color: #1f5f9e;
}

.mm-card__expand {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 0;
  padding: 0;
  background: none;
  color: #3b8cff;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
}

.mm-card__expand svg {
  display: block;
}

.mm-card--analysis .mm-card__body {
  color: #3d5f80;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.mm-card__cite {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid #d7e6f4;
  border-radius: 4px;
  background: #ffffff;
  color: #4a6b8a;
  font-size: 12px;
  line-height: 1.3;
  text-align: left;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    border-color: #8bbce6;
    background: #f7fbff;
  }
}

.mm-card__cite-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: #3b8cff;
}

.mm-card__cite-text {
  flex: 1;
  min-width: 0;
}

.mm-card__cite-arrow {
  flex-shrink: 0;
  color: #8aa7c2;
}

.mm-card__view {
  margin-top: 8px;
  padding: 0;
  border: 0;
  background: none;
  color: #7aa3c9;
  font-size: 12px;
  line-height: 1.3;
  text-align: left;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    color: #3b8cff;
  }
}

.mm-card--summary {
  padding: 12px 14px;
  border: 1px solid #b5d9c4;
  border-radius: 6px;
  background: #e8f6ee;
  box-shadow: 0 1px 4px rgba(42, 107, 74, 0.08);
}

.mm-card--summary .mm-card__title {
  color: #2a6b4a;
}

.mm-card--summary .mm-card__body {
  color: #3d6b58;
}

.mm-card__verdict {
  display: inline-block;
  margin-top: 6px;
  color: #c2410c;
  font-size: 11px;
  font-weight: 600;
}

.mm-card__verdict.is-ok {
  color: #2f7a3e;
}

.mm-card__verdict.is-warn {
  color: #c2781a;
}
</style>
