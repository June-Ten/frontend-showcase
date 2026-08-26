import { Rect, type DisplayObject } from '@antv/g'
import { Renderer as SVGRenderer } from '@antv/g-svg'
import {
  Graph,
  type AnimationOptions,
  type EdgeOptions,
  type ElementType,
  type Graph as G6Graph,
  type NodeData,
  type NodeOptions,
} from '@antv/g6'
import { computeComplianceLayout } from './complianceLayout'
import {
  buildEmptyGraphData,
  getComplianceNodeKind,
  getNodeSize,
  MINIMAP_NODE_COLOR,
  type MindmapNodePayload,
} from './mindmapData'
import { setComplianceLayout } from './graphPlayback'
import { getHtmlNodeOffset, renderComplianceNodeHtml } from './renderComplianceNodeHtml'
import { isNodeExpanded, toggleNodeExpanded } from './nodeExpandState'
import './mindmapNodes.scss'

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

function createMinimapShape(id: string, elementType: ElementType, element: DisplayObject) {
  if (elementType !== 'node') {
    const keyShape = (element as DisplayObject & { getShape: (name: string) => DisplayObject }).getShape('key')
    return keyShape.cloneNode()
  }

  const kind = getComplianceNodeKind(id)
  const [width, height] = getNodeSize(kind)
  const color = MINIMAP_NODE_COLOR[kind]
  return new Rect({
    style: {
      width,
      height,
      fill: color.fill,
      stroke: color.stroke,
      lineWidth: 1.5,
      radius: kind === 'file' ? 8 : 4,
    },
  })
}

async function refreshNodeHtml(graph: G6Graph, nodeId: string, expanded: boolean) {
  const datum = graph.getNodeData(nodeId)
  if (!datum || Array.isArray(datum)) return

  const payload: MindmapNodePayload = {
    ...getPayload(datum),
    expanded,
  }
  const size = getNodeSize(payload.kind)
  const offset = getHtmlNodeOffset(size)

  graph.updateNodeData([
    {
      id: nodeId,
      data: payload,
      style: {
        size,
        dx: offset.dx,
        dy: offset.dy,
        innerHTML: renderComplianceNodeHtml(payload, nodeId),
      },
    },
  ])
  await graph.draw()
}

function bindNodeActions(container: HTMLElement, graph: G6Graph) {
  container.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement | null)?.closest?.('[data-action]')
    if (!(target instanceof HTMLElement)) return

    const card = target.closest('[data-node-id]')
    const nodeId = card instanceof HTMLElement ? card.dataset.nodeId : undefined
    if (!nodeId || target.dataset.action !== 'toggle-expand') return

    event.preventDefault()
    event.stopPropagation()
    const expanded = toggleNodeExpanded(nodeId)
    void refreshNodeHtml(graph, nodeId, expanded)
  })
}

export async function createComplianceMindmapGraph(container: HTMLElement): Promise<G6Graph> {
  const layout = computeComplianceLayout()
  setComplianceLayout(layout)

  const graph = new Graph({
    container,
    width: container.clientWidth || 1200,
    height: container.clientHeight || 720,
    padding: [72, 96, 72, 96],
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
        innerHTML: (datum: NodeData) => {
          const payload = getPayload(datum)
          const id = String(datum.id)
          return renderComplianceNodeHtml(
            { ...payload, expanded: isNodeExpanded(id) },
            id,
          )
        },
      },
      animation: nodeAnimation,
    },
    edge: {
      type: 'cubic-horizontal',
      style: {
        stroke: '#8ec4f0',
        lineWidth: 1.35,
        lineDash: [6, 5],
        lineCap: 'butt',
        endArrow: false,
      },
      animation: edgeAnimation,
    },
    plugins: [
      {
        type: 'grid-line',
        key: 'mindmap-grid',
        size: 28,
        stroke: 'rgba(15, 23, 42, 0.045)',
        lineWidth: 1,
        border: false,
        follow: false,
      },
      {
        type: 'minimap',
        key: 'mindmap-minimap',
        size: [168, 108],
        position: 'left-bottom',
        padding: 10,
        className: 'mindmap-minimap',
        containerStyle: {
          margin: '14px',
          border: '1px solid #d5e4f3',
          borderRadius: '8px',
          background: '#ffffff',
          boxShadow: '0 6px 18px rgba(15, 23, 42, 0.1)',
          overflow: 'hidden',
        },
        maskStyle: {
          border: '1px solid #69b1ff',
          background: 'rgba(105, 177, 255, 0.16)',
        },
        shape: createMinimapShape,
      },
    ],
    behaviors: [
      'drag-canvas',
      {
        type: 'zoom-canvas',
        sensitivity: 0.12,
        animation: false,
      },
    ],
  })

  bindNodeActions(container, graph)
  await graph.render()
  return graph
}
