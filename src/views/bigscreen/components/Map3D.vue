<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createNationMap3d, type NationMap3dController } from '../createNationMap3d'
import type { ScreenData } from '../type'

const emit = defineEmits<{
  changeProvince: [name: string]
}>()

const containerRef = ref<HTMLElement | null>(null)
let mapController: NationMap3dController | null = null
let pendingData: ScreenData | null = null
let resizeObserver: ResizeObserver | null = null
let cancelled = false

const initData = (data: ScreenData) => {
  if (cancelled) return
  if (mapController) {
    mapController.initData(data)
    return
  }
  pendingData = data
}

onMounted(async () => {
  const container = containerRef.value
  if (!container) return
  let controller: NationMap3dController
  try {
    controller = await createNationMap3d(container, (name) => {
      if (!cancelled) emit('changeProvince', name)
    })
  } catch (error) {
    if (cancelled) return
    throw error
  }
  if (cancelled) {
    controller.dispose()
    return
  }
  mapController = controller
  if (pendingData) {
    mapController.initData(pendingData)
    pendingData = null
  }
  resizeObserver = new ResizeObserver(() => mapController?.resize())
  resizeObserver.observe(container)
  mapController.resize()
})

onBeforeUnmount(() => {
  cancelled = true
  pendingData = null
  resizeObserver?.disconnect()
  resizeObserver = null
  mapController?.dispose()
  mapController = null
})

defineExpose({ initData })
</script>

<template>
  <div ref="containerRef" class="map3d" />
</template>

<style scoped>
.map3d {
  width: 100%;
  height: 100%;
}
</style>
