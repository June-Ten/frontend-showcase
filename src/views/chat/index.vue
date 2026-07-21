<template>
  <div class="chat-app">
    <aside class="sidebar" :class="{ 'sidebar--collapsed': sidebarCollapsed }">
      <div class="sidebar__top">
        <div class="sidebar__brand">
          <ChatAvatar role="assistant" :size="24" />
          <button
            type="button"
            class="sidebar__collapse-btn"
            aria-label="收起侧边栏"
            @click="sidebarCollapsed = true"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        <button type="button" class="sidebar__action" @click="newChat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          新对话
        </button>

        <button type="button" class="sidebar__action sidebar__action--muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          搜索对话
        </button>

        <button type="button" class="sidebar__action sidebar__action--muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2" />
          </svg>
          探索 GPTs
        </button>
      </div>

      <div class="sidebar__history">
        <div v-for="group in historyGroups" :key="group.label" class="sidebar__group">
          <p class="sidebar__group-label">{{ group.label }}</p>
          <button
            v-for="item in group.items"
            :key="item.id"
            type="button"
            class="sidebar__history-item"
            :class="{ 'sidebar__history-item--active': item.id === activeConversationId }"
            @click="selectConversation(item.id)"
          >
            <span class="sidebar__history-title">{{ item.title }}</span>
            <span class="sidebar__history-more" aria-hidden="true">···</span>
          </button>
        </div>
      </div>

      <div class="sidebar__bottom">
        <button type="button" class="sidebar__upgrade">
          <span class="sidebar__upgrade-icon">✦</span>
          升级到 Plus
        </button>
        <div class="sidebar__user">
          <ChatAvatar role="user" :size="28" />
          <span class="sidebar__username">User</span>
          <button type="button" class="sidebar__settings" aria-label="设置">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
              <path
                d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <main class="main">
      <header class="main__header">
        <button
          v-if="sidebarCollapsed"
          type="button"
          class="main__menu-btn"
          aria-label="展开侧边栏"
          @click="sidebarCollapsed = false"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>

        <button type="button" class="main__model">
          {{ selectedModel }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>

        <div class="main__header-actions">
          <button type="button" class="main__icon-btn" aria-label="分享">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <ChatAvatar role="user" :size="28" />
        </div>
      </header>

      <div ref="messagesRef" class="main__body">
        <div v-if="!hasMessages" class="welcome">
          <ChatAvatar role="assistant" :size="52" class="welcome__logo" />
          <h1 class="welcome__title">有什么可以帮到你？</h1>
          <div class="welcome__cards">
            <button
              v-for="card in suggestionCards"
              :key="card.title"
              type="button"
              class="welcome__card"
              @click="useSuggestion(card.prompt)"
            >
              <span class="welcome__card-icon">{{ card.icon }}</span>
              <span class="welcome__card-text">{{ card.title }}</span>
            </button>
          </div>
        </div>

        <div v-else class="messages">
          <article
            v-for="message in messages"
            :key="message.id"
            class="message"
            :class="`message--${message.role}`"
          >
            <ChatAvatar :role="message.role" :size="28" />
            <div class="message__content">
              <ChatMarkdown
                v-if="message.role === 'assistant'"
                :content="message.content"
                :streaming="message.streaming"
              />
              <p v-else class="message__text">{{ message.content }}</p>
            </div>
          </article>
        </div>
      </div>

      <footer class="main__footer">
        <form class="composer" @submit.prevent="sendMessage()">
          <div class="composer__box">
            <button type="button" class="composer__tool" aria-label="添加附件">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>

            <textarea
              v-model="inputText"
              class="composer__input"
              rows="1"
              placeholder='给 "ChatGPT" 发送消息'
              @keydown.enter.exact.prevent="sendMessage()"
            />

            <div class="composer__actions">
              <button type="button" class="composer__chip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" stroke-width="2" />
                </svg>
                搜索
              </button>
              <button type="button" class="composer__chip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                推理
              </button>

              <button type="button" class="composer__tool" aria-label="语音输入">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" stroke-width="2" />
                  <path
                    d="M5 10a7 7 0 0014 0M12 17v4M8 21h8"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </button>

              <button
                type="submit"
                class="composer__send"
                :class="{ 'composer__send--active': canSend }"
                :disabled="!canSend"
                aria-label="发送"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 19V5M5 12l7-7 7 7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </form>
        <p class="main__hint">ChatGPT 可能会犯错，请核查重要信息。</p>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import ChatAvatar from './components/ChatAvatar.vue'
import ChatMarkdown from './components/ChatMarkdown.vue'
import { useChat } from './composables/useChat'

const sidebarCollapsed = ref(false)
const messagesRef = ref<HTMLElement | null>(null)

const {
  activeConversationId,
  hasMessages,
  inputText,
  selectedModel,
  canSend,
  historyGroups,
  messages,
  suggestionCards,
  newChat,
  selectConversation,
  sendMessage,
  useSuggestion,
} = useChat()

watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    const el = messagesRef.value
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  },
)

