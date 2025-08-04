<template>
  <div class="food-card-detail">
    <!-- 头部导航 -->
    <div class="header">
      <van-nav-bar :title="categoryInfo.name" left-arrow @click-left="goBack"
        :style="{ backgroundColor: categoryInfo.bgColor }">
        <template #left>
          <van-icon name="arrow-left" size="18" />
        </template>
      </van-nav-bar>
    </div>

    <!-- 分类信息卡片 -->
    <div class="category-info">
      <div class="category-header">
        <div class="icon-wrapper" :style="{ backgroundColor: categoryInfo.bgColor }">
          <van-icon :name="categoryInfo.icon" :color="categoryInfo.iconColor" size="40" />
        </div>
        <div class="category-details">
          <h2 class="category-name">{{ categoryInfo.name }}</h2>
          <p class="category-description">{{ getCategoryDescription(categoryInfo.name) }}</p>
        </div>
      </div>
    </div>

    <!-- 该分类下的食材列表 -->
    <div class="food-list">
      <div class="list-header">
        <h3>{{ categoryInfo.name }}类食材</h3>
        <span class="count">共 {{ filteredFoods.length }} 项</span>
      </div>

      <div class="food-items" v-if="filteredFoods.length > 0">
        <div v-for="food in filteredFoods" :key="food.id" class="food-item" @click="handleFoodClick(food)">
          <div class="food-info">
            <div class="food-name">{{ food.name }}</div>
            <div class="food-details">
              <span class="storage">{{ food.storageLocation }}</span>
              <span class="expire-date" :style="{ color: getExpiryColor(food) }">
                {{ getExpiryText(food) }}
              </span>
            </div>
          </div>
          <van-icon name="arrow" size="16" color="#c8c9cc" />
        </div>
      </div>

      <div v-else class="empty-state">
        <van-empty description="暂无该分类的食材" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIndexStore } from '@/store/index'

const route = useRoute()
const router = useRouter()
const store = useIndexStore()

// 分类信息
const categoryInfo = ref({
  id: route.params.categoryId,
  name: route.query.name || '未知分类',
  icon: route.query.icon || 'shop-o',
  bgColor: route.query.bgColor || '#f0f0f0',
  iconColor: route.query.iconColor || '#666'
})

// 获取该分类下的食材
const filteredFoods = computed(() => {
  const categoryName = categoryInfo.value.name
  return store.foodData.filter(food => {
    // 根据分类名称匹配食材
    const categoryMap = {
      '果蔬类': ['蔬菜', '水果'],
      '肉类': ['肉类'],
      '乳制品': ['乳制品'],
      '主食': ['谷物', '烘焙食品'],
      '罐头': ['冷冻食品'],
      '调料': ['调味品']
    }

    const matchCategories = categoryMap[categoryName] || [categoryName]
    return matchCategories.some(cat => food.category === cat)
  })
})

// 获取分类描述
const getCategoryDescription = (categoryName) => {
  const descriptions = {
    '果蔬类': '新鲜蔬菜和水果，富含维生素和纤维',
    '肉类': '各种肉类食品，提供优质蛋白质',
    '乳制品': '牛奶、奶酪等乳制品，补充钙质',
    '主食': '米面等主食，提供碳水化合物',
    '罐头': '罐装和冷冻食品，方便储存',
    '调料': '各种调味品，增加食物风味'
  }
  return descriptions[categoryName] || '食材分类详情'
}

// 获取过期状态文字
const getExpiryText = (food) => {
  const days = store.calculateExpiryDays(food.expireDate)
  if (days < 0) return `已过期${Math.abs(days)}天`
  if (days === 0) return '今天过期'
  if (days <= 3) return `${days}天后过期`
  return `${days}天后过期`
}

// 获取过期状态颜色
const getExpiryColor = (food) => {
  const days = store.calculateExpiryDays(food.expireDate)
  return store.getExpiryColor(days)
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 点击食材项
const handleFoodClick = (food) => {
  console.log('点击了食材:', food.name)
  // 这里可以跳转到食材详情页面
}

// 页面挂载时加载数据
onMounted(() => {
  // 如果store中没有数据，先加载数据
  if (store.foodData.length === 0) {
    store.loadFoodData()
  }
})
</script>

<style lang="scss" scoped>
.food-card-detail {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
}

.category-info {
  margin: 20px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .category-header {
    display: flex;
    align-items: center;
    gap: 16px;

    .icon-wrapper {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .category-details {
      flex: 1;

      .category-name {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: #2c3e50;
      }

      .category-description {
        margin: 0;
        font-size: 14px;
        color: #7f8c8d;
        line-height: 1.4;
      }
    }
  }
}

.food-list {
  margin: 0 20px 20px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
    }

    .count {
      font-size: 14px;
      color: #7f8c8d;
    }
  }

  .food-items {
    .food-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #f8f9fa;
      cursor: pointer;
      transition: background-color 0.2s;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: #f8f9fa;
      }

      &:active {
        background-color: #e9ecef;
      }

      .food-info {
        flex: 1;

        .food-name {
          font-size: 16px;
          font-weight: 500;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .food-details {
          display: flex;
          gap: 12px;
          font-size: 13px;

          .storage {
            color: #7f8c8d;
          }

          .expire-date {
            font-weight: 500;
          }
        }
      }
    }
  }

  .empty-state {
    padding: 40px 20px;
    text-align: center;
  }
}
</style>