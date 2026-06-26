import type { ComplianceVerdict, MindmapNodeKind, MindmapNodePayload } from './mindmapData'

export interface NodeVisual {
  fill: string
  stroke: string
  labelFill: string
  lineWidth: number
  radius: number
  labelFontSize: number
  labelFontWeight: number
}

const VERDICT_LABEL: Record<ComplianceVerdict, string> = {
  compliant: '合规',
  suspected: '疑似违规',
  violation: '违规',
}

const VERDICT_VISUAL: Record<ComplianceVerdict, Pick<NodeVisual, 'fill' | 'stroke' | 'labelFill'>> = {
  compliant: {
    fill: '#f6ffed',
    stroke: '#b7eb8f',
    labelFill: '#389e0d',
  },
  suspected: {
    fill: '#fff1f0',
    stroke: '#ffccc7',
    labelFill: '#cf1322',
  },
  violation: {
    fill: '#fff1f0',
    stroke: '#ffa39e',
    labelFill: '#a8071a',
  },
}

const BASE_VISUALS: Record<MindmapNodeKind, NodeVisual> = {
  file: {
    fill: '#ffffff',
    stroke: '#d9d9d9',
    labelFill: '#434343',
    lineWidth: 1,
    radius: 6,
    labelFontSize: 12,
    labelFontWeight: 500,
  },
  section: {
    fill: '#ffffff',
    stroke: '#91caff',
    labelFill: '#1f1f1f',
    lineWidth: 1,
    radius: 6,
    labelFontSize: 12,
    labelFontWeight: 600,
  },
  policy: {
    fill: '#fffbe6',
    stroke: '#ffe58f',
    labelFill: '#614700',
    lineWidth: 1,
    radius: 6,
    labelFontSize: 11,
    labelFontWeight: 500,
  },
  'analysis-blue': {
    fill: '#ffffff',
    stroke: '#91caff',
    labelFill: '#434343',
    lineWidth: 1,
    radius: 6,
    labelFontSize: 11,
    labelFontWeight: 500,
  },
  'analysis-yellow': {
    fill: '#fffef6',
    stroke: '#ffe58f',
    labelFill: '#434343',
    lineWidth: 1,
    radius: 6,
    labelFontSize: 11,
    labelFontWeight: 500,
  },
  advice: {
    fill: '#ffffff',
    stroke: '#91caff',
    labelFill: '#595959',
    lineWidth: 1,
    radius: 6,
    labelFontSize: 11,
    labelFontWeight: 500,
  },
  conclusion: {
    fill: '#ffffff',
    stroke: '#d9d9d9',
    labelFill: '#434343',
    lineWidth: 1,
    radius: 6,
    labelFontSize: 12,
    labelFontWeight: 600,
  },
}

export function getNodeVisual(payload: MindmapNodePayload): NodeVisual {
  const base = BASE_VISUALS[payload.kind] ?? BASE_VISUALS.file
  if (!payload.verdict) return base

  const verdictStyle = VERDICT_VISUAL[payload.verdict]
  return {
    ...base,
    ...verdictStyle,
    labelFontWeight: payload.kind === 'conclusion' ? 600 : base.labelFontWeight,
  }
}

export function formatNodeLabel(payload: MindmapNodePayload): string {
  const lines = [payload.title]

  if (payload.verdict) {
    lines.push(VERDICT_LABEL[payload.verdict])
    return lines.join('\n')
  }

  if (payload.subtitle) lines.push(payload.subtitle)
  return lines.join('\n')
}
