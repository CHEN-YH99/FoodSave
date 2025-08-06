<template>
  <div class="index-page">
    <!-- 食品状态栏 -->
    <div class="footstore commonstyle">
      <van-button class="expired" round @click="handleExpiredClick" :loading="loading">
        <van-icon name="cross" />
        已过期: {{ loading ? '...' : store.expired }}项
      </van-button>
      <van-button class="danger" round @click="handleExpiryWarningClick" :loading="loading">
        <van-icon name="warning-o" />
        即将过期: {{ loading ? '...' : store.outdate }}项
      </van-button>
      <van-button class="warning" round @click="handleLowStockClick" :loading="loading">
        <van-icon name="shop-o" />
        库存不足: {{ loading ? '...' : store.lowstock }}项
      </van-button>
    </div>

    <!-- 食品分类栏 -->
    <div class="food-classification commonstyle">
      <div class="classification-header">
        <div class="header-left">
          <van-icon name="apps-o" color="#2c3e50" size="20" />
          <span class="classification-title">食品分类</span>
        </div>
        <div v-if="store.shouldShowMoreButton" class="toggle-button" @click="store.toggleCategoriesExpansion">
          <span class="toggle-text">
            {{ store.showAllCategories ? '收起' : '更多' }}
          </span>
          <van-icon :name="store.showAllCategories ? 'arrow-up' : 'arrow-down'"
            :class="['toggle-icon', { 'rotated': store.showAllCategories }]" size="14" color="#666" />
        </div>
      </div>

      <div class="categories-container" ref="categoriesContainer">
        <div class="categories-grid" :class="{ 'expanded': store.showAllCategories }" ref="categoriesGrid">
          <transition-group name="category-item" tag="div" class="categories-inner">
            <div v-for="(item, index) in store.foodCategories" :key="item.id" class="category-grid-item" :class="{
              'hidden': !store.showAllCategories && index >= store.maxVisibleCategories,
              'visible': store.showAllCategories || index < store.maxVisibleCategories
            }" :style="{
                '--delay': `${index * 0.05}s`,
                '--index': index
              }" @click="() => handleCategoryClick(item, router)">
              <div class="category-item">
                <div class="icon-wrapper" :style="{ backgroundColor: item.bgColor }">
                  <van-icon :name="item.icon" :color="item.iconColor" size="25" />
                </div>
                <span class="category-text">{{ item.name }}</span>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
    </div>

    <!-- 智能推荐 -->
    <div class="recommend commonstyle">
      <div class="recommend-header">
        <div class="header-left">
          <van-icon name="bulb-o" color="#ff9500" size="25" />
          <span class="recommend-title">智能推荐</span>
        </div>
      </div>

      <div class="recommend-card" @click="() => handleRecommendClick(router)">
        <div class="card-left">
          <div class="ingredient-section">
            <van-image width="70" height="70" :src="store.recommendData.ingredient.image" fit="cover" round
              class="ingredient-img" />
            <div class="ingredient-info">
              <div class="ingredient-name">{{ store.recommendData.ingredient.name }}</div>
              <div class="ingredient-status"
                :style="{ color: store.getExpiryColor(store.recommendData.ingredient.expiryDays) }">
                {{ store.recommendData.ingredient.expiryDays <= 0 ? '已过期' : store.recommendData.ingredient.expiryDays
                  <= 3 ? `${store.recommendData.ingredient.expiryDays}天后过期` : '即将过期' }} </div>
              </div>
            </div>

            <div class="arrow-section">
              <van-icon name="arrow" color="#ff9500" size="18" />
              <span class="suggest-text">推荐菜谱:</span>
            </div>
          </div>

          <div class="card-right">
            <div class="recipe-section">
              <van-image width="60" height="60" :src="store.recommendData.recipe.image" fit="cover" round
                class="recipe-img" />
              <div class="recipe-name">{{ store.recommendData.recipe.name }}</div>
            </div>
            <van-icon name="arrow" color="#c8c9cc" size="16" class="more-icon" />
          </div>
        </div>
      </div>

      <!-- 最近添加 -->
      <div class="recently-added commonstyle">
        <div class="recently-header">
          <div class="header-left">
            <van-icon name="clock-o" color="rgb(0, 150, 5)" size="25" />
            <span class="recently-title">最近添加</span>
          </div>
        </div>

        <div class="recently-list">
          <van-cell-group :border="false">
            <van-cell v-for="item in store.recentlyAdded" :key="item.id"
              @click="() => handleRecentItemClick(item, router)" clickable class="recent-item">
              <template #icon>
                <van-image :src="item.image" width="50" height="50" fit="cover" round class="item-image" />
              </template>
              <template #title>
                <div class="item-info">
                  <div class="item-name">{{ item.name }}</div>
                  <div class="item-expiry" :style="{ color: store.getExpiryColor(item.expiryDays) }">
                    <van-icon name="clock-o" size="12" />
                    {{ item.expiryDays }}天后过期
                  </div>
                </div>
              </template>
              <template #right-icon>
                <van-icon name="ellipsis" color="#c8c9cc" size="18" />
              </template>
            </van-cell>
          </van-cell-group>
        </div>

        <div class="view-all" @click="handleViewAllClick">
          <span class="view-all-text">查看全部</span>
        </div>
      </div>
    </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useIndexStore } from '@/store/index'
