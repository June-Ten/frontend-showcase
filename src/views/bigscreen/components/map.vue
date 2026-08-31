<script setup lang="ts">
import { reactive, ref } from 'vue'
import mapBg from '../../../assets/img/chinaScreen/centerBg.png'
import areaDataIcon from '../../../assets/map/img/areadata.png'
import chinaDataIcon from '../../../assets/map/img/chinadata.png'
import type { ScreenData } from '../type'
import Map3D from './Map3D.vue'

const mapRef = ref<{ initData: (data: ScreenData) => void } | null>(null)
const nowProvince = ref('')
const fulldata = reactive({
  usernum: 0,
  uploadnum: 0,
  todocument: 0,
  toopentalk: 0,
})
const nowCityData = reactive({
  usernum: 0,
  uploadnum: 0,
  todocument: 0,
  toopentalk: 0,
})
let geoinfo: ScreenData | null = null

const changeProvince = (name: string) => {
  const item = geoinfo?.aiFileCountList.find((entry) => entry.provinceName === name)
  nowCityData.usernum = item?.userCount ?? 0
  nowCityData.uploadnum = item?.aiReview ?? 0
  nowCityData.todocument = item?.toLib ?? 0
  nowCityData.toopentalk = item?.violateCount ?? 0
  nowProvince.value = name
}

const initMapData = (data: ScreenData) => {
  geoinfo = data
  fulldata.usernum = data.mapData.userCount ?? 0
  fulldata.uploadnum = data.mapData.uploadFileCount ?? 0
  fulldata.todocument = data.mapData.toFileCount ?? 0
  fulldata.toopentalk = data.mapData.violateCount ?? 0
  mapRef.value?.initData(data)
  changeProvince('江苏省')
}

defineExpose({ initMapData })
</script>

<template>
  <div class="map-container">
    <img class="map-base" :src="mapBg" alt="" />
    <Map3D ref="mapRef" class="geo-screen" @change-province="changeProvince" />
    <div class="geo-info">
      <div class="geo-info-left">
        <div class="area-icon">
          <img class="area-png" :src="chinaDataIcon" alt="" />
          <div class="area-title">全国</div>
        </div>
        <div class="area-box">
          <div class="area-info">
            <div class="area-info-title">用户数</div>
            <div class="area-info-content">{{ fulldata.usernum }}</div>
          </div>
          <div class="area-info">
            <div class="area-info-title">转文件库数</div>
            <div class="area-info-content">{{ fulldata.todocument }}</div>
          </div>
        </div>
        <div class="area-box">
          <div class="area-info">
            <div class="area-info-title">上传文件数</div>
            <div class="area-info-content">{{ fulldata.uploadnum }}</div>
          </div>
          <div class="area-info">
            <div class="area-info-title">提示风险点</div>
            <div class="area-info-content">{{ fulldata.toopentalk }}</div>
          </div>
        </div>
      </div>
      <div class="geo-info-right">
        <div class="area-icon">
          <img class="area-png" :src="areaDataIcon" alt="" />
          <div class="area-title">当前-{{ nowProvince }}</div>
        </div>
        <div class="area-box">
          <div class="area-info">
            <div class="area-info-title">用户数</div>
            <div class="area-info-content">{{ nowCityData.usernum }}</div>
          </div>
          <div class="area-info">
            <div class="area-info-title">转文件库数</div>
            <div class="area-info-content">{{ nowCityData.todocument }}</div>
          </div>
        </div>
        <div class="area-box">
          <div class="area-info">
            <div class="area-info-title">上传文件数</div>
            <div class="area-info-content">{{ nowCityData.uploadnum }}</div>
          </div>
          <div class="area-info">
            <div class="area-info-title">提示风险点</div>
            <div class="area-info-content">{{ nowCityData.toopentalk }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-base {
  position: absolute;
  left: 50%;
  bottom: -6%;
  z-index: 0;
  width: 140%;
  max-height: 78%;
  transform: translateX(-50%);
  pointer-events: none;
  object-fit: contain;
  mix-blend-mode: screen;
}

.geo-screen {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

.geo-info {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: flex;
  width: 100%;
  height: 200px;
  padding-top: 16px;
  pointer-events: none;
}

.geo-info-left,
.geo-info-right {
  display: flex;
  flex: 1;
}

.geo-info-left {
  text-align: right;

  .area-icon {
    margin-right: 32px;
    margin-left: auto;
  }

  .area-title {
    color: #a9f5ff;
  }

  .area-info-content {
    color: #a9f5ff;
  }
}

.geo-info-right {
  text-align: left;

  .area-icon {
    width: 240px;
    margin-right: 32px;
    text-align: center;
  }

  .area-title {
    color: #f2b933;
  }

  .area-info-content {
    color: #f2b933;
  }
}

.area-png {
  width: 72px;
  height: 72px;
}

.area-title {
  width: 72px;
  margin-top: 8px;
  font-size: 20px;
  font-weight: bold;
  line-height: 30px;
  text-align: center;
}

.geo-info-right .area-title {
  width: auto;
}

.area-box {
  margin-right: 16px;
}

.area-info {
  width: 100px;
}

.area-info-title {
  color: #fff;
  font-family: 'Alimama ShuHeiTi', 'Microsoft YaHei', sans-serif;
  font-size: 12px;
  font-weight: bold;
  line-height: 18px;
  text-align: left;
}

.area-info-content {
  font-size: 20px;
  font-weight: bold;
  line-height: 30px;
  text-align: left;
}
</style>
