import { computed, ref } from 'vue'
import type { ChatMessage, Conversation, SuggestionCard } from '../types'
import { useChatSSE } from './useChatSSE'

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function deriveTitle(content: string) {
  const text = content.trim().replace(/\s+/g, ' ')
  return text.length > 24 ? `${text.slice(0, 24)}…` : text || '新对话'
}

export const suggestionCards: SuggestionCard[] = [
  {
    icon: '💡',
    title: '提高工作效率的 10 个方法',
    prompt: '请给我 10 个提高工作效率的实用方法',
  },
  {
    icon: '🎓',
    title: '解释一下量子计算',
    prompt: '请用通俗易懂的方式解释一下量子计算',
  },
  {
    icon: '💻',
    title: '写一段 Python 代码',
    prompt: '写一段 Python 代码，实现快速排序算法并附带注释',
  },
  {
    icon: '✏️',
    title: '帮我写一篇产品介绍文案',
    prompt: '帮我写一篇智能手表的产品介绍文案，突出健康监测与续航优势',
  },
]

const historySeeds: Array<{ title: string; daysAgo: number }> = [
  { title: '如何提高工作效率', daysAgo: 0 },
  { title: 'Python 入门教程', daysAgo: 0 },
  { title: 'Vue3 组件设计模式', daysAgo: 1 },
  { title: '前端性能优化方案', daysAgo: 1 },
  { title: 'TypeScript 类型体操', daysAgo: 3 },
  { title: '微服务架构设计', daysAgo: 5 },
]

function createSeedConversations(): Conversation[] {
  const now = Date.now()
  return historySeeds.map((seed, index) => ({
    id: `seed-${index}`,
    title: seed.title,
    messages: [],
    createdAt: now - seed.daysAgo * 86_400_000,
    updatedAt: now - seed.daysAgo * 86_400_000,
  }))
}

export function useChat() {
  const conversations = ref<Conversation[]>(createSeedConversations())
  const activeConversationId = ref<string | null>(null)
  const inputText = ref('')
  const selectedModel = ref('ChatGPT 4o')

  const { isStreaming, error, streamChat, stopStreaming } = useChatSSE()

  const activeConversation = computed(() =>
    conversations.value.find((item) => item.id === activeConversationId.value) ?? null,
  )

  const messages = computed(() => activeConversation.value?.messages ?? [])

  const hasMessages = computed(() => messages.value.length > 0)

  const canSend = computed(
    () => inputText.value.trim().length > 0 && !isStreaming.value,
  )

  const historyGroups = computed(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const startOfYesterday = startOfToday - 86_400_000

    const groups: Array<{ label: string; items: Conversation[] }> = [
      { label: '今天', items: [] },
      { label: '昨天', items: [] },
      { label: '更早', items: [] },
    ]

    for (const conversation of conversations.value) {
      if (conversation.updatedAt >= startOfToday) {
        groups[0].items.push(conversation)
      } else if (conversation.updatedAt >= startOfYesterday) {
        groups[1].items.push(conversation)
      } else {
        groups[2].items.push(conversation)
      }
    }

    return groups.filter((group) => group.items.length > 0)
  })

  function createConversation(title = '新对话') {
    const conversation: Conversation = {
      id: createId(),
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    conversations.value.unshift(conversation)
    activeConversationId.value = conversation.id
    return conversation
  }

  function selectConversation(id: string) {
    activeConversationId.value = id
  }

  function newChat() {
    activeConversationId.value = null
    inputText.value = ''
    stopStreaming()
  }

  async function sendMessage(content?: string) {
    const text = (content ?? inputText.value).trim()
    if (!text || isStreaming.value) return

    let conversationId = activeConversationId.value

    if (!conversationId) {
      const conversation = createConversation(deriveTitle(text))
      conversationId = conversation.id
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: text,
    }

    const assistantMessage: ChatMessage = {
      id: createId(),
      role: 'assistant',
      content: '',
      streaming: true,
    }

    const conversation = conversations.value.find((item) => item.id === conversationId)
    if (!conversation) return

    conversation.messages.push(userMessage, assistantMessage)
    conversation.updatedAt = Date.now()

    if (conversation.messages.length === 2) {
      conversation.title = deriveTitle(text)
    }

    inputText.value = ''

    const assistantMessageId = assistantMessage.id

    try {
      await streamChat(conversation.messages.slice(0, -1), (chunk) => {
        const active = conversations.value.find((item) => item.id === conversationId)
        const target = active?.messages.find((item) => item.id === assistantMessageId)
        if (target) {
          target.content += chunk
        }
      })
    } catch {
      const active = conversations.value.find((item) => item.id === conversationId)
      const target = active?.messages.find((item) => item.id === assistantMessageId)
      if (target && !target.content) {
        target.content = error.value ?? '生成失败，请稍后重试。'
      }
    } finally {
      const active = conversations.value.find((item) => item.id === conversationId)
      const target = active?.messages.find((item) => item.id === assistantMessageId)
      if (target) {
        target.streaming = false
      }
      if (active) {
        active.updatedAt = Date.now()
      }
    }
  }

  function useSuggestion(prompt: string) {
    inputText.value = prompt
    void sendMessage(prompt)
  }

  return {
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    hasMessages,
    inputText,
    selectedModel,
    isStreaming,
    error,
    canSend,
    historyGroups,
    suggestionCards,
    createConversation,
    selectConversation,
    newChat,
    sendMessage,
    stopStreaming,
    useSuggestion,
  }
}
