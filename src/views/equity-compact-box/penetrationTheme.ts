export interface NodeVisual {
  fill: string
  stroke: string
  label: string
  labelSub?: string
  lineWidth: number
  shadowColor: string
  shadowBlur: number
  shadowOffsetY: number
}

/** 企查查式股权穿透图：#1890ff 主色、白底蓝框、边上持股比例 */
export const PENETRATION_THEME = {
  primary: '#1890ff',
  primaryDark: '#096dd9',
  /** 自然人节点强调色（暖橙） */
  person: '#fa8c16',
  personSoft: '#ffd591',
  companyStroke: '#a3d0ff',
  edgeStroke: '#c4ddf7',
  edgeStrokeActive: '#1890ff',
  edgeLabelFill: '#1f6fd6',
  edgeLabelStroke: '#d6e8fb',
  badgeFill: '#1890ff',
  badgeFillHover: '#096dd9',
  badgeText: '#ffffff',
  canvasBg: '#f4f7fc',
  textTitle: '#1f2733',
  textSub: '#8a94a6',
  /** 目标主体渐变 */
  targetFill: 'l(90) 0:#3aa0ff 1:#1677ff',
  targetShadow: 'rgba(22, 119, 255, 0.35)',
  nodeShadow: 'rgba(24, 79, 153, 0.16)',
  personShadow: 'rgba(250, 140, 22, 0.18)',
} as const

export function getPenetrationNodeVisual(_position?: string, kind?: string): NodeVisual {
  if (kind === 'target') {
    return {
      fill: PENETRATION_THEME.targetFill,
      stroke: PENETRATION_THEME.primary,
      label: '#ffffff',
      lineWidth: 0,
      shadowColor: PENETRATION_THEME.targetShadow,
      shadowBlur: 18,
      shadowOffsetY: 6,
    }
  }

  if (kind === 'person') {
    return {
      fill: '#fffaf3',
      stroke: PENETRATION_THEME.personSoft,
      label: PENETRATION_THEME.textTitle,
      labelSub: PENETRATION_THEME.person,
      lineWidth: 1.5,
      shadowColor: PENETRATION_THEME.personShadow,
      shadowBlur: 14,
      shadowOffsetY: 4,
    }
  }

  return {
    fill: '#ffffff',
    stroke: PENETRATION_THEME.companyStroke,
    label: PENETRATION_THEME.textTitle,
    labelSub: PENETRATION_THEME.textSub,
    lineWidth: 1.5,
    shadowColor: PENETRATION_THEME.nodeShadow,
    shadowBlur: 14,
    shadowOffsetY: 4,
  }
}

export function formatNodeLabel(name: string, percent?: string, kind?: string) {
  if (kind === 'target') return name
  if (percent) {
    return `${name}\n持股比例：${percent}`
  }
  return name
}

/** 边持股比例：显示在最后一段竖线右侧，不压在连线上 */
export const EDGE_PERCENT_LABEL_STYLE = {
  labelOffsetX: 8,
  labelOffsetY: 0,
  labelAutoRotate: false,
  labelTextAlign: 'left' as const,
  labelBackground: true,
  labelBackgroundFill: '#ffffff',
  labelBackgroundOpacity: 1,
  labelBackgroundStroke: PENETRATION_THEME.edgeLabelStroke,
  labelBackgroundLineWidth: 1,
  labelBackgroundRadius: 8,
  labelBackgroundPadding: [2, 7, 2, 7] as [number, number, number, number],
  labelFill: PENETRATION_THEME.edgeLabelFill,
  labelFontSize: 12,
  labelFontWeight: 500,
}
