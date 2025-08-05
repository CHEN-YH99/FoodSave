<template>
  <div class="food-card-detail">
    <!-- 分类页面模式 -->
    <div v-if="isCategoryMode">
      <!-- 自定义头部导航 -->
      <div class="header">
        <div class="header-content">
          <div class="back-button" @click="goBack">
            <van-icon name="arrow-left" size="20" color="#333" />
          </div>
          <div class="header-title">{{ categoryInfo.name }}</div>
          <div class="header-actions">
            <van-icon name="search" size="18" color="#666" @click="handleSearch" />
          </div>
        </div>
      </div>

      <!-- 分类信息 -->
      <div class="category-info">
        <div class="category-header">
          <div class="icon-wrapper" :style="{ backgroundColor: categoryInfo.bgColor }">
            <van-icon :name="categoryInfo.icon" :color="categoryInfo.iconColor" size="30" />
          </div>
          <div class="category-details">
            <h2 class="category-name">{{ categoryInfo.name }}</h2>
            <p class="category-description">{{ getCategoryDescription(categoryInfo.name) }}</p>
          </div>
        </div>
      </div>

      <!-- 已取出列表入口 -->
      <div class="taken-out-section" v-if="store.takenOutFoods.length > 0">
        <div class="taken-out-header" @click="showTakenOutList">
          <div class="header-left">
            <van-icon name="completed" color="#52c41a" size="20" />
            <span class="taken-out-title">最近取出</span>
          </div>
          <div class="header-right">
            <span class="taken-out-count">{{ store.takenOutFoods.length }}项</span>
            <van-icon name="arrow" color="#c8c9cc" size="16" />
          </div>
        </div>
      </div>

      <!-- 食品列表 -->
      <div class="food-list">
        <div class="list-header">
          <h3>食品列表</h3>
          <span class="count">共{{ filteredFoods.length }}项</span>
        </div>

        <div class="food-items" v-if="filteredFoods.length > 0">
          <van-swipe-cell v-for="food in filteredFoods" :key="food.id" class="swipe-cell">
            <div class="food-item" @click="handleFoodClick(food)">
              <van-image :src="food.image" width="50" height="50" fit="cover" round class="food-image" />
              <div class="food-info">
                <div class="food-name">{{ food.name }}</div>
                <div class="food-details">
                  <span class="storage">{{ food.storageLocation || '冰箱' }}</span>
                  <span class="expire-date" :style="{ color: store.getExpiryColor(food.expiryDays) }">
                    {{ food.expiryDays <= 0 ? '已过期' : `${food.expiryDays}天后过期` }} </span>
                </div>
              </div>
              <van-icon name="arrow" size="16" color="#c8c9cc" />
            </div>

            <template #right>
              <van-button square type="success" :text="takingOutIds.has(food._id || food.id) ? '取出中...' : '取出'"
                :loading="takingOutIds.has(food._id || food.id)" class="take-out-btn" @click="handleTakeOut(food)"
                :disabled="takingOutIds.has(food._id || food.id)" />
            </template>
          </van-swipe-cell>
        </div>

        <div class="empty-state" v-else>
          <van-empty description="该分类下暂无食品" />
        </div>
      </div>

      <!-- 已取出列表弹窗 -->
      <van-popup v-model:show="showTakenOut" position="bottom" :style="{ height: '70%' }" round>
        <div class="taken-out-popup">
          <div class="popup-header">
            <h3>最近取出 (7天内)</h3>
            <div class="header-actions">
              <van-dropdown-menu>
                <van-dropdown-item v-model="sortOrder" :options="sortOptions" @change="handleSortChange">
                  <template #title>
                    <van-icon name="sort" size="16" />
                  </template>
                </van-dropdown-item>
              </van-dropdown-menu>
              <van-button size="small" type="danger" plain @click="handleClearAllTakenOut"
                v-if="store.takenOutFoods.length > 0">
                清空
              </van-button>
              <van-icon name="cross" @click="showTakenOut = false" />
            </div>
          </div>

          <div class="taken-out-list" v-if="sortedTakenOutFoods.length > 0">
            <div v-for="item in sortedTakenOutFoods" :key="`taken_${item.id}_${item.takenOutDate}`"
              class="taken-out-item">
              <van-image :src="item.image" width="40" height="40" fit="cover" round class="taken-item-image" />
              <div class="taken-item-info">
                <div class="taken-item-name">{{ item.name }}</div>
                <div class="taken-item-time">{{ item.takenOutTime }}</div>
              </div>
              <div class="taken-item-category">{{ item.category }}</div>
            </div>
          </div>

          <div v-else class="taken-out-empty">
            <van-empty description="暂无取出记录" />
          </div>
        </div>
      </van-popup>
    </div>

    <!-- 单个食品详情模式 -->
    <div v-else>
      <!-- 单个食品详情页面内容 -->
      <div class="header">
        <div class="header-content">
          <div class="back-button" @click="goBack">
            <van-icon name="arrow-left" size="20" color="#333" />
          </div>
          <div class="header-title">{{ foodDetail.name || '食品详情' }}</div>
          <div class="header-actions">
            <van-icon name="ellipsis" size="18" color="#666" @click="handleMore" />
          </div>
        </div>
      </div>

      <!-- 食品详情内容 -->
      <div class="food-detail-content">
        <div class="food-image-section">
          <van-image :src="foodDetail.image" width="120" height="120" fit="cover" round class="detail-image" />
        </div>

        <div class="food-info-section">
          <h2 class="food-name">{{ foodDetail.name }}</h2>
          <div class="food-meta">
            <div class="meta-item">
              <span class="label">分类：</span>
              <span class="value">{{ foodDetail.category }}</span>
            </div>
            <div class="meta-item">
              <span class="label">存储位置：</span>
              <span class="value">{{ foodDetail.storageLocation }}</span>
            </div>
            <div class="meta-item">
              <span class="label">过期时间：</span>
              <span class="value" :style="{ color: store.getExpiryColor(foodDetail.expiryDays) }">
                {{ foodDetail.expireDate }}
                ({{ foodDetail.expiryDays <= 0 ? '已过期' : `${foodDetail.expiryDays}天后过期` }}) </span>
            </div>
            <div class="meta-item">
              <span class="label">添加时间：</span>
              <span class="value">{{ foodDetail.createdAt }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIndexStore } from '@/store/index'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()
