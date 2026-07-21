<script setup lang="ts">
import AppIcon from '../../../components/AppIcon.vue'

withDefaults(
  defineProps<{
    role: 'user' | 'assistant'
    size?: number
  }>(),
  {
    size: 28,
  },
)
</script>

<template>
  <div
    class="chat-avatar"
    :class="`chat-avatar--${role}`"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <AppIcon v-if="role === 'user'" name="用户" :size="size * 0.55" />
    <svg
      v-else
      class="chat-avatar__sparkle"
      :width="size * 0.55"
      :height="size * 0.55"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        d="M12 2l1.2 4.2L17.4 7.4 13.2 8.6 12 12.8 10.8 8.6 6.6 7.4l4.2-1.2L12 2zm0 11.2l.9 3.1 3.1.9-3.1.9-.9 3.1-.9-3.1-3.1-.9 3.1-.9.9-3.1z"
      />
    </svg>
  </div>
</template>

<style lang="scss" scoped>
.chat-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  color: #fff;

  &--user {
    background: #5436da;
  }

  &--assistant {
    background: #10a37f;
  }
}

.chat-avatar__sparkle {
  display: block;
}
</style>
