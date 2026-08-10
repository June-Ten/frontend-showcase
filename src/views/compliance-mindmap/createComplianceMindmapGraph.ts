import { Renderer as SVGRenderer } from '@antv/g-svg'
import {
  Graph,
  type AnimationOptions,
  type EdgeOptions,
  type Graph as G6Graph,
  type NodeData,
  type NodeOptions,
} from '@antv/g6'
import { computeComplianceLayout } from './complianceLayout'
import { buildEmptyGraphData, getNodeSize, type MindmapNodePayload } from './mindmapData'
import { setComplianceLayout } from './graphPlayback'
import { getHtmlNodeOffset, renderComplianceNodeHtml } from './renderComplianceNodeHtml'
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
    background: 'transparent',
    devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    zoomRange: [0.35, 2.5],
    renderer: () => new SVGRenderer(),
    data: buildEmptyGraphData(),
    animation: {
      duration: 300,
      easing: 'ease-out',
    },
    node: {
      type: 'html',
      style: {
        size: (datum: NodeData) => getNodeSize(getPayload(datum).kind),
        dx: (datum: NodeData) => getHtmlNodeOffset(getNodeSize(getPayload(datum).kind)).dx,
        dy: (datum: NodeData) => getHtmlNodeOffset(getNodeSize(getPayload(datum).kind)).dy,
        ports: [
          { key: 'left', placement: [0, 0.5] },
          { key: 'right', placement: [1, 0.5] },
        ],
        innerHTML: (datum: NodeData) => renderComplianceNodeHtml(getPayload(datum), datum.id as string),
      },
      animation: nodeAnimation,
    },
    edge: {
      type: 'path-in-line',
      style: {
        stroke: '#8bbceb',
        lineWidth: 1.6,
        lineDash: [1, 7],
        lineCap: 'round',
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
  return graph
}