const store = useIndexStore()

// 已取出列表弹窗显示状态
const showTakenOut = ref(false)

// 取出操作的加载状态
const takingOutIds = ref(new Set())

// 排序选项
const sortOrder = ref('desc') // 'desc' 降序（最新在前），'asc' 升序（最早在前）
const sortOptions = [
  { text: '时间降序（最新在前）', value: 'desc' },
  { text: '时间升序（最早在前）', value: 'asc' }
]

// 判断是分类模式还是单个食品详情模式
const isCategoryMode = computed(() => {
  return route.name === 'CategoryDetail'
})

// 分类信息（仅在分类模式下使用）
const categoryInfo = ref({
  id: route.params.categoryId,
  name: '未知分类',
  icon: 'shop-o',
  bgColor: '#f0f0f0',
  iconColor: '#666'
})

// 单个食品详情信息（仅在食品详情模式下使用）
const foodDetail = ref({
  id: route.params.id,
  name: '未知食品',
  category: '未知分类',
  expireDate: '',
  storageLocation: '冰箱',
  createdAt: '',
  synonyms: [],
  image: '',
  expiryDays: 0
})

// 获取该分类下的食品列表（仅在分类模式下使用）
const filteredFoods = computed(() => {
  if (!isCategoryMode.value) return []
  const foods = store.getFoodsByCategory(categoryInfo.value.id)

  // 按照过期时间排序：过期的在前，即将过期的在中间，正常的在后
  return foods.sort((a, b) => {
    const aDays = a.expiryDays
    const bDays = b.expiryDays

    // 如果都已过期，按过期时间长短排序（过期时间越长越靠前）
    if (aDays < 0 && bDays < 0) {
      return aDays - bDays
    }

    // 如果都未过期，按剩余天数排序（剩余天数越少越靠前）
    if (aDays >= 0 && bDays >= 0) {
      return aDays - bDays
    }

    // 已过期的排在未过期的前面
    if (aDays < 0 && bDays >= 0) return -1
    if (aDays >= 0 && bDays < 0) return 1

    return 0
  })
})

