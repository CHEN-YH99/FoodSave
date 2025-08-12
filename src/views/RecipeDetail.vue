<template>
  <div class="recipe-detail">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      :title="recipe?.name || '菜谱详情'"
      left-arrow
      @click-left="goBack"
      class="custom-nav-bar"
    >
      <template #right>
        <van-icon 
          name="star-o" 
          size="20" 
          color="#ff9500"
          @click="toggleFavorite"
          class="favorite-icon"
        />
      </template>
    </van-nav-bar>

    <div class="recipe-content" v-if="recipe">
      <!-- 菜谱头部信息 -->
      <div class="recipe-header">
        <div class="recipe-image-container">
          <van-image
            :src="recipe.image"
            fit="cover"
            class="recipe-image"
            :alt="recipe.name"
          />
          <div class="recipe-overlay">
            <div class="recipe-title">{{ recipe.name }}</div>
            <div class="recipe-description">{{ recipe.description }}</div>
          </div>
        </div>
      </div>

      <!-- 推荐原因 -->
      <div class="recommend-reason" v-if="recipe.recommendedIngredient">
        <div class="reason-header">
          <van-icon name="bulb-o" color="#ff9500" />
          <span>推荐原因</span>
        </div>
        <div class="reason-content">
          <van-image
            :src="recipe.recommendedIngredient.image"
            width="40"
            height="40"
            round
            class="ingredient-avatar"
          />
          <div class="reason-text">
            <span class="ingredient-name">{{ recipe.recommendedIngredient.name }}</span>
            <span class="expiry-info" :style="{ color: getExpiryColor(recipe.recommendedIngredient.expiryDays) }">
              {{ recipe.recommendedIngredient.expiryDays <= 0 ? '已过期' : `${recipe.recommendedIngredient.expiryDays}天后过期` }}
            </span>
          </div>
          <span class="reason-desc">，建议尽快食用</span>
        </div>
      </div>

      <!-- 菜谱基本信息 -->
      <div class="recipe-info">
        <div class="info-grid">
          <div class="info-item">
            <van-icon name="clock-o" color="#1989fa" />
            <span class="info-label">用时</span>
            <span class="info-value">{{ recipe.cookingTime }}</span>
          </div>
          <div class="info-item">
            <van-icon name="star-o" color="#ff9500" />
            <span class="info-label">难度</span>
            <span class="info-value">{{ recipe.difficulty }}</span>
          </div>
          <div class="info-item">
            <van-icon name="friends-o" color="#07c160" />
            <span class="info-label">份量</span>
            <span class="info-value">{{ recipe.servings }}人份</span>
          </div>
        </div>
      </div>

      <!-- 所需食材 -->
      <div class="ingredients-section">
        <div class="section-title">
          <van-icon name="shopping-cart-o" color="#1989fa" />
          <span>所需食材</span>
          <span class="ingredients-count">({{ recipe.ingredients.length }}种)</span>
        </div>
        <div class="ingredients-grid">
          <div 
            v-for="(ingredient, index) in recipe.ingredients" 
            :key="index"
            class="ingredient-tag"
            :class="{ 'available': isIngredientAvailable(ingredient) }"
          >
            <van-icon 
              :name="isIngredientAvailable(ingredient) ? 'success' : 'circle'" 
              :color="isIngredientAvailable(ingredient) ? '#07c160' : '#c8c9cc'"
              size="12"
            />
            <span class="ingredient-name">{{ ingredient }}</span>
          </div>
        </div>
      </div>

      <!-- 制作步骤 -->
      <div class="steps-section">
        <div class="section-title">
          <van-icon name="orders-o" color="#ff9500" />
          <span>制作步骤</span>
          <div class="steps-progress">
            <span class="progress-text">{{ completedSteps }}/{{ recipe.steps.length }}</span>
            <van-progress 
              :percentage="(completedSteps / recipe.steps.length) * 100" 
              color="#ff9500"
              track-color="#f5f5f5"
              :show-pivot="false"
              stroke-width="4"
            />
          </div>
        </div>

        <!-- 流程视图 -->
        <div class="steps-flow">
          <div class="steps-container">
            <div 
              v-for="(step, index) in recipe.steps" 
              :key="index"
              class="step-flow-item"
              :class="{ 
                'completed': stepStatus[index], 
                'current': currentStep === index && !stepStatus[index] 
              }"
              @click="toggleStepStatus(index)"
            >
              <div class="step-circle">
                <van-icon 
                  v-if="stepStatus[index]" 
                  name="success" 
                  color="white" 
                />
                <span v-else class="step-number">{{ index + 1 }}</span>
              </div>
              <div class="step-content">{{ step }}</div>
              <div 
                v-if="index < recipe.steps.length - 1" 
                class="step-connector"
                :class="{ 'active': stepStatus[index] }"
              >
                <div class="connector-line"></div>
                <van-icon name="arrow" class="connector-arrow" />
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="steps-actions">
          <van-button 
            type="default" 
            size="small"
            @click="resetAllSteps"
            v-if="completedSteps > 0"
          >
            <van-icon name="replay" />
            重置步骤
          </van-button>
          <van-button 
            type="primary" 
            size="small"
            @click="completeAllSteps"
            v-if="completedSteps < recipe.steps.length"
          >
            <van-icon name="success" />
            全部完成
          </van-button>
        </div>
      </div>

      <!-- 小贴士 -->
      <div class="tips-section" v-if="recipe.tips">
        <div class="section-title">
          <van-icon name="question-o" color="#07c160" />
          <span>小贴士</span>
        </div>
        <div class="tips-content">
          <van-icon name="info-o" color="#1989fa" />
          <span>{{ recipe.tips }}</span>
        </div>
      </div>

      <!-- 营养信息 -->
      <div class="nutrition-section" v-if="recipe.nutrition">
        <div class="section-title">
          <van-icon name="like-o" color="#ff6b6b" />
          <span>营养信息</span>
          <span class="per-serving">（每份）</span>
        </div>
        <div class="nutrition-grid">
          <div class="nutrition-item">
            <div class="nutrition-value">{{ recipe.nutrition.calories }}</div>
            <div class="nutrition-label">卡路里</div>
          </div>
          <div class="nutrition-item">
            <div class="nutrition-value">{{ recipe.nutrition.protein }}g</div>
            <div class="nutrition-label">蛋白质</div>
          </div>
          <div class="nutrition-item">
            <div class="nutrition-value">{{ recipe.nutrition.carbs }}g</div>
            <div class="nutrition-label">碳水</div>
          </div>
          <div class="nutrition-item">
            <div class="nutrition-value">{{ recipe.nutrition.fat }}g</div>
            <div class="nutrition-label">脂肪</div>
          </div>
        </div>
      </div>

      <!-- 其他推荐菜谱 -->
      <div class="other-recipes" v-if="otherRecipes.length > 0">
        <div class="section-title">
          <van-icon name="fire-o" color="#ff9500" />
          <span>其他推荐</span>
        </div>
        <div class="other-recipes-list">
          <div 
            v-for="otherRecipe in otherRecipes" 
            :key="otherRecipe.id"
            class="other-recipe-item"
            @click="switchRecipe(otherRecipe.id)"
          >
            <van-image
              :src="otherRecipe.image"
              width="60"
              height="60"
              fit="cover"
              round
              class="other-recipe-image"
            />
            <div class="other-recipe-info">
              <div class="other-recipe-name">{{ otherRecipe.name }}</div>
              <div class="other-recipe-time">{{ otherRecipe.cookingTime }}</div>
            </div>
            <van-icon name="arrow" color="#c8c9cc" />
          </div>
        </div>
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