import TabBar from '../components/layout/TabBar.vue'

// 使用router和store
const router = useRouter()
const store = useIndexStore()

// 模板引用
const categoriesContainer = ref(null)
const categoriesGrid = ref(null)

// 从store中解构所需的方法
const {
  // 状态
  loading,

  // 异步操作
  loadFoodData,

  // 事件处理
  handleCategoryClick,
  handleRecommendClick,
  handleRecentItemClick,
  handleViewAllClick,
  handleExpiredClick,
  handleExpiryWarningClick,
  handleLowStockClick
} = store



// 页面挂载时加载数据
onMounted(() => {
  loadFoodData()
})
</script>

<style scoped lang="scss">
// 页面根元素
.index-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20px;
}

// 公共样式
.commonstyle {
  width: 90%;
  margin: 20px auto;
  background-color: white;
  border-radius: 15px;
  padding: 15px;
}

// 食品状态
.footstore {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;

  .danger {
    flex: 1;
    background-color: rgb(251, 212, 212);
    color: rgb(255, 0, 0);
    transition: all 0.3s ease;

    &:hover {
      background-color: rgb(248, 180, 180);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 0, 0, 0.2);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .expired {
    flex: 1;
    background-color: rgb(255, 230, 230);
    color: rgb(139, 0, 0);
    transition: all 0.3s ease;

    &:hover {
      background-color: rgb(255, 200, 200);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(139, 0, 0, 0.2);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .warning {
    flex: 1;
    background-color: rgb(255, 245, 202);
    color: rgb(255, 145, 0);
    transition: all 0.3s ease;

    &:hover {
      background-color: rgb(255, 235, 180);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 145, 0, 0.2);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

// 食品分类
.food-classification {
  .classification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 0 4px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;

      .classification-title {
        font-size: 16px;
        font-weight: 600;
        color: #2c3e50;
      }
    }

    .toggle-button {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border: 1px solid #dee2e6;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;

      &:hover {
        background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &:active {
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      }

      .toggle-text {
        font-size: 13px;
        color: #666;
        font-weight: 500;
      }

      .toggle-icon {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }
  }

  .categories-container {
    overflow: hidden;
    position: relative;
    transition: height 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .categories-grid {
    .categories-inner {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  .category-grid-item {
    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    will-change: transform, opacity, max-height;
    overflow: hidden;

    &.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
      max-height: 200px;
      /* 足够容纳一个分类项的高度 */
      margin-bottom: 12px;
      pointer-events: auto;
    }

    &.hidden {
      opacity: 0;
      transform: translateY(-20px) scale(0.9);
      max-height: 0;
      margin-bottom: 0;
      pointer-events: none;
      transition-delay: calc(0.05s * (var(--index) - 6));
    }

    // 展开时的延迟动画
    &.visible:nth-child(n+7) {
      transition-delay: calc(0.1s + 0.05s * (var(--index) - 6));
    }

    .category-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 8px;
      border-radius: 16px;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border: 1px solid #e9ecef;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
        transition: left 0.5s ease;
      }

      &:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
        background: linear-gradient(135deg, #ffffff 0%, rgba(0, 150, 5, 0.1) 100%);
        border-color: rgba(0, 150, 5, 0.3);

        &::before {
          left: 100%;
        }

        .icon-wrapper {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);

          &::after {
            width: 60px;
            height: 60px;
          }
        }

        .category-text {
          color: #21a946;
          font-weight: 600;
          transform: translateY(-2px);
        }
      }

      &:active {
        transform: translateY(-2px) scale(1.01);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        transition: all 0.1s ease;

        .icon-wrapper {
          transform: scale(1.05) rotate(2deg);
        }

        .category-text {
          transform: translateY(0);
        }
      }

      .icon-wrapper {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;

        &::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: all 0.3s ease;
        }
      }

      .category-text {
        font-size: 14px;
        color: #333;
        font-weight: 500;
        transition: all 0.3s ease;
        text-align: center;
        line-height: 1.2;
      }
    }
  }
}

// 分类展开动画
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 分类项过渡动画
.category-item-enter-active,
.category-item-leave-active {
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.category-item-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.8);
  max-height: 0;
}

.category-item-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
  max-height: 0;
}

.category-item-move {
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

// 容器高度自适应动画
.categories-container {
  &::after {
    content: '';
    display: block;
    height: 0;
    transition: height 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
}

// 智能推荐
.recommend {
  display: flex;
  flex-direction: column;
  align-items: stretch;

  .recommend-header {
    margin-bottom: 16px;

    .header-left {
      display: flex;
      align-items: center;

      .recommend-title {
        margin-left: 8px;
        font-size: 17px;
        font-weight: 600;
        color: #2c3e50;
      }
    }
  }

  .recommend-card {
    background: linear-gradient(135deg, rgba(0, 150, 5, 0.1) 0%, #fff 100%);
    border: 1px solid #f0f0f0;
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      border-color: #ff9500;
    }

    &:active {
      transform: translateY(0);
    }

    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-left {
      display: flex;
      align-items: center;
      flex: 1;

      .ingredient-section {
        display: flex;
        align-items: center;
        margin-right: 20px;

        .ingredient-img {
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .ingredient-info {
          margin-left: 12px;

          .ingredient-name {
            font-size: 15px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 4px;
          }

          .ingredient-status {
            font-size: 12px;
            color: #e74c3c;
            background: #ffeaea;
            padding: 2px 8px;
            border-radius: 10px;
            display: inline-block;
          }
        }
      }

      .arrow-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 16px;

        .suggest-text {
          font-size: 12px;
          color: #7f8c8d;
          margin-top: 4px;
          white-space: nowrap;
        }
      }
    }

    .card-right {
      display: flex;
      align-items: center;

      .recipe-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-right: 12px;

        .recipe-img {
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 8px;
        }

        .recipe-name {
          font-size: 14px;
          font-weight: 600;
          color: #2c3e50;
          text-align: center;
        }
      }

      .more-icon {
        opacity: 0.6;
        transition: opacity 0.2s;
      }
    }

    &:hover .more-icon {
      opacity: 1;
    }
  }
}

// 最近添加
.recently-added {
  display: flex;
  flex-direction: column;
  align-items: stretch;

  .recently-header {
    margin-bottom: 16px;

    .header-left {
      display: flex;
      align-items: center;

      .recently-title {
        margin-left: 8px;
        font-size: 17px;
        font-weight: 600;
        color: #2c3e50;
      }
    }
  }

  .recently-list {
    margin-bottom: 16px;

    :deep(.van-cell-group) {
      background: transparent;
    }

    .recent-item {
      :deep(.van-cell) {
        background: transparent;
        padding: 12px 0;
        border-bottom: 1px solid #f5f5f5;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background: #f8f9fa;
          border-radius: 8px;
        }

        &:active {
          background: #e9ecef;
        }
      }

      .item-image {
        margin-right: 12px;
        border: 2px solid #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .item-info {
        display: flex;
        flex-direction: column;

        .item-name {
          font-size: 16px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .item-expiry {
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        }
      }
    }
  }

  .view-all {
    text-align: center;
    padding: 12px 0;
    cursor: pointer;
    border-radius: 8px;
    transition: background-color 0.2s;

    &:hover {
      background: #f8f9fa;
    }

    &:active {
      background: #e9ecef;
    }

    .view-all-text {
      color: rgb(0, 150, 5);
      font-size: 15px;
      font-weight: 600;
    }
  }
}
</style>