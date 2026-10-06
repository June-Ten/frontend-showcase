import { onBeforeUnmount, ref } from 'vue'
import type { ChatMessage, ChatStreamChunk } from '../types'

const CHAT_API = '/api/chat'

function parseSSELine(line: string): ChatStreamChunk | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith(':')) return null

  if (trimmed === 'data: [DONE]') {
    return { content: '' }
  }

  if (!trimmed.startsWith('data: ')) return null

  try {
    return JSON.parse(trimmed.slice(6)) as ChatStreamChunk
  } catch {
    return null
  }
}

function isAbortError(err: unknown) {
  return err instanceof Error && err.name === 'AbortError'
}

export function useChatSSE() {
  const isStreaming = ref(false)
  const error = ref<string | null>(null)
  let abortController: AbortController | null = null

  async function streamChat(
    messages: ChatMessage[],
    onChunk: (text: string) => void,
  ): Promise<void> {
    abortController?.abort()
    const controller = new AbortController()
    abortController = controller

    isStreaming.value = true
    error.value = null

    try {
      const response = await fetch(CHAT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          messages: messages.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`请求失败 (${response.status})`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        if (controller.signal.aborted) return

        const { done, value } = await reader.read()
        if (done || controller.signal.aborted) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const chunk = parseSSELine(line)
          if (!chunk) continue

          if (chunk.error) {
            throw new Error(chunk.error)
          }

          if (chunk.content != null && chunk.content !== '') {
            onChunk(chunk.content)
          }
        }
      }
    } catch (err) {
      if (isAbortError(err)) {
        return
      }
      error.value = err instanceof Error ? err.message : '未知错误'
      throw err
    } finally {
      // Only the in-flight request may clear streaming state. An aborted
      // request's finally must not null a newer AbortController or flip
      // isStreaming off while a replacement stream is still running.
      if (abortController === controller) {
        isStreaming.value = false
        abortController = null
      }
    }
  }

  function stopStreaming() {
    abortController?.abort()
    abortController = null
    isStreaming.value = false
  }

  onBeforeUnmount(() => {
    stopStreaming()
  })

  return {
    isStreaming,
    error,
    streamChat,
    stopStreaming,
  }
}
