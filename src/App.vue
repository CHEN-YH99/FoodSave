<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useIndexStore } from '@/store/index';
import Head from './components/layout/Head.vue'
import TabBar from './components/layout/TabBar.vue'

const route = useRoute();
const store = useIndexStore();

// 控制海报显示的状态
const showPoster = ref(true);

// 根据路由meta配置判断是否显示Header和TabBar
const shouldShowHeader = computed(() => {
  return !route.meta?.hideHeader;
});

const shouldShowTabBar = computed(() => {
  return !route.meta?.hideTabBar;
});

// 跳过海报的方法
const skipPoster = () => {
  showPoster.value = false;
};

// 组件挂载后设置一个定时器，5秒后自动跳过
onMounted(() => {
  // 初始化已取出记录
  store.loadTakenOutFoods();
  
  // 设置定期清理过期记录（每小时清理一次）
  const cleanupInterval = setInterval(() => {
    store.cleanExpiredTakenOutFoods();
  }, 60 * 60 * 1000); // 1小时
  
  // 页面卸载时清理定时器
  window.addEventListener('beforeunload', () => {
    clearInterval(cleanupInterval);
  });
  
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
    <Head v-if="shouldShowHeader" />
    <div class="content-wrapper" :class="{ 'no-header': !shouldShowHeader, 'no-tabbar': !shouldShowTabBar }">
      <router-view />
    </div>
    <TabBar v-if="shouldShowTabBar" />
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

    // 当没有头部时，移除顶部padding
    &.no-header {
      padding-top: 0;
    }

    // 当没有TabBar时，移除底部padding
    &.no-tabbar {
      padding-bottom: 0;
    }
  }
}
</style>
