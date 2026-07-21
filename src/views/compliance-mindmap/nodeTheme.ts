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
    fill: '#f8fbff',
    stroke: '#b8d8f4',
    labelFill: '#284760',
    lineWidth: 1.2,
    radius: 10,
    labelFontSize: 12,
    labelFontWeight: 600,
  },
  section: {
    fill: '#f3f8ff',
    stroke: '#a9cff2',
    labelFill: '#1f3b57',
    lineWidth: 1.2,
    radius: 10,
    labelFontSize: 11,
    labelFontWeight: 600,
  },
  policy: {
    fill: '#fffaf0',
    stroke: '#ecd79a',
    labelFill: '#68551d',
    lineWidth: 1.2,
    radius: 10,
    labelFontSize: 10,
    labelFontWeight: 500,
  },
  'analysis-blue': {
    fill: '#f1f8ff',
    stroke: '#9fcbed',
    labelFill: '#24516f',
    lineWidth: 1.2,
    radius: 10,
    labelFontSize: 10,
    labelFontWeight: 500,
  },
  'analysis-yellow': {
    fill: '#fff9ed',
    stroke: '#efd38b',
    labelFill: '#6b5721',
    lineWidth: 1.2,
    radius: 10,
    labelFontSize: 10,
    labelFontWeight: 500,
  },
  advice: {
    fill: '#f1fbf9',
    stroke: '#a7dcd5',
    labelFill: '#285e59',
    lineWidth: 1.2,
    radius: 10,
    labelFontSize: 10,
    labelFontWeight: 500,
  },
  conclusion: {
    fill: '#fff3f4',
    stroke: '#efb8bd',
    labelFill: '#8a3039',
    lineWidth: 1.2,
    radius: 10,
    labelFontSize: 11,
    labelFontWeight: 600,
  },
}

export function getNodeVisual(payload: MindmapNodePayload): NodeVisual {
  const base = BASE_VISUALS[payload.kind] ?? BASE_VISUALS.file
  if (!payload.verdict || payload.kind !== 'conclusion') return base
  return { ...base, ...VERDICT_VISUAL[payload.verdict] }
}

export function formatNodeLabel(payload: MindmapNodePayload): string {
  const lines = [payload.title]

  if (payload.content) lines.push(payload.content)

  if (payload.verdict) {
    lines.push(VERDICT_LABEL[payload.verdict])
    return lines.join('\n')
  }

  if (payload.subtitle) lines.push(payload.subtitle)
  return lines.join('\n')
}
