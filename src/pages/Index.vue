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
      <van-grid :column-num="3" :gutter="10" :border="false">
        <van-grid-item v-for="item in store.foodCategories" :key="item.id" @click="() => handleCategoryClick(item, router)">
          <div class="category-item">
            <div class="icon-wrapper" :style="{ backgroundColor: item.bgColor }">
              <van-icon :name="item.icon" :color="item.iconColor" size="25" />
            </div>
            <span class="category-text">{{ item.name }}</span>
          </div>
        </van-grid-item>
      </van-grid>
    </div>

    <!-- 智能推荐 -->
    <div class="recommend commonstyle">
      <div class="recommend-header">
        <div class="header-left">
          <van-icon name="bulb-o" color="#ff9500" size="25" />
          <span class="recommend-title">智能推荐</span>
        </div>
      </div>

      <div class="recommend-card" @click="handleRecommendClick">
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
              <van-image  
                width="60" 
                height="60" 
                :src="store.recommendData.recipe.image" 
                fit="cover" 
                round
                class="recipe-img" 
              />
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
            <van-cell v-for="item in store.recentlyAdded" :key="item.id" @click="handleRecentItemClick(item)" clickable
              class="recent-item">
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
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useIndexStore } from '@/store/index'

// 使用router和store
const router = useRouter()
const store = useIndexStore()

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
  .van-grid-item {
    :deep(.van-grid-item__content) {
      border-radius: 15px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border: 1px solid #e9ecef;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

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
        // border-color:  rgb(0, 150, 5);
        background: linear-gradient(135deg, #ffffff 0%, rgba(0, 150, 5, 0.1) 100%);

        &::before {
          left: 100%;
        }
      }

      &:active {
        transform: translateY(-2px) scale(1.01);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        transition: all 0.1s ease;
      }

      &:focus-visible {
        outline: 2px solid #007bff;
        outline-offset: 2px;
      }
    }
  }

  .category-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    transition: all 0.3s ease;
    position: relative;
    z-index: 1;

    .icon-wrapper {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
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
    }

    // 悬停效果
    &:hover {
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

    // 点击效果
    &:active {
      .icon-wrapper {
        transform: scale(1.05) rotate(2deg);
      }

      .category-text {
        transform: translateY(0);
      }
    }
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