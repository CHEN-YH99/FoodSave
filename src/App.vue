<script setup>
import { ref, onMounted } from 'vue';
import Head from './components/layout/Head.vue'
import TabBar from './components/layout/TabBar.vue'
// 控制海报显示的状态
const showPoster = ref(true);

// 跳过海报的方法
const skipPoster = () => {
  showPoster.value = false;
};

// 组件挂载后设置一个定时器，5秒后自动跳过
onMounted(() => {
  setTimeout(() => {
    skipPoster();
  }, 5000);
});
</script>

<template>
  <!-- 海报 -->
  <div v-if="showPoster" class="poster-wrapper">
    <img src="./assets/images/GG.jpeg" alt="Poster" class="poster-img">
    <button @click="skipPoster" class="skip-btn">跳过</button>
  </div>

  <!-- 主内容 -->
  <div v-else class="main-content">
    <Head />
    <div class="content-wrapper">
      <router-view />
    </div>
    <TabBar />
  </div>
</template>

<style scoped lang="scss">
.poster-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;

  .poster-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .skip-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    padding: 8px 16px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    border-radius: 16px;
    cursor: pointer;
  }
}

.main-content {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  .content-wrapper {
    flex: 1;
    padding-top: 70px; // 为固定头部留出空间
    padding-bottom: 60px; // 为底部TabBar留出空间
    overflow-y: auto;
  }
}
</style>
