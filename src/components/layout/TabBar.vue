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
      console.log(`TabBar: 精确匹配路径 ${route.path} -> 索引 ${routeToIndex[route.path]}`);
      return routeToIndex[route.path];
    }

    // 如果没有精确匹配，检查路由名称
    const routeName = route.name;
    const routePath = route.path;

    console.log(`TabBar: 当前路由名称: ${routeName}, 路径: ${routePath}`);

    // 根据路由名称判断
    if (routeName === 'Index') {
      console.log('TabBar: 匹配到首页');
      return 0;
    }
    if (routeName === 'Computed') {
      console.log('TabBar: 匹配到统计页');
      return 1;
    }
    if (routeName === 'Addfoot') {
      console.log('TabBar: 匹配到添加页');
      return 2;
    }
    if (routeName === 'Remind') {
      console.log('TabBar: 匹配到提醒页');
      return 3;
    }
    if (routeName === 'Mine') {
      console.log('TabBar: 匹配到我的页');
      return 4;
    }

    // 根据路径前缀判断（处理动态路由）
    if (routePath.startsWith('/computed')) {
      console.log('TabBar: 路径前缀匹配到统计页');
      return 1;
    }
    if (routePath.startsWith('/addfoot')) {
      console.log('TabBar: 路径前缀匹配到添加页');
      return 2;
    }
    if (routePath.startsWith('/remind')) {
      console.log('TabBar: 路径前缀匹配到提醒页');
      return 3;
    }
    if (routePath.startsWith('/mine')) {
      console.log('TabBar: 路径前缀匹配到我的页');
      return 4;
    }

    // 默认返回首页
    console.log('TabBar: 没有匹配到任何路由，默认返回首页');
    return 0;
  },
  set(value) {
    // Vant的TabBar会通过to属性自动处理路由跳转
    console.log(`TabBar: 设置active值为 ${value}`);
  }
});

// 监听路由变化
watch(() => route.path, (newPath, oldPath) => {
  console.log(`TabBar: 路由从 ${oldPath} 变化到 ${newPath}`);
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