<script setup lang="ts">
import { computed, type Component } from 'vue'

/** 自动注册 assets/svg 目录下所有图标，name 与文件名一致 */
const iconModules = import.meta.glob<Component>('../assets/svg/*.svg', {
  eager: true,
  import: 'default',
})

const props = withDefaults(
  defineProps<{
    name: string
    size?: number | string
  }>(),
  {
    size: 20,
  },
)

const iconComponent = computed(() => {
  const entry = Object.entries(iconModules).find(([path]) =>
    path.endsWith(`/${props.name}.svg`),
  )
  return entry?.[1] ?? null
})

const sizeValue = computed(() =>
  typeof props.size === 'number' ? `${props.size}px` : props.size,
)
</script>

<template>
  <component
    :is="iconComponent"
    v-if="iconComponent"
    class="app-icon"
    :style="{ width: sizeValue, height: sizeValue }"
    aria-hidden="true"
  />
</template>

<style scoped>
.app-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.app-icon :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