// 获取分类描述
const getCategoryDescription = (categoryName) => {
  return store.getCategoryDescription(categoryName)
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 搜索功能
const handleSearch = () => {
  showToast('搜索功能开发中')
}

// 更多操作
const handleMore = () => {
  showToast('更多操作功能开发中')
}

// 点击食品项（在分类模式下）
const handleFoodClick = (food) => {
  // 将食品数据存储到缓存中
  const cacheKey = `food_${food.id}`
  store.setRouteData(cacheKey, {
    id: food.id,
    name: food.name,
    category: food.category || categoryInfo.value.name,
    expireDate: food.expireDate,
    storageLocation: food.storageLocation || '冰箱',
    createdAt: food.createdAt || food.addedDate || new Date().toISOString().split('T')[0],
    synonyms: food.synonyms || []
  })

  // 跳转到单个食品的详情页，只传递ID参数
  router.push({
    name: 'FoodDetail',
    params: { id: food.id }
  })
}

// 取出食材处理函数
const handleTakeOut = async (food) => {
  const foodId = food._id || food.id

  // 防止重复点击
  if (takingOutIds.value.has(foodId)) {
    return
  }

  // 添加加载状态
  takingOutIds.value.add(foodId)

  try {
    await store.takeOutFood(food)
  } finally {
    // 移除加载状态
    takingOutIds.value.delete(foodId)
  }
}

// 显示已取出列表
const showTakenOutList = () => {
  showTakenOut.value = true
}

// 清空所有已取出记录
const handleClearAllTakenOut = () => {
  store.clearAllTakenOutFoods()
}

// 排序后的已取出食品列表
const sortedTakenOutFoods = computed(() => {
  const foods = [...store.takenOutFoods]

  return foods.sort((a, b) => {
    const dateA = new Date(a.takenOutDate)
    const dateB = new Date(b.takenOutDate)

    if (sortOrder.value === 'desc') {
      return dateB - dateA // 降序：最新在前
    } else {
      return dateA - dateB // 升序：最早在前
    }
  })
})

// 处理排序选择
const handleSortChange = (value) => {
  sortOrder.value = value
}



// 从缓存加载分类数据
const loadCategoryData = () => {
  if (isCategoryMode.value) {
    const cacheKey = `category_${route.params.categoryId}`
    const cachedData = store.getRouteData(cacheKey)

    if (cachedData) {
      categoryInfo.value = { ...cachedData }
    } else {
      // 如果缓存中没有数据，从foodCategories中查找
      const category = store.foodCategories.find(cat => cat.id == route.params.categoryId)
      if (category) {
        categoryInfo.value = { ...category }
      }
    }
  }
}

// 从缓存加载食品详情数据
const loadFoodData = () => {
  if (!isCategoryMode.value) {
    const cacheKey = `food_${route.params.id}`
    const cachedData = store.getRouteData(cacheKey)

    if (cachedData) {
      foodDetail.value = { ...cachedData }

      // 计算过期天数
      if (foodDetail.value.expireDate) {
        foodDetail.value.expiryDays = store.calculateExpiryDays(foodDetail.value.expireDate)
      }

      // 获取食品图片
      foodDetail.value.image = store.getItemImage(foodDetail.value.name, foodDetail.value.category)
    } else {
      // 如果缓存中没有数据，尝试从store的foodData中查找
      const food = store.foodData.find(item => (item._id || item.id) == route.params.id)
      if (food) {
        foodDetail.value = {
          id: food._id || food.id,
          name: food.name,
          category: food.category || '未知分类',
          expireDate: food.expireDate,
          storageLocation: food.storageLocation || '冰箱',
          createdAt: food.createdAt || food.addedDate || new Date().toISOString().split('T')[0],
          synonyms: food.synonyms || [],
          image: store.getItemImage(food.name, food.category),
          expiryDays: store.calculateExpiryDays(food.expireDate)
        }
      }
    }
  }
}

// 初始化数据
const initData = () => {
  loadCategoryData()
  loadFoodData()
}

// 页面挂载时加载数据
onMounted(async () => {
  // 如果store中没有数据，先加载数据
  if (store.foodData.length === 0) {
    await store.loadFoodData()
  }

  // 初始化数据
  initData()

  // 调试：如果是分类模式，打印调试信息
  if (isCategoryMode.value) {
    console.log(`当前分类: ${categoryInfo.value.name} (ID: ${categoryInfo.value.id})`)
    console.log('数据库中的实际分类:', store.getActualCategories)

    // 调试分类匹配情况
    store.debugCategoryFoods(categoryInfo.value.id)
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
  background: white;
  border-bottom: 1px solid #ebedf0;

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 46px;
    padding: 0 16px;

    .back-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      cursor: pointer;
      border-radius: 50%;
      transition: background-color 0.2s;

      &:active {
        background-color: #f2f3f5;
      }
    }

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: #323233;
    }

    .header-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      cursor: pointer;
      border-radius: 50%;
      transition: background-color 0.2s;

      &:active {
        background-color: #f2f3f5;
      }
    }
  }
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
    .swipe-cell {
      border-bottom: 1px solid #f8f9fa;

      &:last-child {
        border-bottom: none;
      }

      .food-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        cursor: pointer;
        transition: background-color 0.2s;
        background: white;

        &:hover {
          background-color: #f8f9fa;
        }

        &:active {
          background-color: #e9ecef;
        }

        .food-image {
          margin-right: 12px;
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

      .take-out-btn {
        height: 100%;
        width: 80px;
        border-radius: 0;
        background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
        border: none;
        color: white;
        font-weight: 600;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
          background: linear-gradient(135deg, #389e0d 0%, #237804 100%);
          transform: scale(1.05);
        }

        &:active:not(:disabled) {
          transform: scale(0.95);
        }

        &:disabled {
          background: linear-gradient(135deg, #d9d9d9 0%, #bfbfbf 100%);
          cursor: not-allowed;
          transform: none;
        }
      }
    }
  }

  .empty-state {
    padding: 40px 20px;
    text-align: center;
  }
}

