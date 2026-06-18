export interface NodeVisual {
  fill: string
  stroke: string
  label: string
  labelSub?: string
}

/** 企查查式股权穿透图：#1890ff 主色、白底蓝框、边上持股比例 */
export const PENETRATION_THEME = {
  primary: '#1890ff',
  primaryDark: '#096dd9',
  edgeStroke: '#91d5ff',
  edgeLabelFill: '#1890ff',
  badgeFill: '#1890ff',
  badgeText: '#ffffff',
  canvasBg: '#f5f7fa',
  textTitle: '#333333',
  textSub: '#999999',
} as const

export function getPenetrationNodeVisual(_position?: string, kind?: string): NodeVisual {
  if (kind === 'target') {
    return {
      fill: PENETRATION_THEME.primary,
      stroke: PENETRATION_THEME.primary,
      label: '#ffffff',
    }
  }

  return {
    fill: '#ffffff',
    stroke: PENETRATION_THEME.primary,
    label: PENETRATION_THEME.textTitle,
    labelSub: PENETRATION_THEME.textSub,
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
  labelBackgroundPadding: [1, 4, 1, 4] as [number, number, number, number],
  labelFill: PENETRATION_THEME.edgeLabelFill,
  labelFontSize: 12,
  labelFontWeight: 400,
}