watch(
  () => messages.value.at(-1)?.content,
  async () => {
    if (!hasMessages.value) return
    await nextTick()
    const el = messagesRef.value
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  },
)
</script>

<style lang="scss" scoped>
$sidebar-width: 260px;
$bg-sidebar: #f9f9f9;
$bg-main: #ffffff;
$text: #0d0d0d;
$text-muted: #6b6b6b;
$border: #e5e5e5;
$accent: #10a37f;

.chat-app {
  display: flex;
  height: 100vh;
  background: $bg-main;
  color: $text;
  font-family: system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.sidebar {
  display: flex;
  flex-direction: column;
  width: $sidebar-width;
  background: $bg-sidebar;
  border-right: 1px solid $border;
  transition: width 0.2s ease, opacity 0.2s ease;

  &--collapsed {
    width: 0;
    opacity: 0;
    overflow: hidden;
    border-right: none;
  }
}

.sidebar__top {
  padding: 12px 10px 8px;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
}


.sidebar__collapse-btn,
.main__menu-btn,
.main__icon-btn,
.sidebar__settings,
.composer__tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: $text-muted;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: $text;
  }
}

.sidebar__collapse-btn,
.main__menu-btn {
  width: 32px;
  height: 32px;
}

.sidebar__action {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: $text;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
  }

  &--muted {
    color: $text-muted;
  }
}

.sidebar__history {
  flex: 1;
  overflow: auto;
  padding: 8px 10px;
}

.sidebar__group {
  margin-bottom: 16px;
}

.sidebar__group-label {
  margin: 0 0 6px;
  padding: 0 12px;
  font-size: 12px;
  color: $text-muted;
}

.sidebar__history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: $text;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;

  &:hover,
  &--active {
    background: rgba(0, 0, 0, 0.06);
  }

  &:hover .sidebar__history-more {
    opacity: 1;
  }
}

.sidebar__history-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar__history-more {
  opacity: 0;
  color: $text-muted;
  font-size: 12px;
  letter-spacing: 1px;
}

.sidebar__bottom {
  padding: 10px;
  border-top: 1px solid $border;
}

.sidebar__upgrade {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 8px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: $text;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
  }
}

.sidebar__upgrade-icon {
  color: $accent;
}

.sidebar__user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
}


.sidebar__username {
  flex: 1;
  font-size: 14px;
}

.sidebar__settings {
  width: 28px;
  height: 28px;
}

.main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.main__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid transparent;
}

.main__model {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: $text;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.main__header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.main__icon-btn {
  width: 36px;
  height: 36px;
}

.main__body {
  flex: 1;
  overflow: auto;
  padding: 24px 20px 12px;
}

.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  max-width: 760px;
  margin: 0 auto;
  text-align: center;
}

.welcome__logo {
  margin-bottom: 20px;
}

.welcome__title {
  margin: 0 0 28px;
  font-size: 28px;
  font-weight: 500;
}

.welcome__cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}

.welcome__card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 16px;
  border: 1px solid $border;
  border-radius: 16px;
  background: $bg-main;
  color: $text;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: #f7f7f7;
    border-color: #d9d9d9;
  }
}

.welcome__card-icon {
  font-size: 18px;
}

.welcome__card-text {
  font-size: 14px;
  line-height: 1.5;
}

.messages {
  max-width: 768px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.message {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.message__content {
  flex: 1;
  min-width: 0;
  padding-top: 2px;
}

.message__text {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.main__footer {
  padding: 0 20px 18px;
}

.composer__box {
  max-width: 768px;
  margin: 0 auto;
  padding: 12px 14px;
  border: 1px solid $border;
  border-radius: 24px;
  background: $bg-main;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.composer {
  display: block;
}

.composer__input {
  width: 100%;
  min-height: 24px;
  max-height: 200px;
  margin: 8px 0 10px;
  padding: 0 4px;
  border: none;
  resize: none;
  outline: none;
  background: transparent;
  color: $text;
  font: inherit;
  font-size: 15px;
  line-height: 1.5;
}

.composer__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.composer__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid $border;
  border-radius: 999px;
  background: transparent;
  color: $text-muted;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
}

.composer__tool {
  width: 32px;
  height: 32px;
}

.composer__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-left: auto;
  border: none;
  border-radius: 50%;
  background: #d7d7d7;
  color: #fff;
  cursor: not-allowed;
  transition: background 0.15s;

  &--active {
    background: $text;
    cursor: pointer;

    &:hover {
      background: #2a2a2a;
    }
  }
}

.main__hint {
  max-width: 768px;
  margin: 10px auto 0;
  font-size: 12px;
  color: $text-muted;
  text-align: center;
}

@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    z-index: 20;
    top: 0;
    left: 0;
    height: 100vh;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);

    &--collapsed {
      width: 0;
    }
  }

  .welcome__cards {
    grid-template-columns: 1fr;
  }
}
</style>
