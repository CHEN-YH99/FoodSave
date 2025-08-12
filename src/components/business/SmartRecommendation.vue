<template>
  <div class="smart-recommendation commonstyle">
    <!-- 紧凑的标题栏 -->
    <div class="header">
      <div class="header-left">
        <van-icon name="bulb-o" color="#ff9500" size="18" />
        <span class="title">智能推荐</span>
        <van-tag v-if="currentIngredient" type="warning" size="mini">
          {{ getExpiryText(currentIngredient.expiryDays) }}
        </van-tag>
      </div>
      <van-button 
        size="mini" 
        type="primary" 
        plain
        @click="refreshRecommendations"
        :loading="loading"
        class="refresh-btn"
      >
        <van-icon name="replay" size="12" />
      </van-button>
    </div>

    <!-- 空状态 -->
    <div v-if="!currentIngredient" class="empty-state">
      <van-icon name="smile-o" size="32" color="#c8c9cc" />
      <p class="empty-text">暂无即将过期的食材</p>
    </div>

    <!-- 当前推荐食材 -->
    <div v-else class="recommendation-content">
      <!-- 食材信息卡片 -->
      <div class="ingredient-card" @click="toggleExpanded">
        <div class="ingredient-main">
          <van-image
            :src="currentIngredient.image"
            width="40"
            height="40"
            round
            fit="cover"
            class="ingredient-img"
          />
          <div class="ingredient-info">
            <div class="ingredient-name">{{ currentIngredient.name }}</div>
            <div class="ingredient-meta">
              <span class="expiry-tag" :style="{ color: getExpiryColor(currentIngredient.expiryDays) }">
                {{ getExpiryText(currentIngredient.expiryDays) }}
              </span>
              <span class="recipe-count">{{ currentIngredient.totalRecipes }}个菜谱</span>
            </div>
          </div>
        </div>
        <div class="expand-btn">
          <van-icon 
            :name="expanded ? 'arrow-up' : 'arrow-down'" 
            size="14" 
            color="#969799"
          />
        </div>
      </div>

      <!-- 菜谱列表 -->
      <div v-show="expanded" class="recipes-section">
        <div class="recipes-grid">
          <div 
            v-for="recipe in currentIngredient.recommendedRecipes" 
            :key="recipe.id"
            class="recipe-item"
            @click="goToRecipe(recipe, currentIngredient)"
          >
            <van-image
              :src="recipe.image"
              width="36"
              height="36"
              round
              fit="cover"
              class="recipe-img"
            />
            <div class="recipe-details">
              <div class="recipe-name">{{ recipe.name }}</div>
              <div class="recipe-info">
                <span class="time">{{ recipe.cookingTime }}</span>
                <span class="difficulty">{{ recipe.difficulty }}</span>
                <span class="steps">{{ recipe.steps.length }}步</span>
              </div>
            </div>
            <van-icon name="arrow" size="12" color="#c8c9cc" />
          </div>
        </div>
        
        <!-- 查看更多 -->
        <div 
          v-if="currentIngredient.totalRecipes > currentIngredient.recommendedRecipes.length"
          class="view-more"
          @click="viewAllRecipes(currentIngredient)"
        >
          <span class="view-more-text">查看全部 {{ currentIngredient.totalRecipes }} 个菜谱</span>
          <van-icon name="arrow" size="12" color="#1989fa" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useIndexStore } from '@/store/index'
import { useRecipe, useSmartRecommendation } from '@/hooks/useRecipe'
import { dateUtils, foodUtils } from '@/utils'
import { ROUTE_NAMES, MESSAGE_TYPES } from '@/constants'
import { showToast } from 'vant'

const router = useRouter()
const store = useIndexStore()
const loading = ref(false)

// 使用组合式API
const { getRecipesByIngredient } = useRecipe()
const { 
  currentIndex, 
  expanded, 
  getAvailableIngredients, 
  switchToRandomIngredient, 
  toggleExpanded 
} = useSmartRecommendation()

// 获取所有符合条件的食材（已过期或3天内过期）
const availableIngredients = computed(() => {
  const foodData = store.foodData.map(food => ({
    ...food,
    id: food._id || food.id,
    expiryDays: dateUtils.calculateExpiryDays(food.expireDate),
    image: foodUtils.getItemImage(food.name, food.category)
  }))
  
  return getAvailableIngredients(foodData, getRecipesByIngredient)
})

// 当前显示的食材
const currentIngredient = computed(() => {
  if (availableIngredients.value.length === 0) return null
  return availableIngredients.value[currentIndex.value] || null
})

// 获取过期状态颜色
const getExpiryColor = (days) => {
  return foodUtils.getExpiryColor(days)
}

// 获取过期状态文本
const getExpiryText = (days) => {
  return dateUtils.getRelativeTime(new Date(Date.now() + days * 24 * 60 * 60 * 1000))
}