const recipe = ref(null)
const stepStatus = ref([]) // 步骤完成状态
const currentStep = ref(0) // 当前步骤
const timers = ref({}) // 计时器

// 计算其他推荐菜谱（排除当前菜谱）
const otherRecipes = computed(() => {
  if (!recipe.value || !recipe.value.allRecommendedRecipes) {
    return []
  }
  return recipe.value.allRecommendedRecipes.filter(r => r.id !== recipe.value.id)
})

// 计算已完成步骤数
const completedSteps = computed(() => {
  return stepStatus.value.filter(status => status).length
})

// 初始化步骤状态
const initializeStepStatus = () => {
  if (recipe.value && recipe.value.steps) {
    stepStatus.value = new Array(recipe.value.steps.length).fill(false)
    currentStep.value = 0
  }
}

// 检查食材是否可用
const isIngredientAvailable = (ingredientName) => {
  return store.foodData.some(food => 
    food.name.includes(ingredientName) || ingredientName.includes(food.name)
  )
}

// 获取过期状态颜色
const getExpiryColor = (days) => {
  if (days <= 0) return '#e74c3c' // 已过期
  if (days <= 1) return '#e74c3c' // 1天内过期
  if (days <= 3) return '#f39c12' // 3天内过期
  return '#27ae60' // 正常
}

