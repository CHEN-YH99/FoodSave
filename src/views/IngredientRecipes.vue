<template>
  <div class="ingredient-recipes">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      :title="`${ingredient?.name || '食材'}相关菜谱`"
      left-arrow
      @click-left="goBack"
      class="custom-nav-bar"
    />

    <div v-if="ingredient" class="page-content">
      <!-- 食材信息头部 -->
      <div class="ingredient-header">
        <van-image
          :src="ingredient.image"
          width="60"
          height="60"
          round
          class="ingredient-image"
        />
        <div class="ingredient-info">
          <div class="ingredient-name">{{ ingredient.name }}</div>
          <div class="expiry-info" :style="{ color: getExpiryColor(ingredient.expiryDays) }">
            {{ getExpiryText(ingredient.expiryDays) }}
          </div>
          <div class="recipes-count">共找到 {{ recipes.length }} 个相关菜谱</div>
        </div>
      </div>

      <!-- 筛选和排序 -->
      <div class="filter-bar">
        <van-dropdown-menu>
          <van-dropdown-item 
            v-model="sortType" 
            :options="sortOptions"
            @change="onSortChange"
          />
          <van-dropdown-item 
            v-model="difficultyFilter" 
            :options="difficultyOptions"
            @change="onFilterChange"
          />
        </van-dropdown-menu>
      </div>

      <!-- 菜谱列表 -->
      <div class="recipes-list">
        <div 
          v-for="recipe in filteredRecipes" 
          :key="recipe.id"
          class="recipe-item"
          @click="goToRecipe(recipe)"
        >
          <van-image
            :src="recipe.image"
            width="80"
            height="80"
            fit="cover"
            round
            class="recipe-image"
          />
          <div class="recipe-content">
            <div class="recipe-name">{{ recipe.name }}</div>
            <div class="recipe-description">{{ recipe.description }}</div>
            <div class="recipe-meta">
              <span class="meta-item">
                <van-icon name="clock-o" size="12" />
                {{ recipe.cookingTime }}
              </span>
              <span class="meta-item">
                <van-icon name="star-o" size="12" />
                {{ recipe.difficulty }}
              </span>
              <span class="meta-item">
                <van-icon name="friends-o" size="12" />
                {{ recipe.servings }}人份
              </span>
            </div>
            <div class="recipe-steps">
              <van-icon name="orders-o" size="12" />
              {{ recipe.steps.length }}个制作步骤
            </div>
          </div>
          <van-icon name="arrow" color="#c8c9cc" />
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredRecipes.length === 0" class="empty-state">
        <van-icon name="search" size="40" color="#c8c9cc" />
        <p>没有找到符合条件的菜谱</p>
        <van-button type="primary" size="small" @click="resetFilters">
          重置筛选条件
        </van-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else class="loading-container">
      <van-loading size="24px" vertical>加载中...</van-loading>
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

const ingredient = ref(null)
const recipes = ref([])
const sortType = ref('recommend')
const difficultyFilter = ref('all')

// 排序选项
const sortOptions = [
  { text: '推荐排序', value: 'recommend' },
  { text: '用时最短', value: 'time' },
  { text: '难度最低', value: 'difficulty' },
  { text: '份量最多', value: 'servings' }
]

// 难度筛选选项
const difficultyOptions = [
  { text: '全部难度', value: 'all' },
  { text: '简单', value: '简单' },
  { text: '中等', value: '中等' },
  { text: '困难', value: '困难' }
]

// 过滤和排序后的菜谱
const filteredRecipes = computed(() => {
  let filtered = [...recipes.value]
  
  // 难度筛选
  if (difficultyFilter.value !== 'all') {
    filtered = filtered.filter(recipe => recipe.difficulty === difficultyFilter.value)
  }
  
  // 排序
  switch (sortType.value) {
    case 'time':
      filtered.sort((a, b) => {
        const timeA = parseInt(a.cookingTime)
        const timeB = parseInt(b.cookingTime)
        return timeA - timeB
      })
      break
    case 'difficulty':
      const difficultyOrder = { '简单': 1, '中等': 2, '困难': 3 }
      filtered.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty])
      break
    case 'servings':
      filtered.sort((a, b) => b.servings - a.servings)
      break
    default:
      // 推荐排序保持原有顺序
      break
  }
  
  return filtered
})

