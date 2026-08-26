import { getNodeSize } from './mindmapData'
import type { ComplianceVerdict, MindmapNodeKind, MindmapNodePayload } from './mindmapData'

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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderBody(content: string) {
  return content
    .split('\n')
    .map((line) => {
      if (line.startsWith('• ')) {
        return `<div class="mm-card__bullet">
          <span class="mm-card__dot"></span>
          <span>${escapeHtml(line.slice(2))}</span>
        </div>`
      }
      return `<p>${escapeHtml(line)}</p>`
    })
    .join('')
}

function renderCheckIcon() {
  return `<span class="mm-card__check" aria-hidden="true">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.6 6.2 5 8.6 9.5 3.6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </span>`
}

function renderExpandIcon(expanded: boolean) {
  const d = expanded ? 'M2 6.5 5 3.5 8 6.5' : 'M2 3.5 5 6.5 8 3.5'
  return `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="${d}" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
}

function renderDocIcon() {
  return `<span class="mm-card__cite-icon" aria-hidden="true">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2.5h5.2L12 5.4V13a.8.8 0 0 1-.8.8H4.8A.8.8 0 0 1 4 13V2.5Z" stroke="currentColor" stroke-width="1.2"/>
      <path d="M9.1 2.5V5.6H12" stroke="currentColor" stroke-width="1.2"/>
      <path d="M6 8.2h4.2M6 10.6h3.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
  </span>`
}

function wrapCard(kindClass: string, payload: MindmapNodePayload, nodeId: string | undefined, inner: string) {
  const [width, height] = getNodeSize(payload.kind)
  const nodeIdAttr = nodeId ? ` data-node-id="${nodeId}"` : ''
  return `<div${nodeIdAttr} class="mm-card ${kindClass}" style="width:${width}px;height:${height}px;">
    ${inner}
  </div>`
}

function renderStartCard(payload: MindmapNodePayload, nodeId?: string) {
  return wrapCard(
    'mm-card--start',
    payload,
    nodeId,
    `<div class="mm-card__title">${escapeHtml(payload.title)}</div>${renderCheckIcon()}`,
  )
}

function renderDocumentCard(payload: MindmapNodePayload, nodeId?: string) {
  const footer = payload.footer
    ? `<div class="mm-card__footer">${escapeHtml(payload.footer)}</div>`
    : ''
  return wrapCard(
    'mm-card--doc',
    payload,
    nodeId,
    `<div class="mm-card__title">${escapeHtml(payload.title)}</div>
     <div class="mm-card__body">${payload.content ? renderBody(payload.content) : ''}</div>
     ${footer}`,
  )
}

function renderProcessCard(payload: MindmapNodePayload, nodeId?: string) {
  const tone = payload.kind === 'analysis-yellow' ? 'is-yellow' : 'is-blue'
  return wrapCard(
    `mm-card--process ${tone}`,
    payload,
    nodeId,
    `<div class="mm-card__title">${escapeHtml(payload.title)}</div>
     <div class="mm-card__body">${payload.content ? renderBody(payload.content) : ''}</div>`,
  )
}

function renderAnalysisCard(payload: MindmapNodePayload, nodeId?: string) {
  const expanded = Boolean(payload.expanded)
  const body = [payload.content, expanded ? payload.expandText : '']
    .filter(Boolean)
    .map((text) => renderBody(text as string))
    .join('')

  const citation = payload.citation
    ? `<div class="mm-card__cite">
        ${renderDocIcon()}
        <span class="mm-card__cite-text">分析引用：${escapeHtml(payload.citation.label)} · ${payload.citation.count}条</span>
        <svg class="mm-card__cite-arrow" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M3.2 1.8 7 5 3.2 8.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>`
    : ''

  const viewLink = payload.viewLink
    ? `<div class="mm-card__view">${escapeHtml(payload.viewLink)}</div>`
    : ''

  return wrapCard(
    'mm-card--analysis',
    payload,
    nodeId,
    `<div class="mm-card__header">
        <div class="mm-card__title">${escapeHtml(payload.title)}</div>
        <button type="button" class="mm-card__expand" data-action="toggle-expand">
          ${expanded ? '收起' : '展开'}${renderExpandIcon(expanded)}
        </button>
      </div>
      <div class="mm-card__body">${body}</div>
      ${citation}
      ${viewLink}`,
  )
}

function renderSummaryCard(payload: MindmapNodePayload, nodeId?: string) {
  const verdict = payload.verdict
    ? `<span class="mm-card__verdict ${VERDICT_CLASS[payload.verdict]}">${VERDICT_LABEL[payload.verdict]}</span>`
    : ''
  return wrapCard(
    'mm-card--summary',
    payload,
    nodeId,
    `<div class="mm-card__title">${escapeHtml(payload.title)}</div>
     <div class="mm-card__body">${payload.content ? renderBody(payload.content) : ''}</div>
     ${verdict}`,
  )
}

const CARD_RENDERERS: Record<MindmapNodeKind, (payload: MindmapNodePayload, nodeId?: string) => string> = {
  file: renderStartCard,
  section: renderDocumentCard,
  policy: renderDocumentCard,
  'analysis-blue': renderProcessCard,
  'analysis-yellow': renderProcessCard,
  advice: renderAnalysisCard,
  conclusion: renderSummaryCard,
}

export function renderComplianceNodeHtml(payload: MindmapNodePayload, nodeId?: string): string {
  const render = CARD_RENDERERS[payload.kind] ?? renderStartCard
  return render(payload, nodeId)
}

export function getHtmlNodeOffset(size: [number, number]): { dx: number; dy: number } {
  return { dx: -size[0] / 2, dy: -size[1] / 2 }
}
