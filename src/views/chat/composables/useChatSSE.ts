import { ref } from 'vue'
import { shouldUseMockChatStream, streamMockReply } from '../mock/mockChatStream'
import type { ChatMessage, ChatStreamChunk } from '../types'

const CHAT_API = `${import.meta.env.BASE_URL}api/chat`

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

export function useChatSSE() {
  const isStreaming = ref(false)
  const error = ref<string | null>(null)
  let abortController: AbortController | null = null

  async function streamChat(
    messages: ChatMessage[],
    onChunk: (text: string) => void,
  ): Promise<void> {
    abortController?.abort()
    abortController = new AbortController()

    isStreaming.value = true
    error.value = null

    const payload = messages.map(({ role, content }) => ({ role, content }))

    try {
      let response: Response
      try {
        response = await fetch(CHAT_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({ messages: payload }),
          signal: abortController.signal,
        })
      } catch (err) {
        if (shouldUseMockChatStream(null, err)) {
          await streamMockReply(payload, onChunk, abortController.signal)
          return
        }
        throw err
      }

      if (shouldUseMockChatStream(response)) {
        await streamMockReply(payload, onChunk, abortController.signal)
        return
      }

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
        const { done, value } = await reader.read()
        if (done) break

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
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }
      error.value = err instanceof Error ? err.message : '未知错误'
      throw err
    } finally {
      isStreaming.value = false
      abortController = null
    }
  }

  function stopStreaming() {
    abortController?.abort()
    abortController = null
    isStreaming.value = false
  }

  return {
    isStreaming,
    error,
    streamChat,
    stopStreaming,
  }
}
