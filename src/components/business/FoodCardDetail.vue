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
          <span class="count">
            {{ showAllFoods ? `共${allFoods.length}项` : `显示${filteredFoods.length}/${allFoods.length}项` }}
          </span>
        </div>

        <van-overlay :show="filteredFoods.length > 0 && showGestureHint" :lock-scroll="true" :z-index="2000" class="guide-overlay" @click="showGestureHint=false">
          <div class="guide-content">
            <div class="guide-tooltip">
              <van-icon name="arrow-left" size="14" color="#1989fa" />
              <span>向左滑动条目可“取出”</span>
            </div>
            <div class="guide-hand"></div>
          </div>
        </van-overlay>

        <div class="food-items" v-if="filteredFoods.length > 0">
          <van-swipe-cell v-for="food in filteredFoods" :key="food.id" class="swipe-cell"
            :class="{ 'highlighted': shouldHighlight(food) }">
            <div class="food-item" :class="{ 'search-highlight': shouldHighlight(food) }"
              :data-food-id="food.id || food._id" @click="handleFoodClick(food)">
              <van-image :src="food.image" width="50" height="50" fit="cover" round class="food-image" />
              <div class="food-info">
                <div class="food-name">
                  {{ food.name }}
                  <van-tag v-if="shouldHighlight(food)" type="primary" size="mini" class="search-tag">
                    搜索结果
                  </van-tag>
                </div>
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

        <!-- 查看更多/收起按钮 -->
        <div class="load-more-section" v-if="allFoods.length > 0">
          <van-button v-if="shouldShowLoadMore" type="primary" plain size="small" @click="handleLoadMore"
            class="load-more-btn">
            查看更多
          </van-button>

          <van-button v-else-if="showAllFoods && allFoods.length > pageSize" type="default" plain size="small"
            @click="handleCollapse" class="collapse-btn">
            收起
          </van-button>
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
        <!-- 加载状态 -->
        <div v-if="store.loading" class="loading-section">
          <van-loading size="24px" vertical>加载中...</van-loading>
        </div>

        <!-- 食品详情 -->
        <template v-else>
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
              <div class="meta-item" v-if="foodDetail.updatedAt && foodDetail.updatedAt !== foodDetail.createdAt">
                <span class="label">更新时间：</span>
                <span class="value">{{ foodDetail.updatedAt }}</span>
              </div>
              <div class="meta-item" v-if="foodDetail.description">
                <span class="label">描述：</span>
                <span class="value">{{ foodDetail.description }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIndexStore } from '@/store/index'
import { showToast, showConfirmDialog } from 'vant'

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

// 分页相关状态
const pageSize = ref(10) // 每页显示数量
const currentPage = ref(1) // 当前页码
const showAllFoods = ref(false) // 是否显示所有食品
const showGestureHint = ref(false)
let gestureHintTimer = null

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