// 切换到其他菜谱
const switchRecipe = (recipeId) => {
  const newRecipe = store.getRecipeById(recipeId)
  if (newRecipe) {
    // 更新缓存数据
    const cacheKey = `recipe_${recipeId}`
    store.setRouteData(cacheKey, {
      ...newRecipe,
      recommendedIngredient: recipe.value.recommendedIngredient,
      allRecommendedRecipes: recipe.value.allRecommendedRecipes
    })
    
    // 更新当前菜谱数据
    recipe.value = store.getRouteData(cacheKey)
    
    // 更新URL
    router.replace({
      name: 'RecipeDetail',
      params: { id: recipeId }
    })
  }
}

// 收藏菜谱
const toggleFavorite = () => {
  showToast('收藏功能开发中...')
}

// 切换步骤完成状态
const toggleStepStatus = (index) => {
  stepStatus.value[index] = !stepStatus.value[index]
  
  // 更新当前步骤
  if (stepStatus.value[index]) {
    // 如果完成了当前步骤，移动到下一个未完成的步骤
    const nextIncompleteStep = stepStatus.value.findIndex((status, i) => i > index && !status)
    currentStep.value = nextIncompleteStep !== -1 ? nextIncompleteStep : recipe.value.steps.length
  } else {
    // 如果取消完成，设置当前步骤为该步骤
    currentStep.value = index
  }
}

// 重置所有步骤
const resetAllSteps = () => {
  stepStatus.value = new Array(recipe.value.steps.length).fill(false)
  currentStep.value = 0
  // 清除所有计时器
  Object.values(timers.value).forEach(timer => clearInterval(timer))
  timers.value = {}
  showToast('已重置所有步骤')
}

// 完成所有步骤
const completeAllSteps = () => {
  stepStatus.value = new Array(recipe.value.steps.length).fill(true)
  currentStep.value = recipe.value.steps.length
  showToast('恭喜完成所有步骤！')
}

// 开始计时
const startTimer = (stepIndex) => {
  const timeStr = recipe.value.stepTimes[stepIndex]
  const minutes = parseInt(timeStr)
  
  if (isNaN(minutes)) {
    showToast('无效的时间格式')
    return
  }
  
  const seconds = minutes * 60
  let remainingTime = seconds
  
  // 清除已存在的计时器
  if (timers.value[stepIndex]) {
    clearInterval(timers.value[stepIndex])
  }
  
  showToast(`开始计时 ${minutes} 分钟`)
  
  timers.value[stepIndex] = setInterval(() => {
    remainingTime--
    
    if (remainingTime <= 0) {
      clearInterval(timers.value[stepIndex])
      delete timers.value[stepIndex]
      showToast(`步骤 ${stepIndex + 1} 计时完成！`)
      
      // 可选：自动标记步骤为完成
      // toggleStepStatus(stepIndex)
    }
  }, 1000)
}

