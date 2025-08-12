/**
 * 菜谱相关的组合式API
 */

import { ref, computed } from 'vue'
import { RECIPE_DIFFICULTY } from '@/constants'

// 导入本地图片 - 使用?url后缀确保返回字符串URL
import potatoImg from '@/assets/images/potato.jpeg?url'
import noddlesImg from '@/assets/images/noddles.jpeg?url'
import milkImg from '@/assets/images/milk.svg?url'
import eggsImg from '@/assets/images/eggs.svg?url'
import breadImg from '@/assets/images/bread.svg?url'
import saladImg from '@/assets/images/salad.svg?url'

/**
 * 菜谱管理Hook
 */
export function useRecipe() {
  // 菜谱数据库
  const recipeDatabase = ref([
    {
      id: 'recipe_001',
      name: '番茄意面',
      image: noddlesImg,
      ingredients: ['番茄', '意面', '洋葱', '大蒜', '橄榄油'],
      cookingTime: '20分钟',
      difficulty: RECIPE_DIFFICULTY.EASY,
      servings: 2,
      description: '经典的意式番茄面，酸甜可口，营养丰富',
      steps: [
        '将番茄切块，洋葱和大蒜切碎',
        '热锅下橄榄油，爆香洋葱和大蒜',
        '加入番茄块炒制出汁',
        '煮意面至8分熟，捞起备用',
        '将意面倒入番茄汁中拌匀',
        '调味后装盘即可'
      ],
      tips: '番茄要选择熟透的，这样做出来的面更香甜',
      nutrition: {
        calories: 320,
        protein: 12,
        carbs: 58,
        fat: 8
      }
    },
    {
      id: 'recipe_002',
      name: '醋溜土豆丝',
      image: potatoImg,
      ingredients: ['土豆', '青椒', '醋', '生抽', '盐'],
      cookingTime: '15分钟',
      difficulty: RECIPE_DIFFICULTY.EASY,
      servings: 2,
      description: '爽脆酸甜的家常菜，开胃下饭',
      steps: [
        '土豆去皮切丝，用清水浸泡去淀粉',
        '青椒切丝备用',
        '热锅下油，下土豆丝大火炒制',
        '加入青椒丝继续炒',
        '调入醋、生抽、盐炒匀',
        '出锅装盘即可'
      ],
      tips: '土豆丝要切得细一些，炒制时间不宜过长',
      nutrition: {
        calories: 180,
        protein: 4,
        carbs: 35,
        fat: 3
      }
    },
    {
      id: 'recipe_003',
      name: '香煎鸡蛋',
      image: eggsImg,
      ingredients: ['鸡蛋', '盐', '胡椒粉', '油'],
      cookingTime: '5分钟',
      difficulty: RECIPE_DIFFICULTY.EASY,
      servings: 1,
      description: '简单营养的早餐选择，蛋白质丰富',
      steps: [
        '鸡蛋打散，加入盐和胡椒粉调味',
        '平底锅刷少量油加热',
        '倒入蛋液，小火煎制',
        '一面凝固后翻面继续煎',
        '两面金黄即可出锅'
      ],
      tips: '用小火慢煎，这样鸡蛋更嫩滑',
      nutrition: {
        calories: 155,
        protein: 13,
        carbs: 1,
        fat: 11
      }
    },
    {
      id: 'recipe_004',
      name: '香蕉奶昔',
      image: milkImg,
      ingredients: ['牛奶', '香蕉', '蜂蜜', '冰块'],
      cookingTime: '3分钟',
      difficulty: RECIPE_DIFFICULTY.EASY,
      servings: 1,
      description: '营养丰富的饮品，适合早餐或下午茶',
      steps: [
        '香蕉去皮切段',
        '将香蕉、牛奶、蜂蜜放入搅拌机',
        '加入适量冰块',
        '搅拌至顺滑即可',
        '倒入杯中享用'
      ],
      tips: '香蕉要选择熟透的，口感更甜',
      nutrition: {
        calories: 220,
        protein: 8,
        carbs: 35,
        fat: 6
      }
    },
    {
      id: 'recipe_005',
      name: '火腿三明治',
      image: breadImg,
      ingredients: ['面包', '火腿', '生菜', '番茄', '黄油'],
      cookingTime: '10分钟',
      difficulty: RECIPE_DIFFICULTY.EASY,
      servings: 1,
      description: '营养均衡的快手早餐，方便携带',
      steps: [
        '面包片烤至微黄',
        '在面包上涂抹黄油',
        '铺上生菜叶',
        '放上火腿片和番茄片',
        '盖上另一片面包',
        '对角切开即可'
      ],
      tips: '可以根据喜好添加其他蔬菜',
      nutrition: {
        calories: 280,
        protein: 15,
        carbs: 25,
        fat: 12
      }
    },
    {
      id: 'recipe_006',
      name: '蔬菜沙拉',
      image: saladImg,
      ingredients: ['生菜', '番茄', '黄瓜', '胡萝卜', '沙拉酱'],
      cookingTime: '8分钟',
      difficulty: RECIPE_DIFFICULTY.EASY,
      servings: 2,
      description: '清爽健康的蔬菜沙拉，低卡高纤维',
      steps: [
        '生菜洗净撕成小片',
        '番茄、黄瓜切块',
        '胡萝卜切丝',
        '将所有蔬菜混合',
        '淋上沙拉酱拌匀',
        '装盘即可享用'
      ],
      tips: '蔬菜要洗净沥干水分，保持爽脆口感',
      nutrition: {
        calories: 120,
        protein: 3,
        carbs: 15,
        fat: 6
      }
    },
    {
      id: 'recipe_007',
      name: '番茄鸡蛋汤',
      image: eggsImg,
      ingredients: ['番茄', '鸡蛋', '葱花', '盐', '香油'],
      cookingTime: '12分钟',
      difficulty: RECIPE_DIFFICULTY.EASY,
      servings: 2,
      description: '经典家常汤品，酸甜开胃，营养丰富',
      steps: [
        '番茄去皮切块',
        '鸡蛋打散备用',
        '热锅下油，炒制番茄出汁',
        '加入适量清水煮开',
        '倒入蛋液，快速搅拌成蛋花',
        '调味撒葱花即可'
      ],
      tips: '番茄要充分炒制出汁，汤的味道会更浓郁',
      nutrition: {
        calories: 95,
        protein: 8,
        carbs: 6,
        fat: 5
      }
    },
    {
      id: 'recipe_008',
      name: '土豆炖牛肉',
      image: potatoImg,
      ingredients: ['土豆', '牛肉', '洋葱', '胡萝卜', '生抽', '老抽'],
      cookingTime: '45分钟',
      difficulty: RECIPE_DIFFICULTY.MEDIUM,
      servings: 3,
      description: '营养丰富的炖菜，土豆软糯，牛肉鲜嫩',
      steps: [
        '牛肉切块，焯水去血沫',
        '土豆、胡萝卜切块，洋葱切片',
        '热锅下油，炒制牛肉至变色',
        '加入洋葱炒香',
        '加入生抽、老抽调色',
        '加水没过食材，大火烧开转小火炖30分钟',
        '加入土豆和胡萝卜继续炖15分钟',
        '调味收汁即可'
      ],
      tips: '牛肉要选择适合炖煮的部位，炖制时间要充足',
      nutrition: {
        calories: 285,
        protein: 22,
        carbs: 25,
        fat: 12
      }
    }
  ])

  /**
   * 根据食材获取推荐菜谱
   */
  const getRecipesByIngredient = (ingredientName) => {
    // 首先尝试精确匹配
    let matchedRecipes = recipeDatabase.value.filter(recipe => 
      recipe.ingredients.some(ingredient => 
        ingredient.includes(ingredientName) || ingredientName.includes(ingredient)
      )
    )

    // 如果没有精确匹配，尝试模糊匹配
    if (matchedRecipes.length === 0) {
      const ingredientKeywords = {
        '蔬菜': ['生菜', '白菜', '菠菜', '小白菜'],
        '肉': ['牛肉', '猪肉', '鸡肉'],
        '奶': ['牛奶', '酸奶'],
        '蛋': ['鸡蛋', '鸭蛋'],
        '面': ['面条', '意面'],
        '果': ['苹果', '香蕉', '橙子']
      }

      for (const [key, keywords] of Object.entries(ingredientKeywords)) {
        if (ingredientName.includes(key)) {
          matchedRecipes = recipeDatabase.value.filter(recipe => 
            recipe.ingredients.some(ingredient => 
              keywords.some(keyword => ingredient.includes(keyword))
            )
          )
          if (matchedRecipes.length > 0) break
        }
      }
    }

    // 按照推荐优先级排序（简单菜谱优先）
    return matchedRecipes.sort((a, b) => {
      const difficultyOrder = { 
        [RECIPE_DIFFICULTY.EASY]: 1, 
        [RECIPE_DIFFICULTY.MEDIUM]: 2, 
        [RECIPE_DIFFICULTY.HARD]: 3 
      }
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
    })
  }

  /**
   * 根据ID获取菜谱详情
   */
  const getRecipeById = (recipeId) => {
    return recipeDatabase.value.find(recipe => recipe.id === recipeId)
  }

  /**
   * 获取所有菜谱
   */
  const getAllRecipes = () => {
    return recipeDatabase.value
  }

  /**
   * 根据难度筛选菜谱
   */
  const getRecipesByDifficulty = (difficulty) => {
    return recipeDatabase.value.filter(recipe => recipe.difficulty === difficulty)
  }

  /**
   * 根据烹饪时间筛选菜谱
   */
  const getRecipesByTime = (maxTime) => {
    return recipeDatabase.value.filter(recipe => {
      const time = parseInt(recipe.cookingTime)
      return time <= maxTime
    })
  }

  return {
    // 数据
    recipeDatabase,
    
    // 方法
    getRecipesByIngredient,
    getRecipeById,
    getAllRecipes,
    getRecipesByDifficulty,
    getRecipesByTime
  }
}

