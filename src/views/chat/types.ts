export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  streaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export interface SuggestionCard {
  icon: string
  title: string
  prompt: string
}

export interface ChatStreamChunk {
  content?: string
  error?: string
}
