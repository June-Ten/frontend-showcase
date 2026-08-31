<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import borderImg from '../../../assets/img/chinaScreen/border.png'
import replyIcon from '../../../assets/img/chinaScreen/discussions_reply_total_num.png'
import totalIcon from '../../../assets/img/chinaScreen/discussions_total_num.png'
import titleBg from '../../../assets/img/chinaScreen/title_bg.png'
import type { FileGuide, OpenDiscuss } from '../type'

const props = defineProps<{
  openDiscuss: OpenDiscuss
  fileGuide: FileGuide
}>()

const titleBgUrl = `url(${titleBg})`
const totalFileCount = ref(0)
const totalReplyCount = ref(0)
const requestCount = ref(0)
const replyCount = ref(0)
const tableData = reactive([
  { type: '市场准入和退出', fileCount: 0 },
  { type: '产业发展', fileCount: 0 },
  { type: '招商引资', fileCount: 0 },
  { type: '招标投标', fileCount: 0 },
  { type: '政府采购', fileCount: 0 },
  { type: '资质标准', fileCount: 0 },
  { type: '监管执法', fileCount: 0 },
  { type: '其他', fileCount: 0 },
])

watch(
  () => props.openDiscuss,
  (value) => {
    const counts = value.attentionFileCount || {}
    tableData.forEach((item) => {
      item.fileCount = counts[item.type] ?? 0
    })
    tableData.sort((a, b) => b.fileCount - a.fileCount)
    totalFileCount.value = value.openDiscussCount ?? 0
    totalReplyCount.value = value.replyCount ?? 0
  },
  { deep: true, immediate: true },
)

watch(
  () => props.fileGuide,
  (value) => {
    requestCount.value = value.requestCount ?? 0
    replyCount.value = value.replyCount ?? 0
  },
  { deep: true, immediate: true },
)
</script>

<template>
  <div class="right-box">
    <div class="right-box-item right-top">
      <div class="border-img-box">
        <img class="border-img" :src="borderImg" alt="" />
      </div>
      <div class="right-item-title-box">
        <div class="right-item-title">开放讨论文件相关</div>
      </div>
      <div class="right-top-content-box">
        <div class="right-top-table-box">
          <div class="data-table">
            <div class="table-header">
              <div class="table-row">
                <div class="table-cell">关注类型</div>
                <div class="table-cell">文件数</div>
              </div>
            </div>
            <div class="table-body">
              <div v-for="item in tableData" :key="item.type" class="table-row">
                <div class="table-cell">{{ item.type }}</div>
                <div class="table-cell">{{ item.fileCount }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="total-box">
          <div class="total-item file-total-box">
            <div class="left-img-box">
              <img class="left-img" :src="totalIcon" alt="" />
            </div>
            <div class="right-text-box">
              <div class="right-text">开放讨论文件总数</div>
              <div class="right-text-value">{{ totalFileCount }}</div>
            </div>
          </div>
          <div class="total-item">
            <div class="left-img-box">
              <img class="left-img" :src="replyIcon" alt="" />
            </div>
            <div class="right-text-box">
              <div class="right-text">开放讨论回复数量</div>
              <div class="right-text-value">{{ totalReplyCount }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="right-box-item right-bottom">
      <div class="border-img-box">
        <img class="border-img" :src="borderImg" alt="" />
      </div>
      <div class="right-item-title-box">
        <div class="right-item-title">报请上级指导文件相关</div>
      </div>
      <div class="right-bottom-total-box">
        <div class="total-item file-total-box">
          <div class="left-img-box">
            <img class="left-img" :src="totalIcon" alt="" />
          </div>
          <div class="right-text-box">
            <div class="right-text">报请上级指导文件总数</div>
            <div class="right-text-value">{{ requestCount }}</div>
          </div>
        </div>
        <div class="total-item">
          <div class="left-img-box">
            <img class="left-img" :src="replyIcon" alt="" />
          </div>
          <div class="right-text-box">
            <div class="right-text">上级指导回复数量</div>
            <div class="right-text-value">{{ replyCount }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.right-box {
  display: flex;
  flex-direction: column;
  width: 22%;
  height: 100%;
}

.right-box-item {
  position: relative;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid #b8edf6;
}

.right-item-title-box {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: calc(100% - 32px);
  height: 24px;
  margin: 20px 16px 0;
  font-family: YouSheBiaoTiHei, 'Microsoft YaHei', sans-serif;
  background: v-bind(titleBgUrl);
  background-size: 100% 100%;
}

.right-item-title {
  position: absolute;
  bottom: 5px;
  left: 33px;
  color: #fff;
  font-size: 16px;
}

.border-img-box {
  position: absolute;
  top: -7px;
  left: -1px;
  display: flex;
  width: 153px;
  height: 7px;
}

.border-img {
  width: 100%;
  height: 100%;
}

.right-top {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 72%;
}

.right-top-content-box {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.right-top-table-box {
  flex-shrink: 0;
  margin: 8px 16px 16px;
}

.data-table {
  width: 100%;
}

.table-header .table-row,
.table-body .table-row {
  display: flex;
  align-items: center;
  height: 30px;
  background: linear-gradient(90deg, rgba(3, 34, 144, 0) 0%, #032290 10%, #1a4ea8 100%);
}

.table-body .table-row {
  height: 36px;
  margin-top: 2px;

  &:hover {
    background: linear-gradient(90deg, rgba(1, 12, 104, 0) 0%, #009dff 50%, rgba(1, 12, 104, 0) 100%);
  }
}

.table-cell {
  flex: 1;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
}

.table-body .table-cell {
  font-size: 14px;
}

.total-box {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.total-item {
  display: flex;
  align-items: center;
  justify-content: center;

  &:first-child {
    margin-bottom: 16px;
  }
}

.left-img-box {
  height: 7vh;

  img {
    height: 100%;
  }
}

.right-text-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 16px;
}

.right-text {
  color: #fff;
  font-size: 14px;
  font-weight: bold;
}

.right-text-value {
  margin-top: 8px;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
}

.right-bottom {
  width: 100%;
  height: calc(28% - 16px);
  margin-top: 16px;
}

.right-bottom-total-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: calc(100% - 60px);
  margin-top: 14px;

  .total-item {
    width: 240px;
    margin-bottom: 14px;
    justify-content: flex-start;
  }

  .left-img-box {
    height: 5.5vh;
  }

  .right-text-box {
    margin-left: 14px;
  }
}
</style>
