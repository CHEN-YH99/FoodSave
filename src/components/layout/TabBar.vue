<script setup>
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// 路由路径与TabBar索引的映射
const routeToIndex = {
  '/': 0,
  '/computed': 1,
  '/addfoot': 2,
  '/remind': 3,
  '/mine': 4
};

// 根据当前路由计算active值
const active = computed({
  get() {
    // 首先检查精确匹配
    if (routeToIndex.hasOwnProperty(route.path)) {
      return routeToIndex[route.path];
    }

    // 如果没有精确匹配，检查路由名称
    const routeName = route.name;
    const routePath = route.path;

    // 根据路由名称判断
    if (routeName === 'Index') {
      return 0;
    }
    if (routeName === 'Computed') {
      return 1;
    }
    if (routeName === 'Addfoot') {
      return 2;
    }
    if (routeName === 'Remind') {
      return 3;
    }
    if (routeName === 'Mine') {
      return 4;
    }

    // 根据路径前缀判断（处理动态路由）
    if (routePath.startsWith('/computed')) {
      return 1;
    }
    if (routePath.startsWith('/addfoot')) {
      return 2;
    }
    if (routePath.startsWith('/remind')) {
      return 3;
    }
    if (routePath.startsWith('/mine')) {
      return 4;
    }

    // 默认返回首页
    return 0;
  },
  set(value) {
    // Vant的TabBar会通过to属性自动处理路由跳转
  }
});

// 监听路由变化
watch(() => route.path, (newPath, oldPath) => {
  // 路由变化处理
}, { immediate: true });
</script>

<template>
  <van-tabbar v-model="active" active-color="rgb(0, 150, 5)">
    <van-tabbar-item icon="home-o" to="/">首页</van-tabbar-item>
    <van-tabbar-item icon="chart-trending-o" to="/computed">统计</van-tabbar-item>
    <van-tabbar-item icon="add" to="/addfoot">添加</van-tabbar-item>
    <van-tabbar-item icon="bell" to="/remind">提醒</van-tabbar-item>
    <van-tabbar-item icon="user-o" to="/mine">我的</van-tabbar-item>
  </van-tabbar>
</template>

<style scoped lang="scss">
.van-tabbar {
  height: 60px;
}
</style>