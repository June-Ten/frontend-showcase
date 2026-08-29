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
const pendingDelays = new Set<() => void>()

function isCurrentRun(runId: number) {
  return runId === playbackRunId
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    let timer = 0
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      pendingDelays.delete(finish)
      resolve()
    }
    timer = window.setTimeout(finish, ms)
    pendingDelays.add(finish)
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
  const finishers = [...pendingDelays]
  pendingDelays.clear()
  for (const finish of finishers) finish()
}

async function focusNewNode(graph: G6Graph, nodeId: string, runId: number) {
  if (!isCurrentRun(runId)) return
  const bounds = graph.getElementRenderBounds(nodeId)
  if (!bounds) return

  const [viewX, viewY] = graph.getViewportByCanvas(bounds.center)
  const [width, height] = graph.getSize()
  const targetX = width * (nodeId === 'root' ? 0.5 : FOCUS_X_RATIO)
  const targetY = height / 2

  if (!isCurrentRun(runId)) return
  await graph.translateBy([targetX - viewX, targetY - viewY], {
    duration: FOCUS_DURATION_MS,
    easing: 'ease-in-out',
  })
}

async function focusAndWait(graph: G6Graph, nodeId: string, runId: number) {
  await Promise.all([focusNewNode(graph, nodeId, runId), delay(STEP_GAP_MS)])
}

async function revealEdge(graph: G6Graph, source: string, target: string, runId: number) {
  if (!isCurrentRun(runId)) return
  const edgeId = complianceEdgeId(source, target)
  if (graph.hasEdge(edgeId)) return

  const layout = getComplianceLayout()
  if (!graph.hasNode(target)) {
    graph.addNodeData([getComplianceNodeDatum(target, layout)])
  }
  graph.addEdgeData([getComplianceEdgeDatum(source, target)])
  if (!isCurrentRun(runId)) return
  await graph.draw()
}

async function revealEdgeGroup(graph: G6Graph, sources: string[], target: string, runId: number) {
  if (!isCurrentRun(runId)) return
  const pendingSources = sources.filter(
    (source) => !graph.hasEdge(complianceEdgeId(source, target)),
  )
  if (pendingSources.length === 0) return

  const layout = getComplianceLayout()
  if (!graph.hasNode(target)) {
    graph.addNodeData([getComplianceNodeDatum(target, layout)])
  }
  graph.addEdgeData(pendingSources.map((source) => getComplianceEdgeDatum(source, target)))
  if (!isCurrentRun(runId)) return
  await graph.draw()
}

async function restoreRootState(graph: G6Graph, runId: number) {
  if (!isCurrentRun(runId)) return
  unmountAllComplianceNodes()
  if (!isCurrentRun(runId)) return
  graph.setData(buildEmptyGraphData())
  if (!isCurrentRun(runId)) return
  await graph.render()
}

export async function resetComplianceGraphPlayback(graph: G6Graph) {
  cancelComplianceGraphPlayback()
  const runId = playbackRunId
  clearExpandedNodes()
  try {
    await restoreRootState(graph, runId)
  } catch (error) {
    if (!isCurrentRun(runId)) return
    throw error
  }
}

export async function playComplianceGraphGeneration(graph: G6Graph) {
  cancelComplianceGraphPlayback()
  const runId = playbackRunId

  try {
    clearExpandedNodes()
    await restoreRootState(graph, runId)
    if (!isCurrentRun(runId)) return

    graph.setData(buildRootGraphData(getComplianceLayout()))
    await graph.render()
    if (!isCurrentRun(runId)) return
    await focusAndWait(graph, 'root', runId)
    if (!isCurrentRun(runId)) return

    for (const layer of COMPLIANCE_PLAYBACK_LAYERS) {
      for (const step of layer.steps) {
        if (!isCurrentRun(runId)) return

        if (step.kind === 'edge') {
          await revealEdge(graph, step.source, step.target, runId)
          if (!isCurrentRun(runId)) return
          await focusAndWait(graph, step.target, runId)
        } else if (step.kind === 'edge-group') {
          await revealEdgeGroup(graph, step.sources, step.target, runId)
          if (!isCurrentRun(runId)) return
          await focusAndWait(graph, step.target, runId)
        }
      }

      if (!isCurrentRun(runId)) return
      await delay(LAYER_GAP_MS)
    }
  } catch (error) {
    // Unmount/reset destroys the graph while a G6 call is in flight.
    if (!isCurrentRun(runId)) return
    throw error
  }
}
