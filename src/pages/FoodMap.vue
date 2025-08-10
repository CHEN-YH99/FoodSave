<template>
  <div class="food-map-page">
    <!-- 导航栏 -->
    <van-nav-bar title="存放位置" fixed placeholder />
    
    <div class="map-container">
      <div class="map-content">
        <h3>食材存放位置管理</h3>
        <p>这里将显示食材的存放位置信息</p>
      </div>
      <!-- 定义一个用于绘制地图的区域 -->
      <div id="three"></div>
    </div>
  </div>
</template>

<script setup >
  import * as THREE from 'three'; // 导入three.js库

  // 创建一个场景
  const scene = new THREE.Scene();
  console.log(scene);
  
</script>

<style scoped lang="scss">
.food-map-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.map-container {
  padding: 16px;
}

.map-content {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  
  h3 {
    color: #323233;
    margin-bottom: 12px;
  }
  
  p {
    color: #646566;
    font-size: 14px;
  }
}
</style>