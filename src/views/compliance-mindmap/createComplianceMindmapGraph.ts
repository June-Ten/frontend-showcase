import {
  Graph,
  type AnimationOptions,
  type EdgeOptions,
  type Graph as G6Graph,
  type NodeData,
  type NodeOptions,
} from '@antv/g6'
import { computeComplianceLayout } from './complianceLayout'
import { buildRootGraphData, getNodeSize, type MindmapNodePayload } from './mindmapData'
import { setComplianceLayout } from './graphPlayback'
import { formatNodeLabel, getNodeVisual } from './nodeTheme'
import { registerPathInLineEdge } from './pathInLine'

function getPayload(datum: { data?: Record<string, unknown> }): MindmapNodePayload {
  return (datum.data ?? { kind: 'file', title: '' }) as unknown as MindmapNodePayload
}

const NODE_FADE_ANIMATION: AnimationOptions[] = [
  { fields: ['opacity'], duration: 300, easing: 'ease-out' },
]

const nodeAnimation = {
  enter: false,
  update: NODE_FADE_ANIMATION,
} satisfies NodeOptions['animation']

const edgeAnimation = {
  enter: false,
  exit: false,
} satisfies EdgeOptions['animation']

export async function createComplianceMindmapGraph(container: HTMLElement): Promise<G6Graph> {
  registerPathInLineEdge()

  const layout = computeComplianceLayout()
  setComplianceLayout(layout)

  const graph = new Graph({
    container,
    width: container.clientWidth || 1200,
    height: container.clientHeight || 720,
    padding: [48, 64, 48, 64],
    background: '#f8fafc',
    devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    zoomRange: [0.35, 2.5],
    data: buildRootGraphData(layout),
    animation: {
      duration: 300,
      easing: 'ease-out',
    },
    node: {
      type: 'rect',
      style: {
        size: (datum: NodeData) => getNodeSize(getPayload(datum).kind),
        radius: (datum: NodeData) => getNodeVisual(getPayload(datum)).radius,
        fill: (datum: NodeData) => getNodeVisual(getPayload(datum)).fill,
        stroke: (datum: NodeData) => getNodeVisual(getPayload(datum)).stroke,
        lineWidth: (datum: NodeData) => getNodeVisual(getPayload(datum)).lineWidth,
        labelText: (datum: NodeData) => formatNodeLabel(getPayload(datum)),
        labelFill: (datum: NodeData) => getNodeVisual(getPayload(datum)).labelFill,
        labelFontSize: (datum: NodeData) => getNodeVisual(getPayload(datum)).labelFontSize,
        labelFontWeight: (datum: NodeData) => getNodeVisual(getPayload(datum)).labelFontWeight,
        labelLineHeight: 14,
        labelPlacement: 'center',
        labelTextAlign: 'center',
        labelWordWrap: false,
        labelMaxLines: 2,
        shadowColor: 'rgba(15, 23, 42, 0.06)',
        shadowBlur: 8,
        shadowOffsetY: 2,
      },
      animation: nodeAnimation,
    },
    edge: {
      type: 'path-in-line',
      style: {
        stroke: '#c9d4e3',
        lineWidth: 1,
        lineDash: [5, 4],
        endArrow: false,
      },
      animation: edgeAnimation,
    },
    behaviors: [
      'drag-canvas',
      {
        type: 'zoom-canvas',
        sensitivity: 0.12,
        animation: false,
      },
    ],
  })

  await graph.render()
  await graph.fitView({ when: 'always' })
  return graph
}
