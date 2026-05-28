import { Graph, type Graph as G6Graph } from '@antv/g6'
import type { EquityEdgeRelation, EquityGraphData, EquityNodeType } from './equityData'

interface EquityGraphNodeData {
  name: string
  type?: EquityNodeType
}

interface EquityGraphEdgeData {
  percent?: string
  relation?: EquityEdgeRelation
}

const NODE_COLORS: Record<EquityNodeType, { fill: string; stroke: string }> = {
  target: { fill: '#312e81', stroke: '#6366f1' },
  company: { fill: '#1e293b', stroke: '#475569' },
  person: { fill: '#134e4a', stroke: '#2dd4bf' },
}

function nodeColors(type?: EquityNodeType) {
  return NODE_COLORS[type ?? 'company']
}

function formatLabel(data: EquityGraphNodeData) {
  if (data.type === 'target') {
    return `${data.name}\n↑ 被投资  ↓ 对外投资`
  }
  return data.name
}

function getEdgeData(datum: { data?: Record<string, unknown> }): EquityGraphEdgeData {
  return (datum.data ?? {}) as EquityGraphEdgeData
}

function getNodeData(datum: { data?: Record<string, unknown> }): EquityGraphNodeData {
  return (datum.data ?? {}) as unknown as EquityGraphNodeData
}

export function createEquityGraph(container: HTMLElement, data: EquityGraphData): G6Graph {
  const width = container.clientWidth || 800
  const height = container.clientHeight || 600

  const graph = new Graph({
    container,
    width,
    height,
    autoFit: 'view',
    padding: [40, 48, 40, 48],
    data,
    layout: {
      type: 'antv-dagre',
      rankdir: 'BT',
      nodesep: 32,
      ranksep: 56,
      controlPoints: true,
    },
    node: {
      type: 'rect',
      style: {
        size: (datum) => (getNodeData(datum).type === 'target' ? [200, 72] : [160, 56]),
        radius: 8,
        lineWidth: 1.5,
        fill: (datum) => nodeColors(getNodeData(datum).type).fill,
        stroke: (datum) => nodeColors(getNodeData(datum).type).stroke,
        labelText: (datum) => formatLabel(getNodeData(datum)),
        labelFill: '#f1f5f9',
        labelFontSize: 12,
        labelFontWeight: 500,
        labelLineHeight: 18,
        labelWordWrap: true,
        labelMaxWidth: 140,
        labelPlacement: 'center',
        labelTextAlign: 'center',
        ports: [{ placement: 'top' }, { placement: 'bottom' }],
      },
      state: {
        active: {
          halo: false,
        },
      },
    },
    edge: {
      type: 'polyline',
      style: {
        radius: 0,
        router: { type: 'orth' },
        sourcePort: 'top',
        targetPort: 'bottom',
        stroke: (datum) =>
          getEdgeData(datum).relation === 'investment'
            ? 'rgba(45, 212, 191, 0.55)'
            : 'rgba(99, 102, 241, 0.45)',
        lineWidth: 1.5,
        labelText: (datum) => getEdgeData(datum).percent ?? '',
        labelFill: (datum) =>
          getEdgeData(datum).relation === 'investment' ? '#5eead4' : '#a5b4fc',
        labelFontSize: 11,
        labelBackground: true,
        labelBackgroundFill: 'rgba(18, 18, 18, 0.9)',
        labelBackgroundRadius: 4,
        labelPadding: [2, 6],
      },
      state: {
        active: {
          halo: false,
        },
      },
    },
    behaviors: [
      'drag-canvas',
      {
        type: 'zoom-canvas',
        sensitivity: 0.15,
      },
      { type: 'hover-activate', degree: 1 },
    ],
    plugins: [
      // {
      //   type: 'tooltip',
      //   trigger: 'pointerenter',
      //   getContent: (_event: unknown, items: Array<{ data?: Record<string, unknown> }>) => {
      //     const item = items[0]
      //     if (!item) return ''
      //     const data = item.data as EquityGraphNodeData | { percent?: string } | undefined
      //     if (!data) return ''
      //     if ('name' in data && data.name) {
      //       return `<div style="padding:4px 2px;font-size:13px;color:#e2e8f0">${data.name}</div>`
      //     }
      //     if ('percent' in data && data.percent) {
      //       return `<div style="padding:4px 2px;font-size:13px;color:#a5b4fc">持股 ${data.percent}</div>`
      //     }
      //     return ''
      //   },
      // },
    ],
  })

  graph.render()
  return graph
}

export async function resetEquityGraph(graph: G6Graph, data: EquityGraphData) {
  graph.setData(data)
  await graph.render()
  await graph.fitView()
}
