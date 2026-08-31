<script setup lang="ts">
import headerBg from '../../../assets/img/chinaScreen/header_bg.png'
import headerTitle from '../../../assets/img/chinaScreen/header_title.png'

const headerBgUrl = `url(${headerBg})`
</script>

<template>
  <div class="header-box">
    <div class="header-logo-box">
      <div class="header-title-img-box">
        <img :src="headerTitle" alt="全国公平竞争审查统一平台数据中心" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.header-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 95px;
}

.header-logo-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: calc(100% - 1.25rem);
  background: v-bind(headerBgUrl) no-repeat;
  background-size: 100% 100%;
}

.header-title-img-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;

  img {
    width: 600px;
  }
}
</style>