// 获取该分类下的所有食品列表（仅在分类模式下使用）
const allFoods = computed(() => {
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

// 当前显示的食品列表（分页后的）
const filteredFoods = computed(() => {
  if (!isCategoryMode.value) return []

  // 如果显示所有食品，返回全部
  if (showAllFoods.value) {
    return allFoods.value
  }

  // 否则只返回前10条
  return allFoods.value.slice(0, pageSize.value)
})

// 是否需要显示"查看更多"按钮
const shouldShowLoadMore = computed(() => {
  return !showAllFoods.value && allFoods.value.length > pageSize.value
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

  // 直接跳转到食品详情页，只传递ID参数
  // 不再使用缓存，而是在详情页实时获取最新数据
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

  try {
    // 显示确认对话框
    await showConfirmDialog({
      title: '确认取出',
      message: '取出记录可以在取出列表查看',
      confirmButtonText: '确认取出',
      cancelButtonText: '取消'
    })

    // 用户确认后，添加加载状态
    showGestureHint.value = false
    takingOutIds.value.add(foodId)

    // 执行取出操作
    await store.takeOutFood(food)

    // 显示成功提示
    showToast({
      message: '取出成功',
      type: 'success'
    })

  } catch (error) {
    // 用户取消或操作失败
    if (error !== 'cancel') {
      showToast({
        message: '取出失败，请重试',
        type: 'fail'
      })
    }
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

// 查看更多食品
const handleLoadMore = () => {
  showGestureHint.value = false
  showAllFoods.value = true
}

// 收起食品列表
const handleCollapse = () => {
  showAllFoods.value = false
}



// 高亮的食品ID和搜索关键词
const highlightFoodId = ref(null)
const searchTerm = ref('')

// 从缓存加载分类数据
const loadCategoryData = () => {
  if (isCategoryMode.value) {
    const cacheKey = `category_${route.params.categoryId}`
    const cachedData = store.getRouteData(cacheKey)

    if (cachedData) {
      categoryInfo.value = { ...cachedData }

      // 检查是否有搜索高亮信息
      if (cachedData.highlightFoodId) {
        highlightFoodId.value = cachedData.highlightFoodId
        searchTerm.value = cachedData.searchTerm || ''

        // 如果有高亮食品，自动展开显示所有食品
        showAllFoods.value = true

        // 延迟滚动到高亮的食品
        setTimeout(() => {
          scrollToHighlightedFood()
        }, 500)
      }
    } else {
      // 如果缓存中没有数据，从foodCategories中查找
      const category = store.foodCategories.find(cat => cat.id == route.params.categoryId)
      if (category) {
        categoryInfo.value = { ...category }
      }
    }

    // 重置分页状态（除非有高亮需求）
    if (!highlightFoodId.value) {
      showAllFoods.value = false
      currentPage.value = 1
    }
  }
}

// 滚动到高亮的食品
const scrollToHighlightedFood = () => {
  if (highlightFoodId.value) {
    const element = document.querySelector(`[data-food-id="${highlightFoodId.value}"]`)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })

      // 添加闪烁效果
      element.classList.add('highlight-flash')
      setTimeout(() => {
        element.classList.remove('highlight-flash')
      }, 2000)
    }
  }
}

// 检查食品是否应该被高亮
const shouldHighlight = (food) => {
  return highlightFoodId.value && (food.id === highlightFoodId.value || food._id === highlightFoodId.value)
}

// 从数据库实时加载食品详情数据
const loadFoodData = async () => {
  if (!isCategoryMode.value) {
    const foodId = route.params.id

    try {
      // 显示加载状态
      store.loading = true

      // 从数据库实时获取食品详情
      const foodData = await store.getFoodById(foodId)

      if (foodData) {
        foodDetail.value = { ...foodData }
      } else {
        // 如果数据库中没有找到，显示错误信息
        showToast({
          message: '食品不存在或已被删除',
          type: 'fail'
        })

        // 返回上一页
        setTimeout(() => {
          router.back()
        }, 1500)
      }
    } catch (error) {
      // 如果获取失败，尝试从本地缓存获取（作为备选方案）
      const food = store.foodData.find(item => (item._id || item.id) == foodId)

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

        showToast({
          message: '使用本地缓存数据，可能不是最新信息',
          type: 'warning'
        })
      } else {
        showToast({
          message: '无法加载食品详情',
          type: 'fail'
        })

        setTimeout(() => {
          router.back()
        }, 1500)
      }
    } finally {
      store.loading = false
    }
  } else {
    // 当前为分类模式，跳过食品详情加载
  }
}

// 初始化数据
const initData = async () => {
  loadCategoryData()
  await loadFoodData()
}

// 监听路由参数变化
watch(() => route.params, async (newParams, oldParams) => {
  if (newParams.id !== oldParams?.id) {
    await initData()
  }
}, { immediate: false })

// 页面挂载时加载数据
onMounted(async () => {
  // 如果store中没有数据，先加载数据
  if (store.foodData.length === 0) {
    await store.loadFoodData()
  }

  // 初始化数据
  await initData()

  // 分类模式进入且有数据时，显示一次性遮罩引导
  if (isCategoryMode.value && filteredFoods.value.length > 0) {
    showGestureHint.value = true
    gestureHintTimer = setTimeout(() => { showGestureHint.value = false }, 6000)
  }

  // 调试：如果是分类模式，打印调试信息
  if (isCategoryMode.value) {
    // 调试分类匹配情况
    store.debugCategoryFoods(categoryInfo.value.id)
  }
})
onUnmounted(() => {
  if (gestureHintTimer) {
    clearTimeout(gestureHintTimer)
    gestureHintTimer = null
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
            display: flex;
            align-items: center;
            gap: 8px;

            .search-tag {
              animation: pulse 1.5s infinite;
            }
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

        // 搜索高亮样式
        &.search-highlight {
          background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
          border-left: 4px solid #1890ff;
          position: relative;

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(24, 144, 255, 0.1), transparent);
            animation: shimmer 2s infinite;
            pointer-events: none;
          }

          &:hover {
            background: linear-gradient(135deg, #d6f3ff 0%, #e6f7ff 100%);
          }

          .food-name {
            color: #1890ff;
            font-weight: 600;
          }
        }
      }

      // 高亮闪烁动画
      &.highlighted {
        .food-item {
          animation: highlight-flash 2s ease-in-out;
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

.load-more-section {
  padding: 16px 20px;
  text-align: center;
  border-top: 1px solid #f8f9fa;

  .load-more-btn,
  .collapse-btn {
    width: 100%;
    height: 40px;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .load-more-btn {
    background: linear-gradient(135deg, #c7f3cf 0%, #9ff18f 100%);
    border: none;
    color: rgb(0, 0, 0);

    &:hover {
      background: linear-gradient(45deg, #9ff18f 0%, #c7f3cf 100%);
    }
  }

  .collapse-btn {
    background: linear-gradient(45deg, #9ff18f 0%, #c7f3cf 100%);
    color: #666;

    &:hover {
      background: linear-gradient(135deg, #c7f3cf 0%, #9ff18f 100%);
      color: #333;
    }
  }
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
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

  .loading-section {
    background: white;
    border-radius: 12px;
    padding: 60px 20px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .van-loading {
      color: #1890ff;
    }
  }

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

.guide-overlay { background: rgba(0, 0, 0, 0.35); }
.guide-content { position: fixed; bottom: 110px; left: 20px; right: 20px; display: flex; align-items: center; gap: 12px; }
.guide-tooltip { display: inline-flex; align-items: center; gap: 6px; background: #f0f9ff; color: #1989fa; border: 1px solid #e6f7ff; padding: 8px 12px; border-radius: 999px; box-shadow: 0 2px 8px rgba(24, 144, 255, 0.12); animation: bubble-pop 0.6s ease-out, pulse 1.6s infinite; font-size: 12px; }
.guide-hand { width: 32px; height: 32px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #fff 0%, #e6f7ff 60%, #cbe8ff 100%); box-shadow: 0 2px 6px rgba(24, 144, 255, 0.2); animation: swipe-left 1.8s infinite; }
@keyframes swipe-left { 0% { transform: translateX(0); opacity: 0.85; } 50% { transform: translateX(-18px); opacity: 1; } 100% { transform: translateX(0); opacity: 0.85; } }

// 动画定义
@keyframes pulse {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

@keyframes highlight-flash {

  0%,
  100% {
    background: white;
    transform: scale(1);
  }

  25% {
    background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
    transform: scale(1.02);
  }

  50% {
    background: linear-gradient(135deg, #bae7ff 0%, #e6f7ff 100%);
    transform: scale(1.02);
  }

  75% {
    background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
    transform: scale(1.02);
  }
}

// 高亮闪烁类
.highlight-flash {
  animation: highlight-flash 2s ease-in-out !important;
}
</style>