// 返回上一页
const goBack = () => {
  // 清除所有计时器
  Object.values(timers.value).forEach(timer => clearInterval(timer))
  router.back()
}

// 页面加载时获取菜谱数据
onMounted(() => {
  const recipeId = route.params.id
  const cacheKey = `recipe_${recipeId}`
  
  // 从缓存中获取菜谱数据
  const cachedData = store.getRouteData(cacheKey)
  
  if (cachedData) {
    recipe.value = cachedData
    initializeStepStatus()
  } else {
    // 如果缓存中没有数据，尝试直接从数据库获取
    const recipeData = store.getRecipeById(recipeId)
    if (recipeData) {
      recipe.value = recipeData
      initializeStepStatus()
    } else {
      showToast('菜谱不存在')
      router.back()
    }
  }
})
</script>

<style scoped lang="scss">
.recipe-detail {
  min-height: 100vh;
  background: #f5f5f5;
  
  .custom-nav-bar {
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    .favorite-icon {
      cursor: pointer;
      transition: transform 0.2s ease;
      
      &:active {
        transform: scale(0.9);
      }
    }
  }
}

.recipe-content {
  padding-bottom: 20px;
}

// 菜谱头部
.recipe-header {
  position: relative;
  
  .recipe-image-container {
    position: relative;
    height: 250px;
    overflow: hidden;
    
    .recipe-image {
      width: 100%;
      height: 100%;
    }
    
    .recipe-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
      padding: 30px 20px 20px;
      color: white;
      
      .recipe-title {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      
      .recipe-description {
        font-size: 14px;
        opacity: 0.9;
        line-height: 1.4;
      }
    }
  }
}

// 推荐原因
.recommend-reason {
  background: white;
  margin: 16px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  .reason-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 600;
    color: #323233;
  }
  
  .reason-content {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .ingredient-avatar {
      border: 2px solid #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .reason-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
      
      .ingredient-name {
        font-size: 16px;
        font-weight: 600;
        color: #323233;
      }
      
      .expiry-info {
        font-size: 12px;
        font-weight: 500;
      }
    }
    
    .reason-desc {
      font-size: 14px;
      color: #646566;
    }
  }
}

// 菜谱基本信息
.recipe-info {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    
    .info-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      
      .info-label {
        font-size: 12px;
        color: #969799;
      }
      
      .info-value {
        font-size: 16px;
        font-weight: 600;
        color: #323233;
      }
    }
  }
}

// 通用区块样式
.ingredients-section,
.steps-section,
.tips-section,
.nutrition-section,
.other-recipes {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 600;
    color: #323233;
    
    .per-serving {
      font-size: 12px;
      color: #969799;
      font-weight: 400;
    }
  }
}

// 食材网格布局
.ingredients-count {
  font-size: 12px;
  color: #969799;
  font-weight: 400;
  margin-left: 4px;
}

.ingredients-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  
  .ingredient-tag {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: #f7f8fa;
    border-radius: 16px;
    font-size: 13px;
    color: #323233;
    border: 1px solid transparent;
    transition: all 0.2s ease;
    
    &.available {
      background: #f0f9ff;
      border-color: #e1f5fe;
      color: #1989fa;
      
      .ingredient-name {
        font-weight: 500;
      }
    }
    
    .ingredient-name {
      line-height: 1.2;
    }
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }
}

// 步骤进度
.steps-progress {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 80px;
  
  .progress-text {
    font-size: 12px;
    color: #969799;
    font-weight: 400;
  }
}

