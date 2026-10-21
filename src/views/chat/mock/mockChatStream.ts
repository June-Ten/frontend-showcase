export interface MockChatMessage {
  role: 'user' | 'assistant' | string
  content: string
}

export function buildMockReply(messages: MockChatMessage[]) {
  const lastUser = [...messages].reverse().find((item) => item.role === 'user')
  const question = lastUser?.content ?? '你好'

  return `你好！我收到了你的问题：「${question}」。

当前页面没有可用的对话服务端，正在使用本地 Mock 流式回复。

本地开发时可在项目根目录创建 .env.local 并写入：

DEEPSEEK_API_KEY=sk-xxxxxxxx
DEEPSEEK_MODEL=deepseek-v4-flash

保存后重启 dev server，即可接入 DeepSeek Platform。`
}

export function shouldUseMockChatStream(response?: Response | null, error?: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') return false
  if (error instanceof TypeError) return true
  if (!response) return Boolean(error)

  if (response.status === 404 || response.status === 405) return true
  if (!response.ok) return false

  const contentType = response.headers.get('content-type') ?? ''
  return contentType.includes('text/html')
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export async function streamMockReply(
  messages: MockChatMessage[],
  onChunk: (text: string) => void,
  signal?: AbortSignal,
) {
  const reply = buildMockReply(messages)
  const chunks = reply.match(/[\s\S]{1,8}/g) ?? [reply]

  for (const chunk of chunks) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
    onChunk(chunk)
    await sleep(28 + Math.random() * 40, signal)
  }
}
