import type { Graph as G6Graph } from '@antv/g6'
import type { ComplianceLayout } from './mindmapData'
import { EDGE_GROW_DURATION_MS } from './pathInLine'
import {
  COMPLIANCE_PLAYBACK_LAYERS,
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
}

export function cancelComplianceGraphPlayback() {
  playbackRunId += 1
}

async function revealPlaceholderNode(graph: G6Graph, nodeId: string) {
  const layout = getComplianceLayout()
  if (!graph.hasNode(nodeId)) {
    graph.addNodeData([
      getComplianceNodeDatum(nodeId, layout, { opacity: 0 }),
    ])
    await graph.draw()
  }
}

async function growEdge(graph: G6Graph, source: string, target: string) {
  const edgeId = complianceEdgeId(source, target)
  if (graph.hasEdge(edgeId)) return

  await revealPlaceholderNode(graph, target)
  graph.addEdgeData([getComplianceEdgeDatum(source, target)])
  await graph.draw()
  await delay(EDGE_GROW_DURATION_MS)
  await revealNode(graph, target)
}

async function revealNode(graph: G6Graph, nodeId: string) {
  await revealPlaceholderNode(graph, nodeId)
  graph.updateNodeData([{ id: nodeId, style: { opacity: 1 } }])
  await graph.draw()
}

async function restoreRootState(graph: G6Graph) {
  graph.setData(buildRootGraphData(getComplianceLayout()))
  await graph.render()
  await graph.fitView({ when: 'always' })
}

export async function resetComplianceGraphPlayback(graph: G6Graph) {
  cancelComplianceGraphPlayback()
  await restoreRootState(graph)
}

export async function playComplianceGraphGeneration(graph: G6Graph) {
  cancelComplianceGraphPlayback()
  const runId = playbackRunId

  await restoreRootState(graph)
  if (runId !== playbackRunId) return
  for (const layer of COMPLIANCE_PLAYBACK_LAYERS) {
    for (const step of layer.steps) {
      if (runId !== playbackRunId) return

      if (step.kind === 'edge') {
        await growEdge(graph, step.source, step.target)
        await delay(STEP_GAP_MS)
      }
    }

    if (runId !== playbackRunId) return
    await delay(LAYER_GAP_MS)
  }

  if (runId !== playbackRunId) return
  await fitComplianceMindmapView(graph)
}
