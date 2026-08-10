import { getNodeSize } from './mindmapData'
import type { ComplianceVerdict, MindmapNodeKind, MindmapNodePayload } from './mindmapData'

interface NodeThemeTokens {
  accent: string
  accentSoft: string
  border: string
  titleColor: string
  bodyColor: string
  background: string
}

const VERDICT_LABEL: Record<ComplianceVerdict, string> = {
  compliant: '合规',
  suspected: '疑似违规',
  violation: '违规',
}

const VERDICT_BADGE: Record<ComplianceVerdict, { bg: string; color: string; border: string }> = {
  compliant: { bg: 'rgba(82, 196, 26, 0.12)', color: '#389e0d', border: 'rgba(82, 196, 26, 0.35)' },
  suspected: { bg: 'rgba(250, 173, 20, 0.14)', color: '#d48806', border: 'rgba(250, 173, 20, 0.4)' },
  violation: { bg: 'rgba(255, 77, 79, 0.12)', color: '#cf1322', border: 'rgba(255, 77, 79, 0.35)' },
}

const KIND_THEME: Record<MindmapNodeKind, NodeThemeTokens> = {
  file: {
    accent: '#1a6ff4',
    accentSoft: 'rgba(26, 111, 244, 0.2)',
    border: 'rgba(59, 140, 255, 0.6)',
    titleColor: '#0f2a52',
    bodyColor: '#3a6496',
    background: '#ffffff',
  },
  section: {
    accent: '#3b8cff',
    accentSoft: 'rgba(59, 140, 255, 0.14)',
    border: 'rgba(126, 184, 234, 0.72)',
    titleColor: '#1a3b66',
    bodyColor: '#4b6d90',
    background: '#ffffff',
  },
  policy: {
    accent: '#f5a623',
    accentSoft: 'rgba(245, 166, 35, 0.16)',
    border: 'rgba(234, 192, 110, 0.74)',
    titleColor: '#5c4a1f',
    bodyColor: '#705d32',
    background: '#fffcf6',
  },
  'analysis-blue': {
    accent: '#3b8cff',
    accentSoft: 'rgba(59, 140, 255, 0.14)',
    border: 'rgba(126, 184, 234, 0.72)',
    titleColor: '#1a3b66',
    bodyColor: '#4b6d90',
    background: '#f7fbff',
  },
  'analysis-yellow': {
    accent: '#f5a623',
    accentSoft: 'rgba(245, 166, 35, 0.16)',
    border: 'rgba(234, 192, 110, 0.74)',
    titleColor: '#5c4a1f',
    bodyColor: '#705d32',
    background: '#fffaf1',
  },
  advice: {
    accent: '#2bbbad',
    accentSoft: 'rgba(43, 187, 173, 0.14)',
    border: 'rgba(113, 200, 187, 0.72)',
    titleColor: '#1f5c56',
    bodyColor: '#406e68',
    background: '#f6fffd',
  },
  conclusion: {
    accent: '#ff6b6b',
    accentSoft: 'rgba(255, 107, 107, 0.14)',
    border: 'rgba(245, 145, 145, 0.72)',
    titleColor: '#8a3039',
    bodyColor: '#91505a',
    background: '#fff8f9',
  },
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderContentLines(content: string, bulletColor: string) {
  return content
    .split('\n')
    .map((line) => {
      const text = escapeHtml(line)
      if (line.startsWith('• ')) {
        return `<div style="display:flex;align-items:baseline;gap:7px;margin-top:4px;line-height:1.5;">
          <span style="
            width:4px;
            height:4px;
            border-radius:50%;
            background:${bulletColor};
            opacity:0.75;
            flex-shrink:0;
            transform:translateY(-2px);
          "></span>
          <span style="flex:1;">${escapeHtml(line.slice(2))}</span>
        </div>`
      }
      return `<div style="margin-top:4px;line-height:1.5;">${text}</div>`
    })
    .join('')
}

function renderFileIcon(accent: string) {
  return `<span style="
    display:inline-flex;
    align-items:center;
    justify-content:center;
    width:28px;
    height:28px;
    border-radius:8px;
    background:linear-gradient(135deg, ${accent} 0%, #6db3ff 100%);
    box-shadow:0 4px 10px rgba(59, 140, 255, 0.28);
    flex-shrink:0;
  ">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" fill="rgba(255,255,255,0.95)"/>
      <path d="M14 3v5h5" stroke="rgba(255,255,255,0.85)" stroke-width="1.5"/>
    </svg>
  </span>`
}

function renderVerdictBadge(verdict: ComplianceVerdict) {
  const badge = VERDICT_BADGE[verdict]
  return `<span style="
    display:inline-flex;
    align-items:center;
    gap:5px;
    margin-top:8px;
    padding:2.5px 10px 2.5px 8px;
    border-radius:999px;
    font-size:11px;
    font-weight:600;
    letter-spacing:0.02em;
    background:${badge.bg};
    color:${badge.color};
    border:1px solid ${badge.border};
  ">
    <span style="
      width:5px;
      height:5px;
      border-radius:50%;
      background:currentColor;
      box-shadow:0 0 0 2.5px ${badge.bg};
    "></span>
    ${VERDICT_LABEL[verdict]}
  </span>`
}

export function renderComplianceNodeHtml(payload: MindmapNodePayload, nodeId?: string): string {
  const theme = KIND_THEME[payload.kind] ?? KIND_THEME.file
  const accent = payload.verdict && payload.kind === 'conclusion'
    ? VERDICT_BADGE[payload.verdict].color
    : theme.accent

  const titleHtml = payload.kind === 'file'
    ? `<div style="display:flex;align-items:center;gap:10px;">
        ${renderFileIcon(theme.accent)}
        <div style="min-width:0;">
          <div style="font-size:14px;font-weight:800;color:${theme.titleColor};line-height:1.3;letter-spacing:0.01em;">
            ${escapeHtml(payload.title)}
          </div>
          ${payload.content ? `<div style="margin-top:3px;font-size:11.5px;font-weight:500;color:${theme.bodyColor};">${escapeHtml(payload.content)}</div>` : ''}
        </div>
      </div>`
    : `<div style="font-size:13.5px;font-weight:700;color:${theme.titleColor};line-height:1.35;">
        ${escapeHtml(payload.title)}
      </div>`

  const contentHtml = payload.kind !== 'file' && payload.content
    ? `<div style="margin-top:6px;font-size:11.5px;font-weight:500;color:${theme.bodyColor};">
        ${renderContentLines(payload.content, accent)}
      </div>`
    : ''

  const subtitleHtml = payload.subtitle
    ? `<div style="margin-top:4px;font-size:11px;color:${theme.bodyColor};opacity:0.85;">
        ${escapeHtml(payload.subtitle)}
      </div>`
    : ''

  const verdictHtml = payload.verdict ? renderVerdictBadge(payload.verdict) : ''

  const isFile = payload.kind === 'file'
  const shadow = isFile
    ? '0 1px 3px rgba(26, 59, 102, 0.1), 0 6px 18px rgba(26, 111, 244, 0.16), inset 0 1px 0 rgba(255, 255, 255, 1)'
    : '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 10px rgba(26, 59, 102, 0.05), 0 12px 26px rgba(26, 59, 102, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.95)'
  const borderWidth = isFile ? '1.5px' : '1.2px'

  // G6 HTML 节点的外层容器不会把声明尺寸传给卡片（height:100% 会塌陷成内容高度），
  // 必须写死像素宽高，卡片可见范围才能与端口所在的声明盒子重合，连线才对齐垂直中心
  const [width, height] = getNodeSize(payload.kind)

  const nodeIdAttr = nodeId ? ` data-node-id="${nodeId}"` : ''
  return `<div${nodeIdAttr} style="
    box-sizing:border-box;
    width:${width}px;
    height:${height}px;
    display:flex;
    flex-direction:column;
    justify-content:center;
    padding:12px 14px 12px 18px;
    border-radius:12px;
    background:linear-gradient(180deg, #ffffff 0%, ${theme.background} 100%);
    border:${borderWidth} solid ${theme.border};
    box-shadow:${shadow};
    font-family:'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing:antialiased;
    text-rendering:optimizeLegibility;
    user-select:none;
    position:relative;
    overflow:hidden;
    transition:opacity 0.26s ease-out;
  ">
    <span style="
      position:absolute;
      top:0;
      left:0;
      bottom:0;
      width:4px;
      background:linear-gradient(180deg, ${accent} 0%, ${accent} 55%, ${theme.accentSoft} 100%);
    "></span>
    <div>
      ${titleHtml}
      ${contentHtml}
      ${subtitleHtml}
      ${verdictHtml}
    </div>
  </div>`
}

export function getHtmlNodeOffset(size: [number, number]): { dx: number; dy: number } {
  return { dx: -size[0] / 2, dy: -size[1] / 2 }
}