// 流程视图样式
.steps-flow {
  .steps-container {
    display: flex;
    overflow-x: auto;
    padding: 16px 0;
    gap: 8px;
    
    &::-webkit-scrollbar {
      height: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
      
      &:hover {
        background: #a8a8a8;
      }
    }
    
    .step-flow-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 120px;
      max-width: 140px;
      position: relative;
      flex-shrink: 0;
      cursor: pointer;
      
      &.current .step-circle {
        background: linear-gradient(135deg, #1989fa 0%, #1677ff 100%);
        box-shadow: 0 4px 16px rgba(25, 137, 250, 0.4);
        animation: pulse-ring 2s infinite;
      }
      
      &.completed .step-circle {
        background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
        box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
      }
      
      .step-circle {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #d9d9d9 0%, #bfbfbf 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
        transition: all 0.3s ease;
        position: relative;
        
        &:hover {
          transform: scale(1.1);
        }
        
        &:active {
          transform: scale(0.95);
        }
        
        .step-number {
          color: white;
          font-size: 16px;
          font-weight: 700;
        }
      }
      
      .step-content {
        text-align: center;
        font-size: 12px;
        line-height: 1.4;
        color: #323233;
        padding: 0 4px;
        word-break: break-word;
      }
      
      .step-connector {
        position: absolute;
        right: -20px;
        top: 16px;
        z-index: 1;
        
        .connector-line {
          width: 16px;
          height: 2px;
          background: #d9d9d9;
          transition: background 0.3s ease;
        }
        
        .connector-arrow {
          position: absolute;
          right: -4px;
          top: -7px;
          color: #d9d9d9;
          font-size: 16px;
          transform: rotate(-90deg);
          transition: color 0.3s ease;
        }
        
        &.active {
          .connector-line {
            background: #52c41a;
          }
          
          .connector-arrow {
            color: #52c41a;
          }
        }
      }
    }
  }
}

// 步骤操作按钮
.steps-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  
  .van-button {
    .van-icon {
      margin-right: 4px;
    }
  }
}

// 小贴士
.tips-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
  border-left: 4px solid #1989fa;
  
  span {
    font-size: 14px;
    line-height: 1.5;
    color: #323233;
  }
}

// 营养信息
.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  
  .nutrition-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    
    .nutrition-value {
      font-size: 18px;
      font-weight: 700;
      color: #ff6b6b;
    }
    
    .nutrition-label {
      font-size: 12px;
      color: #969799;
    }
  }
}

// 其他推荐菜谱
.other-recipes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  .other-recipe-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f7f8fa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: #e8f3ff;
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0);
    }
    
    .other-recipe-image {
      border: 2px solid #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .other-recipe-info {
      flex: 1;
      
      .other-recipe-name {
        font-size: 16px;
        font-weight: 600;
        color: #323233;
        margin-bottom: 4px;
      }
      
      .other-recipe-time {
        font-size: 12px;
        color: #969799;
      }
    }
  }
}

// 加载状态
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

// 动画定义
@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.1;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

// 步骤完成动画
@keyframes step-complete {
  0% {
    background: linear-gradient(135deg, #1989fa 0%, #1677ff 100%);
  }
  50% {
    background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
    transform: scale(1.2);
  }
  100% {
    background: linear-gradient(135deg, #1989fa 0%, #1677ff 100%);
    transform: scale(1);
  }
}

// 响应式设计
@media (max-width: 375px) {
  .recipe-info .info-grid {
    gap: 12px;
  }
  
  .nutrition-grid {
    gap: 12px;
    
    .nutrition-item .nutrition-value {
      font-size: 16px;
    }
  }
  
  // 小屏幕上的步骤流程图优化
  .steps-flow .steps-container {
    .step-flow-item {
      min-width: 100px;
      max-width: 120px;
      
      .step-circle {
        width: 36px;
        height: 36px;
        
        .step-number {
          font-size: 14px;
        }
      }
      
      .step-content {
        font-size: 11px;
      }
      
      .step-arrow {
        right: -16px;
        top: 14px;
        
        .van-icon {
          font-size: 14px;
        }
      }
    }
  }
}
</style>