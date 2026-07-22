import type { Graph as G6Graph } from '@antv/g6'
import type { ComplianceLayout } from './mindmapData'
import { EDGE_GROW_DURATION_MS } from './pathInLine'
import {
  COMPLIANCE_PLAYBACK_LAYERS,
  buildEmptyGraphData,
  buildRootGraphData,
  complianceEdgeId,
  getComplianceEdgeDatum,
  getComplianceNodeDatum,
} from './mindmapData'

const STEP_GAP_MS = 80
const LAYER_GAP_MS = 360

let playbackRunId = 0
let complianceLayout: ComplianceLayout | null = null

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function setComplianceLayout(layout: ComplianceLayout) {
  complianceLayout = layout
}

export function getComplianceLayout() {
  if (!complianceLayout) {
    throw new Error('Compliance layout has not been initialized')
  }
  return complianceLayout
}

export async function fitComplianceMindmapView(graph: G6Graph) {
  await graph.fitView({ when: 'always' })
  const graphWithZoom = graph as G6Graph & {
    getZoom?: () => number
    zoomTo?: (zoom: number, options?: { duration?: number }) => Promise<void> | void
  }

  const currentZoom = graphWithZoom.getZoom?.()
  if (currentZoom != null && currentZoom > 1) {
    await graphWithZoom.zoomTo?.(1, { duration: 0 })
  }
}

export function cancelComplianceGraphPlayback() {
  playbackRunId += 1
}

// 通过 innerHTML 里写入的 data-node-id 属性查找 HTML 节点卡片 DOM
function getNodeCardEl(container: HTMLElement, nodeId: string): HTMLElement | null {
  return container.querySelector<HTMLElement>(`[data-node-id="${nodeId}"]`)
}

async function growEdge(graph: G6Graph, container: HTMLElement, source: string, target: string) {
  const edgeId = complianceEdgeId(source, target)
  if (graph.hasEdge(edgeId)) return

  const layout = getComplianceLayout()

  // 先把目标节点加入图（位置正确，G6 需要它来计算边的端点）
  if (!graph.hasNode(target)) {
    graph.addNodeData([getComplianceNodeDatum(target, layout)])
  }

  // 添加边，触发线生长动画；同时立即把节点卡片隐藏
  graph.addEdgeData([getComplianceEdgeDatum(source, target)])
  await graph.draw()

  // draw() 完成后 DOM 已存在，立即用 opacity:0 遮住（transition 设为 none 跳过淡入）
  const el = getNodeCardEl(container, target)
  if (el) {
    el.style.transition = 'none'
    el.style.opacity = '0'
  }

  // 等待线生长动画完成后再淡入节点
  await delay(EDGE_GROW_DURATION_MS)

  // 恢复 transition 并淡入
  if (el) {
    el.style.transition = 'opacity 0.28s ease-out'
    el.style.opacity = '1'
  }
}

async function restoreRootState(graph: G6Graph) {
  graph.setData(buildEmptyGraphData())
  await graph.render()
}

export async function resetComplianceGraphPlayback(graph: G6Graph) {
  cancelComplianceGraphPlayback()
  await restoreRootState(graph)
}

export async function playComplianceGraphGeneration(graph: G6Graph, container: HTMLElement) {
  cancelComplianceGraphPlayback()
  const runId = playbackRunId

  await restoreRootState(graph)
  if (runId !== playbackRunId) return

  graph.setData(buildRootGraphData(getComplianceLayout()))
  await graph.render()
  if (runId !== playbackRunId) return

  for (const layer of COMPLIANCE_PLAYBACK_LAYERS) {
    for (const step of layer.steps) {
      if (runId !== playbackRunId) return

      if (step.kind === 'edge') {
        await growEdge(graph, container, step.source, step.target)
        await delay(STEP_GAP_MS)
      }
    }

    if (runId !== playbackRunId) return
    await delay(LAYER_GAP_MS)
  }

  if (runId !== playbackRunId) return
  await fitComplianceMindmapView(graph)
}