// 刷新推荐 - 随机选择一个食材
const refreshRecommendations = async () => {
  if (availableIngredients.value.length === 0) {
    showToast({
      message: '暂无可推荐的食材',
      type: MESSAGE_TYPES.WARNING
    })
    return
  }
  
  loading.value = true
  try {
    // 模拟加载延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 随机切换食材
    switchToRandomIngredient(availableIngredients.value)
    
    showToast({
      message: '推荐已更新',
      type: MESSAGE_TYPES.SUCCESS,
      duration: 1500
    })
  } finally {
    loading.value = false
  }
}

// 跳转到菜谱详情
const goToRecipe = (recipe, ingredient) => {
  const cacheKey = `recipe_${recipe.id}`
  
  // 缓存菜谱数据，包含推荐原因
  store.setRouteData(cacheKey, {
    ...recipe,
    recommendedIngredient: ingredient,
    allRecommendedRecipes: getRecipesByIngredient(ingredient.name)
  })
  
  router.push({
    name: ROUTE_NAMES.RECIPE_DETAIL,
    params: { id: recipe.id }
  })
}

// 查看某个食材的所有菜谱
const viewAllRecipes = (ingredient) => {
  const cacheKey = `ingredient_recipes_${ingredient.id}`
  
  // 缓存食材的所有菜谱数据
  store.setRouteData(cacheKey, {
    ingredient,
    recipes: getRecipesByIngredient(ingredient.name)
  })
  
  router.push({
    name: ROUTE_NAMES.INGREDIENT_RECIPES,
    params: { ingredientId: ingredient.id }
  })
}

// 初始化
onMounted(() => {
  // 如果有可用食材，随机选择一个作为初始显示
  if (availableIngredients.value.length > 0) {
    currentIndex.value = Math.floor(Math.random() * availableIngredients.value.length)
  }
})
</script>

<style scoped lang="scss">
// 紧凑的标题栏
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 6px;
    
    .title {
      font-size: 15px;
      font-weight: 600;
      color: #323233;
    }
  }
  
  .refresh-btn {
    padding: 4px 8px;
    height: 24px;
    
    :deep(.van-button__text) {
      font-size: 11px;
    }
  }
}

// 空状态
.empty-state {
  text-align: center;
  padding: 20px 0;
  
  .empty-text {
    margin: 8px 0 0;
    color: #969799;
    font-size: 13px;
  }
}

// 推荐内容
.recommendation-content {
  .ingredient-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    background: linear-gradient(135deg, #fff7e6 0%, #fff 100%);
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: linear-gradient(135deg, #fff2d9 0%, #fafafa 100%);
      border-color: #ff9500;
    }
    
    &:active {
      transform: scale(0.98);
    }
    
    .ingredient-main {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      
      .ingredient-img {
        border: 2px solid #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }
      
      .ingredient-info {
        .ingredient-name {
          font-size: 14px;
          font-weight: 600;
          color: #323233;
          margin-bottom: 2px;
        }
        
        .ingredient-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .expiry-tag {
            font-size: 11px;
            font-weight: 500;
          }
          
          .recipe-count {
            font-size: 11px;
            color: #1989fa;
            background: #e8f3ff;
            padding: 1px 4px;
            border-radius: 4px;
          }
        }
      }
    }
    
    .expand-btn {
      padding: 4px;
    }
  }
}

// 菜谱列表
.recipes-section {
  margin-top: 8px;
  
  .recipes-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
    
    .recipe-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
      background: #f7f8fa;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: #e8f3ff;
        transform: translateX(2px);
      }
      
      &:active {
        transform: translateX(0);
      }
      
      .recipe-img {
        flex-shrink: 0;
        border: 1px solid #f0f0f0;
      }
      
      .recipe-details {
        flex: 1;
        min-width: 0;
        
        .recipe-name {
          font-size: 13px;
          font-weight: 600;
          color: #323233;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .recipe-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          color: #969799;
          
          .time, .difficulty, .steps {
            background: #fff;
            padding: 1px 3px;
            border-radius: 3px;
            white-space: nowrap;
          }
          
          .steps {
            color: #1989fa;
          }
        }
      }
    }
  }
  
  .view-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px;
    margin-top: 6px;
    background: #f0f9ff;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: #e1f5fe;
    }
    
    &:active {
      transform: scale(0.98);
    }
    
    .view-more-text {
      font-size: 12px;
      color: #1989fa;
      font-weight: 500;
    }
  }
}

// 响应式优化
@media (max-width: 375px) {
  .header {
    margin-bottom: 10px;
    
    .header-left {
      gap: 4px;
      
      .title {
        font-size: 14px;
      }
    }
  }
  
  .recommendation-content .ingredient-card {
    padding: 8px;
    
    .ingredient-main {
      gap: 8px;
      
      .ingredient-info .ingredient-name {
        font-size: 13px;
      }
    }
  }
  
  .recipes-section .recipes-grid .recipe-item {
    padding: 6px;
    gap: 8px;
    
    .recipe-details .recipe-name {
      font-size: 12px;
    }
  }
}
</style>
