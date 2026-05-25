<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { initFlexible } from './utils/flexible'

let cleanupFlexible: (() => void) | undefined

onMounted(() => {
  cleanupFlexible = initFlexible()
})

onBeforeUnmount(() => {
  cleanupFlexible?.()
})
</script>

<template>
  <!-- <HelloWorld /> -->
  <router-view />
</template>