// 获取过期状态颜色
const getExpiryColor = (days) => {
  if (days <= 0) return '#e74c3c'
  if (days <= 1) return '#e74c3c'
  if (days <= 2) return '#f39c12'
  return '#f39c12'
}

// 获取过期状态文本
const getExpiryText = (days) => {
  if (days <= 0) return '已过期，急需处理'
  if (days === 1) return '明天过期，建议今日使用'
  if (days === 2) return '后天过期，尽快使用'
  return `${days}天后过期`
}

// 排序改变
const onSortChange = () => {
  // 排序逻辑在computed中处理
}

// 筛选改变
const onFilterChange = () => {
  // 筛选逻辑在computed中处理
}

// 重置筛选条件
const resetFilters = () => {
  sortType.value = 'recommend'
  difficultyFilter.value = 'all'
}

// 跳转到菜谱详情
const goToRecipe = (recipe) => {
  const cacheKey = `recipe_${recipe.id}`
  
  // 缓存菜谱数据，包含推荐原因
  store.setRouteData(cacheKey, {
    ...recipe,
    recommendedIngredient: ingredient.value,
    allRecommendedRecipes: recipes.value
  })
  
  router.push({
    name: 'RecipeDetail',
    params: { id: recipe.id }
  })
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 页面加载时获取数据
onMounted(() => {
  const ingredientId = route.params.ingredientId
  const cacheKey = `ingredient_recipes_${ingredientId}`
  
  // 从缓存中获取数据
  const cachedData = store.getRouteData(cacheKey)
  
  if (cachedData) {
    ingredient.value = cachedData.ingredient
    recipes.value = cachedData.recipes
  } else {
    // 如果缓存中没有数据，尝试从食材数据中获取
    const ingredientData = store.foodData.find(food => food.id === ingredientId)
    if (ingredientData) {
      ingredient.value = ingredientData
      recipes.value = store.getRecipesByIngredient(ingredientData.name)
    } else {
      showToast('食材不存在')
      router.back()
    }
  }
})
</script>

<style scoped lang="scss">
.ingredient-recipes {
  min-height: 100vh;
  background: var(--bg);
  
  .custom-nav-bar {
    background: var(--card-bg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.page-content {
  padding-bottom: 20px;
}

// 食材信息头部
.ingredient-header {
  background: var(--card-bg);
  margin: 16px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 16px;
  
  .ingredient-image {
    border: 2px solid #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .ingredient-info {
    flex: 1;
    
    .ingredient-name {
      font-size: 18px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 4px;
    }
    
    .expiry-info {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .recipes-count {
      font-size: 12px;
      color: var(--muted);
    }
  }
}

// 筛选栏
.filter-bar {
  margin: 0 16px 16px;
  
  :deep(.van-dropdown-menu) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border-radius: 8px;
    overflow: hidden;
  }
}

// 菜谱列表
.recipes-list {
  margin: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  .recipe-item {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    gap: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
    
    &:active {
      transform: translateY(0);
    }
    
    .recipe-image {
      flex-shrink: 0;
      border: 1px solid #f0f0f0;
    }
    
    .recipe-content {
      flex: 1;
      min-width: 0;
      
      .recipe-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--text);
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .recipe-description {
        font-size: 13px;
        color: var(--muted);
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .recipe-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 4px;
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--muted);
        }
      }
      
      .recipe-steps {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #1989fa;
      }
    }
  }
}

// 空状态
.empty-state {
  text-align: center;
  padding: 60px 20px;
  
  p {
    margin: 16px 0;
    color: var(--muted);
    font-size: 14px;
  }
}

// 加载状态
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

// 响应式设计
@media (max-width: 375px) {
  .ingredient-header {
    margin: 12px;
    padding: 12px;
    gap: 12px;
    
    .ingredient-info .ingredient-name {
      font-size: 16px;
    }
  }
  
  .recipes-list {
    margin: 0 12px;
    
    .recipe-item {
      padding: 12px;
      gap: 12px;
      
      .recipe-content .recipe-name {
        font-size: 15px;
      }
    }
  }
}
</style>