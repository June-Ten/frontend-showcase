import { Graph, type Graph as G6Graph } from '@antv/g6'
import type { EquityEdgeRelation, EquityGraphData, EquityNodeType } from './equityData'

interface EquityGraphNodeData {
  name: string
  type?: EquityNodeType
  region?: string
}

interface EquityGraphEdgeData {
  percent?: string
  relation?: EquityEdgeRelation
}

/** 参考穿透图：境外/中间主体浅蓝描边，境内目标主体实心蓝 */
const OFFSHORE_STYLE = {
  fill: '#f5f9fd',
  stroke: '#7eb2dd',
  labelFill: '#1f2937',
}

const TARGET_STYLE = {
  fill: '#1a5fb4',
  stroke: '#1a5fb4',
  labelFill: '#ffffff',
}

function nodeStyle(type?: EquityNodeType) {
  return type === 'target' ? TARGET_STYLE : OFFSHORE_STYLE
}

function buildShareholderPercentMap(data: EquityGraphData): Map<string, string> {
  const map = new Map<string, string>()
  for (const edge of data.edges) {
    if (edge.data?.relation === 'shareholder' && edge.data.percent) {
      map.set(edge.source, edge.data.percent)
    }
  }
  return map
}

function formatLabel(data: EquityGraphNodeData, nodeId: string, percentMap: Map<string, string>) {
  if (data.type === 'person') {
    const percent = percentMap.get(nodeId)
    // return percent ? `${data.name}\n${percent}` : data.name
    return data.name
  }
  if (data.region) {
    return `${data.name}\n(${data.region})`
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
  const shareholderPercents = buildShareholderPercentMap(data)

  const graph = new Graph({
    container,
    width,
    height,
    autoFit: 'view',
    padding: [48, 56, 48, 56],
    data,
    layout: {
      type: 'antv-dagre',
      rankdir: 'TB',
      nodesep: 36,
      ranksep: 64,
      controlPoints: true,
    },
    node: {
      type: 'rect',
      style: {
        size: (datum) => {
          const type = getNodeData(datum).type
          // if (type === 'target') return [220, 64]
          // if (type === 'person') return [128, 52]
          return [200, 56]
        },
        radius: 4,
        lineWidth: 1,
        fill: (datum) => nodeStyle(getNodeData(datum).type).fill,
        stroke: (datum) => nodeStyle(getNodeData(datum).type).stroke,
        labelText: (datum) =>
          formatLabel(getNodeData(datum), String(datum.id), shareholderPercents),
        labelFill: (datum) => nodeStyle(getNodeData(datum).type).labelFill,
        labelFontSize: 12,
        labelFontWeight: (datum) => (getNodeData(datum).type === 'target' ? 600 : 500),
        labelLineHeight: 18,
        labelWordWrap: true,
        // 人名/地区与持股比例等为两行，默认 maxLines=1 会在第一行末尾误加省略号
        labelMaxLines: (datum) => {
          const data = getNodeData(datum)
          if (data.type === 'person' || data.region) return 2
          return 3
        },
        labelMaxWidth: (datum) => (getNodeData(datum).type === 'person' ? 116 : 188),
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
        router: { type: 'orth' },
        lineWidth: 1,
        endArrow: true,
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
  })

  graph.render()
  return graph
}

export async function resetEquityGraph(graph: G6Graph, data: EquityGraphData) {
  graph.setData(data)
  await graph.render()
  await graph.fitView()
}
