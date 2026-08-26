import { h, reactive, render } from 'vue'
import ComplianceNodeCard from './ComplianceNodeCard.vue'
import { getNodeSize, type MindmapNodePayload } from './mindmapData'
import { emitMindmapNodeDetail } from './nodeEvents'
import { isNodeExpanded, toggleNodeExpanded } from './nodeExpandState'

interface HostRecord {
  host: HTMLElement
  state: { payload: MindmapNodePayload; nodeId: string }
}

const hosts = new Map<string, HostRecord>()

export function renderComplianceNodeVue(payload: MindmapNodePayload, nodeId: string): HTMLElement {
  const next: MindmapNodePayload = {
    ...payload,
    expanded: isNodeExpanded(nodeId),
  }

  const cached = hosts.get(nodeId)
  if (cached) {
    cached.state.payload = next
    return cached.host
  }

  const [width, height] = getNodeSize(next.kind)
  const host = document.createElement('div')
  host.style.width = `${width}px`
  host.style.height = `${height}px`

  const state = reactive({ payload: next, nodeId })

  const Root = {
    setup() {
      const onToggleExpand = () => {
        const expanded = toggleNodeExpanded(state.nodeId)
        state.payload = { ...state.payload, expanded }
      }

      const onViewDetail = (source: 'footer' | 'citation' | 'viewLink') => {
        emitMindmapNodeDetail({
          nodeId: state.nodeId,
          source,
          payload: state.payload,
        })
      }

      return () =>
        h(ComplianceNodeCard, {
          payload: state.payload,
          nodeId: state.nodeId,
          onToggleExpand,
          onViewDetail,
        })
    },
  }

  render(h(Root), host)
  hosts.set(nodeId, { host, state })
  return host
}

export function unmountAllComplianceNodes() {
  for (const { host } of hosts.values()) {
    render(null, host)
  }
  hosts.clear()
}
