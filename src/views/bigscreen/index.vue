<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import screenBg from '../../assets/img/chinaScreen/screen_bg.png'
import Center from './components/center.vue'
import Header from './components/header.vue'
import Left from './components/left.vue'
import Right from './components/right.vue'
import { mockScreenData } from './mock/screenData'
import type { ScreenData } from './type'

const screenBgUrl = `url(${screenBg})`
const leftRef = ref<{ refreshTable: () => void } | null>(null)
const centerRef = ref<{ initMapData: (data: ScreenData) => void } | null>(null)
const isFullscreen = ref(false)
const screenData = reactive<ScreenData>({
  aiFileCountList: [],
  aiViolationListAll: [],
  aiViolationList: [],
  openDiscuss: { attentionFileCount: {}, openDiscussCount: 0, replyCount: 0 },
  fileGuide: { requestCount: 0, replyCount: 0 },
  mapData: { userCount: 0, uploadFileCount: 0, toFileCount: 0, violateCount: 0 },
})

const applyScreenData = (data: ScreenData) => {
  screenData.aiFileCountList = data.aiFileCountList
  screenData.aiViolationListAll = data.aiViolationListAll
  screenData.aiViolationList = data.aiViolationList
  screenData.openDiscuss = data.openDiscuss
  screenData.fileGuide = data.fileGuide
  screenData.mapData = data.mapData
  centerRef.value?.initMapData(data)
}

const toggleFullscreen = async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch {
    // ignore unsupported browsers
  }
}

const onFullscreenChange = () => {
  isFullscreen.value = Boolean(document.fullscreenElement)
  leftRef.value?.refreshTable()
}

onMounted(() => {
  document.documentElement.classList.add('bigscreen-page')
  document.addEventListener('fullscreenchange', onFullscreenChange)
  applyScreenData(mockScreenData)
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('bigscreen-page')
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<template>
  <div class="inner-panel">
    <button type="button" class="icon" aria-label="全屏" @click="toggleFullscreen">
      <svg v-if="!isFullscreen" viewBox="0 0 24 24" fill="none">
        <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5" />
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none">
        <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M21 15h-6v6" />
      </svg>
    </button>
    <Header />
    <div class="main-box">
      <Left ref="leftRef" :ai-file-count-list="screenData.aiFileCountList" />
      <Center
        ref="centerRef"
        :ai-violation-list-all="screenData.aiViolationListAll"
        :ai-violation-list="screenData.aiViolationList"
      />
      <Right :open-discuss="screenData.openDiscuss" :file-guide="screenData.fileGuide" />
    </div>
  </div>
</template>

<style lang="scss" scoped>

.inner-panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  min-width: 1366px;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  color: #fff;
  text-align: center;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  background-image: v-bind(screenBgUrl);
  background-position: center;
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

.icon {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 99;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  color: #dcdfe6;
  cursor: pointer;

  svg {
    width: 28px;
    height: 28px;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}

.main-box {
  display: flex;
  gap: 16px;
  width: 100%;
  height: calc(100% - 95px);
  padding: 16px;
}
</style>

<style lang="scss">
@font-face {
  font-family: YouSheBiaoTiHei;
  src: url('../../assets/fonts/YouSheBiaoTiHei-2.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

html.bigscreen-page {
  overflow-x: auto;
  overflow-y: hidden;
}

html.bigscreen-page body,
html.bigscreen-page #app {
  min-width: 1366px;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0;
  text-align: initial;
}
</style>
