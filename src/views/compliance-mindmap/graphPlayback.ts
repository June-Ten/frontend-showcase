import type { Graph as G6Graph } from '@antv/g6'
import type { ComplianceLayout } from './mindmapData'
import { clearExpandedNodes } from './nodeExpandState'
import { unmountAllComplianceNodes } from './mountComplianceNode'
import {
  COMPLIANCE_PLAYBACK_LAYERS,
  buildEmptyGraphData,
  buildRootGraphData,
  complianceEdgeId,
  getComplianceEdgeDatum,
  getComplianceNodeDatum,
} from './mindmapData'

const STEP_GAP_MS = 2000
const LAYER_GAP_MS = 0
const FOCUS_DURATION_MS = 600
/** 新节点在视口中的水平位置（0 为最左，1 为最右） */
const FOCUS_X_RATIO = 0.7

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

async function focusNewNode(graph: G6Graph, nodeId: string) {
  const bounds = graph.getElementRenderBounds(nodeId)
  if (!bounds) return

  const [viewX, viewY] = graph.getViewportByCanvas(bounds.center)
  const [width, height] = graph.getSize()
  const targetX = width * (nodeId === 'root' ? 0.5 : FOCUS_X_RATIO)
  const targetY = height / 2

  await graph.translateBy([targetX - viewX, targetY - viewY], {
    duration: FOCUS_DURATION_MS,
    easing: 'ease-in-out',
  })
}

async function focusAndWait(graph: G6Graph, nodeId: string) {
  await Promise.all([focusNewNode(graph, nodeId), delay(STEP_GAP_MS)])
}

async function revealEdge(graph: G6Graph, source: string, target: string) {
  const edgeId = complianceEdgeId(source, target)
  if (graph.hasEdge(edgeId)) return

  const layout = getComplianceLayout()
  if (!graph.hasNode(target)) {
    graph.addNodeData([getComplianceNodeDatum(target, layout)])
  }
  graph.addEdgeData([getComplianceEdgeDatum(source, target)])
  await graph.draw()
}

async function revealEdgeGroup(graph: G6Graph, sources: string[], target: string) {
  const pendingSources = sources.filter(
    (source) => !graph.hasEdge(complianceEdgeId(source, target)),
  )
  if (pendingSources.length === 0) return

  const layout = getComplianceLayout()
  if (!graph.hasNode(target)) {
    graph.addNodeData([getComplianceNodeDatum(target, layout)])
  }
  graph.addEdgeData(pendingSources.map((source) => getComplianceEdgeDatum(source, target)))
  await graph.draw()
}

async function restoreRootState(graph: G6Graph) {
  unmountAllComplianceNodes()
  graph.setData(buildEmptyGraphData())
  await graph.render()
}

export async function resetComplianceGraphPlayback(graph: G6Graph) {
  cancelComplianceGraphPlayback()
  clearExpandedNodes()
  await restoreRootState(graph)
}

export async function playComplianceGraphGeneration(graph: G6Graph) {
  cancelComplianceGraphPlayback()
  const runId = playbackRunId

  clearExpandedNodes()
  await restoreRootState(graph)
  if (runId !== playbackRunId) return

  graph.setData(buildRootGraphData(getComplianceLayout()))
  await graph.render()
  if (runId !== playbackRunId) return
  await focusAndWait(graph, 'root')
  if (runId !== playbackRunId) return

  for (const layer of COMPLIANCE_PLAYBACK_LAYERS) {
    for (const step of layer.steps) {
      if (runId !== playbackRunId) return

      if (step.kind === 'edge') {
        await revealEdge(graph, step.source, step.target)
        if (runId !== playbackRunId) return
        await focusAndWait(graph, step.target)
      } else if (step.kind === 'edge-group') {
        await revealEdgeGroup(graph, step.sources, step.target)
        if (runId !== playbackRunId) return
        await focusAndWait(graph, step.target)
      }
    }

    if (runId !== playbackRunId) return
    await delay(LAYER_GAP_MS)
  }
}
