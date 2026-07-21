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

const NODE_REVEAL_ANIMATION: AnimationOptions[] = [
  { fields: ['opacity'], duration: 260, easing: 'ease-out' },
]

const nodeAnimation = {
  enter: false,
  update: NODE_REVEAL_ANIMATION,
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
    padding: [64, 88, 64, 88],
    background: '#fbfdff',
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
        ports: [
          { key: 'left', placement: [0, 0.5] },
          { key: 'right', placement: [1, 0.5] },
        ],
        radius: (datum: NodeData) => getNodeVisual(getPayload(datum)).radius,
        fill: (datum: NodeData) => getNodeVisual(getPayload(datum)).fill,
        stroke: (datum: NodeData) => getNodeVisual(getPayload(datum)).stroke,
        lineWidth: (datum: NodeData) => getNodeVisual(getPayload(datum)).lineWidth,
        labelText: (datum: NodeData) => formatNodeLabel(getPayload(datum)),
        labelFill: (datum: NodeData) => getNodeVisual(getPayload(datum)).labelFill,
        labelFontSize: (datum: NodeData) => getNodeVisual(getPayload(datum)).labelFontSize,
        labelFontWeight: (datum: NodeData) => getNodeVisual(getPayload(datum)).labelFontWeight,
        labelLineHeight: 16,
        labelPlacement: 'center',
        labelTextAlign: 'center',
        labelWordWrap: false,
        labelMaxLines: 7,
        shadowColor: 'rgba(15, 23, 42, 0.09)',
        shadowBlur: 12,
        shadowOffsetY: 3,
      },
      animation: nodeAnimation,
    },
    edge: {
      type: 'path-in-line',
      style: {
        stroke: '#9bc8ea',
        lineWidth: 1.5,
        lineDash: [4, 4],
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