/**
 * 智能推荐Hook
 */
export function useSmartRecommendation() {
  const currentIndex = ref(0)
  const expanded = ref(false)

  /**
   * 获取符合条件的食材（已过期或3天内过期）
   */
  const getAvailableIngredients = (foodData, getRecipesByIngredient) => {
    return foodData
      .filter(food => {
        const days = food.expiryDays !== undefined ? food.expiryDays : 
                     require('@/utils').dateUtils.calculateExpiryDays(food.expireDate)
        return days <= 3 // 包含已过期和3天内过期
      })
      .map(food => {
        const allRecipes = getRecipesByIngredient(food.name)
        const recommendedRecipes = allRecipes.slice(0, 3) // 显示前3个推荐菜谱
        
        return {
          ...food,
          recommendedRecipes,
          totalRecipes: allRecipes.length
        }
      })
      .filter(ingredient => ingredient.totalRecipes > 0) // 只显示有菜谱的食材
      .sort((a, b) => a.expiryDays - b.expiryDays) // 按紧急程度排序
  }

  /**
   * 随机切换食材
   */
  const switchToRandomIngredient = (availableIngredients) => {
    if (availableIngredients.length <= 1) return

    let newIndex
    do {
      newIndex = Math.floor(Math.random() * availableIngredients.length)
    } while (newIndex === currentIndex.value)
    
    currentIndex.value = newIndex
    expanded.value = false // 收起展开状态
  }

  /**
   * 切换展开状态
   */
  const toggleExpanded = () => {
    expanded.value = !expanded.value
  }

  /**
   * 重置状态
   */
  const resetState = () => {
    currentIndex.value = 0
    expanded.value = false
  }

  return {
    // 状态
    currentIndex,
    expanded,
    
    // 方法
    getAvailableIngredients,
    switchToRandomIngredient,
    toggleExpanded,
    resetState
  }
}
