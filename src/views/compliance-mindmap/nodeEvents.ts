import type { MindmapNodePayload } from './mindmapData'

export type MindmapDetailSource = 'footer' | 'citation' | 'viewLink'

export interface MindmapNodeDetailAction {
  nodeId: string
  source: MindmapDetailSource
  payload: MindmapNodePayload
}

type DetailListener = (action: MindmapNodeDetailAction) => void

const listeners = new Set<DetailListener>()

export function onMindmapNodeDetail(listener: DetailListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitMindmapNodeDetail(action: MindmapNodeDetailAction) {
  listeners.forEach((listener) => listener(action))
}
