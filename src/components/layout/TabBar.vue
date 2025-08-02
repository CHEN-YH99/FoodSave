<script setup>
import { ref } from 'vue';

const active = ref(0);
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