// 已取出列表样式
.taken-out-section {
  margin: 0 20px 20px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .taken-out-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f8f9fa;
    }

    &:active {
      background-color: #e9ecef;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;

      .taken-out-title {
        font-size: 16px;
        font-weight: 600;
        color: #2c3e50;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;

      .taken-out-count {
        font-size: 14px;
        color: #52c41a;
        font-weight: 500;
      }
    }
  }
}

.taken-out-popup {
  height: 100%;
  display: flex;
  flex-direction: column;

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .van-dropdown-menu {
        :deep(.van-dropdown-menu__bar) {
          background: transparent;
          box-shadow: none;
          height: auto;
          padding: 0;
        }

        :deep(.van-dropdown-menu__item) {
          padding: 4px 8px;
          border-radius: 6px;
          transition: background-color 0.2s;

          &:hover {
            background-color: #f2f3f5;
          }
        }

        :deep(.van-dropdown-menu__title) {
          color: #666;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }

      .van-icon {
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        transition: background-color 0.2s;

        &:hover {
          background-color: #f2f3f5;
        }
      }
    }
  }

  .taken-out-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px;

    .taken-out-item {
      display: flex;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid #f8f9fa;

      &:last-child {
        border-bottom: none;
      }

      .taken-item-image {
        margin-right: 12px;
        border: 2px solid #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .taken-item-info {
        flex: 1;

        .taken-item-name {
          font-size: 16px;
          font-weight: 500;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .taken-item-time {
          font-size: 12px;
          color: #7f8c8d;
        }
      }

      .taken-item-category {
        font-size: 14px;
        color: #52c41a;
        background: #f6ffed;
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: 500;
      }
    }
  }

  .taken-out-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

// 单个食品详情样式
.food-detail-content {
  margin: 20px;

  .food-image-section {
    background: white;
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .detail-image {
      border: 3px solid #fff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }
  }

  .food-info-section {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .food-name {
      margin: 0 0 20px 0;
      font-size: 24px;
      font-weight: 600;
      color: #2c3e50;
      text-align: center;
    }

    .food-meta {
      .meta-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f8f9fa;

        &:last-child {
          border-bottom: none;
        }

        .label {
          font-size: 14px;
          color: #7f8c8d;
          font-weight: 500;
        }

        .value {
          font-size: 14px;
          color: #2c3e50;
          font-weight: 600;
          text-align: right;
          flex: 1;
          margin-left: 12px;
        }
      }
    }
  }
}
</style>