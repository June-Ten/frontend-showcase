<template>
  <div class="home">
    <h1>Home Page</h1>
    <p>Welcome to the home page of our Vue.js application!</p>
    <div class="store-demo">
      <p>Count: {{ count }}</p>
      <p>Double Count: {{ doubleCount }}</p>
      <button type="button" @click="appStore.increment()">Increment</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../store'

const appStore = useAppStore()
const { count, doubleCount } = storeToRefs(appStore)
</script>

<style lang="scss" scoped>
.home {
  padding: 20px;
  text-align: center;

  h1 {
    color: #42b983;
  }

  p {
    font-size: 18px;
    color: #333;
  }

  .store-demo {
    margin-top: 24px;

    button {
      padding: 8px 16px;
      font-size: 16px;
      cursor: pointer;
    }
  }
}
</style>