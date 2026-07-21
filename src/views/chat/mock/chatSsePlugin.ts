import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

interface ChatMessagePayload {
  role: 'user' | 'assistant'
  content: string
}

interface ChatPluginOptions {
  apiKey?: string
  model: string
}

function buildMockReply(messages: ChatMessagePayload[]) {
  const lastUser = [...messages].reverse().find((item) => item.role === 'user')
  const question = lastUser?.content ?? '你好'

  return `你好！我收到了你的问题：「${question}」。

当前未配置 DEEPSEEK_API_KEY，正在使用本地 Mock 流式回复。

在项目根目录创建 .env.local 并写入：

DEEPSEEK_API_KEY=sk-xxxxxxxx
DEEPSEEK_MODEL=deepseek-v4-flash

保存后重启 dev server，即可接入 DeepSeek Platform。`
}

function writeSSE(res: ServerResponse, data: string) {
  res.write(`data: ${data}\n\n`)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function setSSEHeaders(res: ServerResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })
}

function parseRequestMessages(body: string): ChatMessagePayload[] | null {
  try {
    const payload = JSON.parse(body) as { messages?: ChatMessagePayload[] }
    return payload.messages ?? []
  } catch {
    return null
  }
}

async function handleMockStream(res: ServerResponse, messages: ChatMessagePayload[]) {
  const reply = buildMockReply(messages)
  const chunks = reply.match(/[\s\S]{1,8}/g) ?? [reply]

  setSSEHeaders(res)

  for (const chunk of chunks) {
    writeSSE(res, JSON.stringify({ content: chunk }))
    await sleep(28 + Math.random() * 40)
  }

  writeSSE(res, '[DONE]')
  res.end()
}

async function handleDeepSeekStream(
  res: ServerResponse,
  messages: ChatMessagePayload[],
  options: Required<Pick<ChatPluginOptions, 'apiKey' | 'model'>>,
  signal?: AbortSignal,
) {
  const deepseekRes = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages,
      stream: true,
    }),
    signal,
  })

  if (!deepseekRes.ok) {
    let message = `DeepSeek API 请求失败 (${deepseekRes.status})`
    try {
      const errorBody = (await deepseekRes.json()) as {
        error?: { message?: string }
      }
      if (errorBody.error?.message) {
        message = errorBody.error.message
      }
    } catch {
      const text = await deepseekRes.text()
      if (text) message = text
    }

    res.statusCode = deepseekRes.status
    res.end(message)
    return
  }

  const reader = deepseekRes.body?.getReader()
  if (!reader) {
    res.statusCode = 500
    res.end('无法读取 DeepSeek 响应流')
    return
  }

  setSSEHeaders(res)

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const payload = trimmed.slice(6)
        if (payload === '[DONE]') {
          writeSSE(res, '[DONE]')
          res.end()
          return
        }

        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>
            error?: { message?: string }
          }

          if (json.error?.message) {
            writeSSE(res, JSON.stringify({ error: json.error.message }))
            writeSSE(res, '[DONE]')
            res.end()
            return
          }

          const content = json.choices?.[0]?.delta?.content
          if (content) {
            writeSSE(res, JSON.stringify({ content }))
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  writeSSE(res, '[DONE]')
  res.end()
}

async function handleChatRequest(
  req: IncomingMessage,
  res: ServerResponse,
  body: string,
  options: ChatPluginOptions,
) {
  const messages = parseRequestMessages(body)
  if (!messages) {
    res.statusCode = 400
    res.end('Invalid JSON body')
    return
  }

  const abortController = new AbortController()
  req.on('close', () => {
    abortController.abort()
  })

  if (options.apiKey) {
    await handleDeepSeekStream(
      res,
      messages,
      { apiKey: options.apiKey, model: options.model },
      abortController.signal,
    )
    return
  }

  await handleMockStream(res, messages)
}

function readRequestBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

export function chatSsePlugin(options: ChatPluginOptions): Plugin {
  const usingDeepSeek = Boolean(options.apiKey)

  return {
    name: 'chat-sse',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        if (usingDeepSeek) {
          console.log(`[chat-sse] DeepSeek 已启用，模型：${options.model}`)
        } else {
          console.log('[chat-sse] 未配置 DEEPSEEK_API_KEY，使用 Mock 回复')
        }
      })

      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/chat' || req.method !== 'POST') {
          next()
          return
        }

        try {
          const body = await readRequestBody(req)
          await handleChatRequest(req, res, body, options)
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            if (!res.writableEnded) res.end()
            return
          }

          if (!res.headersSent) {
            res.statusCode = 500
          }
          if (!res.writableEnded) {
            res.end(error instanceof Error ? error.message : 'Internal Server Error')
          }
        }
      })
    },
  }
}
