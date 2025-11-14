import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { showToast, showDialog } from 'vant'
import axios from 'axios'

// 导入企业级模块
import { STORAGE_KEYS, EXPIRY_THRESHOLDS, DEFAULT_CONFIG, CATEGORY_MAPPING } from '@/constants'
import { foodService } from '@/services/api'
import { dateUtils, storageUtils, foodUtils } from '@/utils'

// 导入本地图片 - 使用?url后缀确保返回字符串URL
import potatoImg from '@/assets/images/potato.jpeg?url'
import noddlesImg from '@/assets/images/noddles.jpeg?url'
import milkImg from '@/assets/images/milk.svg?url'
import eggsImg from '@/assets/images/eggs.svg?url'
import breadImg from '@/assets/images/bread.svg?url'
import saladImg from '@/assets/images/salad.svg?url'

// localStorage工具函数
const TAKEN_OUT_FOODS_KEY = 'takenOutFoods'

// 从localStorage加载已取出食材数据
function loadTakenOutFoodsFromStorage() {
  try {
    const stored = localStorage.getItem(TAKEN_OUT_FOODS_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      // 清理7天前的记录
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      return data.filter(item => {
        const itemDate = new Date(item.takenOutDate)
        return itemDate >= sevenDaysAgo
      })
    }
  } catch (error) {
    // 加载已取出食材数据失败
  }
  return []
}

// 保存已取出食材数据到localStorage
function saveTakenOutFoodsToStorage(data) {
  try {
    localStorage.setItem(TAKEN_OUT_FOODS_KEY, JSON.stringify(data))
  } catch (error) {
    // 保存已取出食材数据失败
  }
}

export const useIndexStore = defineStore('index', () => {
  // 状态数据
  const foodData = ref([])
  const loading = ref(false)
  const total = ref(100) // 总库存

  // 路由数据缓存 - 用于安全传递数据，避免敏感信息暴露在URL中
  const routeDataCache = ref(new Map())

  // 监听食材数据更新事件
  const setupEventListeners = () => {
    window.addEventListener('foodDataUpdated', (event) => {
      // 当接收到食材数据更新通知时，重新加载数据
      loadFoodData()
    })
  }

  // 在store初始化时设置事件监听器
  setupEventListeners()

  // 分类展开/收起状态
  const showAllCategories = ref(false)
  const maxVisibleCategories = 6 // 最多显示6个分类

  // 最近添加列表展开/收起状态
  const showAllRecentlyAdded = ref(false)

  // 已取出食材列表 - 保留最近7天的记录，从localStorage中恢复数据
  const takenOutFoods = ref(loadTakenOutFoodsFromStorage())

  // 初始化时清理过期记录
  const initializeTakenOutFoods = () => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const filteredData = takenOutFoods.value.filter(item => {
      const itemDate = new Date(item.takenOutDate)
      return itemDate >= sevenDaysAgo
    })

    if (filteredData.length !== takenOutFoods.value.length) {
      takenOutFoods.value = filteredData
      saveTakenOutFoodsToStorage(takenOutFoods.value)
    }
  }

  // 立即执行初始化
  initializeTakenOutFoods()

  // 从localStorage加载已取出记录
  const loadTakenOutFoods = () => {
    takenOutFoods.value = loadTakenOutFoodsFromStorage()
  }

  // 保存已取出记录到localStorage
  const saveTakenOutFoods = () => {
    saveTakenOutFoodsToStorage(takenOutFoods.value)
  }

  // 清理过期的已取出记录
  const cleanExpiredTakenOutFoods = () => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const originalLength = takenOutFoods.value.length
    takenOutFoods.value = takenOutFoods.value.filter(item => {
      const itemDate = new Date(item.takenOutDate)
      return itemDate >= sevenDaysAgo
    })

    // 如果有记录被清理，更新localStorage
    if (takenOutFoods.value.length !== originalLength) {
      saveTakenOutFoods()
    }
  }

  // 清空所有已取出记录
  const clearAllTakenOutFoods = () => {
    takenOutFoods.value = []
    saveTakenOutFoodsToStorage([])
    showToast({
      message: '已清空所有取出记录',
      type: 'success'
    })
  }



  // 食物分类数据
  const foodCategories = ref([
    {
      id: 1,
      name: '蔬菜类',
      icon: 'shop-o',
      bgColor: '#e8f5e8',
      iconColor: '#52c41a'
    },
    {
      id: 2,
      name: '肉类',
      icon: 'shop-collect-o',
      bgColor: '#e6f7ff',
      iconColor: '#1890ff'
    },
    {
      id: 3,
      name: '饮品',
      icon: 'newspaper-o',
      bgColor: '#fff7e6',
      iconColor: '#fa8c16'
    },
    {
      id: 4,
      name: '主食',
      icon: 'debit-pay',
      bgColor: '#FFE6D9',
      iconColor: '#eb2f96'
    },
    {
      id: 5,
      name: '罐头',
      icon: 'hotel-o',
      bgColor: '#D9FFFF',
      iconColor: '#1E90FF'
    },
    {
      id: 6,
      name: '调料',
      icon: 'desktop-o',
      bgColor: '#EBD6D6',
      iconColor: '#B87070'
    },
    {
      id: 7,
      name: '海鲜',
      icon: 'fire-o',
      bgColor: '#E6F4FF',
      iconColor: '#1677FF'
    },
    {
      id: 8,
      name: '熟食',
      icon: 'hot-o',
      bgColor: '#FFF2E8',
      iconColor: '#FA8C16'
    },
    {
      id: 9,
      name: '水果',
      icon: 'flower-o',
      bgColor: '#FFF2E8',
      iconColor: '#FA8C16'
    },
    {
      id: 10,
      name: '其他',
      icon: 'points',
      bgColor: '#FFF2E8',
      iconColor: '#FA8C16'
    }
  ])

  // 计算属性
  // 计算已过期的食材数量
  const expired = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return foodData.value.filter(item => {
      const expireDate = new Date(item.expireDate)
      expireDate.setHours(0, 0, 0, 0)
      const diffTime = expireDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays < 0
    }).length
  })

  // 计算即将过期的食材数量（3天内过期）
  const outdate = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return foodData.value.filter(item => {
      const expireDate = new Date(item.expireDate)
      expireDate.setHours(0, 0, 0, 0)
      const diffTime = expireDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 3 && diffDays >= 0
    }).length
  })

  // 计算库存不足的食材数量
  const lowstock = computed(() => {
    return total.value - foodData.value.length
  })

  // 获取即将过期的食材用于智能推荐
  const getExpiringIngredient = computed(() => {
    const expiringItems = foodData.value.filter(item => {
      const days = calculateExpiryDays(item.expireDate)
      return days <= 3 && days >= 0
    }).sort((a, b) => calculateExpiryDays(a.expireDate) - calculateExpiryDays(b.expireDate))

    if (expiringItems.length > 0) {
      const item = expiringItems[0]
      return {
        name: item.name,
        image: getItemImage(item.name, item.category),
        expiryDays: calculateExpiryDays(item.expireDate)
      }
    }

    return {
      name: '番茄',
      image: potatoImg,
      expiryDays: 2
    }
  })

  // 菜谱数据库
  const recipeDatabase = ref([
    {
      id: 'recipe_001',
      name: '番茄意面',
      image: noddlesImg,
      ingredients: ['番茄', '意面', '洋葱', '大蒜', '橄榄油'],
      cookingTime: '20分钟',
      difficulty: '简单',
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
      difficulty: '简单',
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
      difficulty: '简单',
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
      difficulty: '简单',
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
      difficulty: '简单',
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
      difficulty: '简单',
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
      difficulty: '简单',
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
      difficulty: '中等',
      servings: 3,
      description: '营养丰富的炖菜，土豆软糯，牛肉鲜嫩',
      steps: [
        '牛肉切块，焯水去血沫',
        '土豆、胡萝卜切块，洋葱切片',
        '热锅下油，炒制牛肉至变色',
        '加入洋葱炒香',
        '加入生抽、老抽调色',
        '加水没过食材,大火烧开转小火炖30分钟',
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

  // 根据食材获取推荐菜谱
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
      const difficultyOrder = { '简单': 1, '中等': 2, '困难': 3 }
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
    })
  }

  // 推荐数据 - 基于即将过期的食材
  const recommendData = computed(() => {
    const ingredient = getExpiringIngredient.value
    
    // 根据食材获取推荐菜谱
    const recommendedRecipes = getRecipesByIngredient(ingredient.name)
    
    // 如果找到推荐菜谱，使用第一个；否则使用默认菜谱
    let recipe = { name: '意面', image: noddlesImg, id: 'recipe_001' }
    if (recommendedRecipes.length > 0) {
      const selectedRecipe = recommendedRecipes[0]
      recipe = {
        id: selectedRecipe.id,
        name: selectedRecipe.name,
        image: selectedRecipe.image
      }
    }

    return {
      ingredient,
      recipe,
      allRecommendedRecipes: recommendedRecipes // 返回所有推荐菜谱
    }
  })

  // 根据ID获取菜谱详情
  const getRecipeById = (recipeId) => {
    return recipeDatabase.value.find(recipe => recipe.id === recipeId)
  }

  // 根据食材名称获取相关菜谱（导出版本）
  const getRecipesByIngredientExport = (ingredientName) => {
    return getRecipesByIngredient(ingredientName)
  }

  // 根据食品类别获取对应的分类ID
  const getCategoryIdByFoodCategory = (foodCategory) => {
    // 创建食品类别到分类ID的映射
    const categoryMapping = {
      '蔬菜': 1,
      '果蔬类': 1,
      '生鲜': 1,
      '肉类': 2,
      '禽肉': 2,
      '饮品': 3,
      '乳制品': 3,
      '奶制品': 3,
      '乳品': 3,
      '饮料': 3,
      '主食': 4,
      '谷物': 4,
      '粮食': 4,
      '米面': 4,
      '蛋类': 4,
      '罐头': 5,
      '罐装食品': 5,
      '调料': 6,
      '调味品': 6,
      '佐料': 6,
      '香料': 6,
      '海鲜': 7,
      '水产': 7,
      '海产品': 7,
      '熟食': 8,
      '卤菜': 8,
      '熟制品': 8,
      '水果': 9,
      '其他': 10
    }

    return categoryMapping[foodCategory] || 10 // 默认返回"其他"分类
  }

  // 检查食材是否已被取出
  const isFoodTakenOut = (foodId) => {
    return takenOutFoods.value.some(takenOutItem => {
      const takenOutId = takenOutItem._id || takenOutItem.id
      return takenOutId === foodId
    })
  }

  // 获取最近7天的所有食材（用于内部过滤）
  const getAllRecentSevenDays = () => {
    // 计算7天前的日期
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // 合并当前食材和已取出食材的列表
    const allItems = []

    // 1. 添加当前存在的食材
    if (foodData.value && foodData.value.length > 0) {
      const currentFoods = foodData.value.filter(item => {
        // 检查是否有有效的创建时间
        if (!item.createdAt && !item.updatedAt) {
          return false
        }

        // 优先使用createdAt，如果没有则使用updatedAt
        const timeField = item.createdAt || item.updatedAt
        const createdDate = new Date(timeField)

        // 检查日期是否有效
        if (isNaN(createdDate.getTime())) {
          return false
        }

        createdDate.setHours(0, 0, 0, 0)
        return createdDate >= sevenDaysAgo
      }).map(item => {
        const itemId = item._id || item.id
        return {
          id: itemId,
          name: item.name,
          image: getItemImage(item.name, item.category),
          expiryDays: calculateExpiryDays(item.expireDate),
          category: item.category,
          expireDate: item.expireDate,
          storageLocation: item.storageLocation,
          createdAt: item.createdAt,
          addedDate: new Date(item.createdAt || item.updatedAt).toLocaleDateString('zh-CN'),
          isTakenOut: false // 当前食材未取出
        }
      })

      allItems.push(...currentFoods)
    }

    // 2. 添加已取出的食材（只包含最近7天添加的）
    if (takenOutFoods.value && takenOutFoods.value.length > 0) {
      const recentTakenOutFoods = takenOutFoods.value.filter(item => {
        // 检查是否有有效的创建时间
        if (!item.createdAt && !item.updatedAt) {
          return false
        }

        // 优先使用createdAt，如果没有则使用updatedAt
        const timeField = item.createdAt || item.updatedAt
        const createdDate = new Date(timeField)

        // 检查日期是否有效
        if (isNaN(createdDate.getTime())) {
          return false
        }

        createdDate.setHours(0, 0, 0, 0)
        return createdDate >= sevenDaysAgo
      }).map(item => {
        const itemId = item._id || item.id
        return {
          id: itemId,
          name: item.name,
          image: item.image || getItemImage(item.name, item.category), // 优先使用已保存的图片
          expiryDays: calculateExpiryDays(item.expireDate),
          category: item.category,
          expireDate: item.expireDate,
          storageLocation: item.storageLocation,
          createdAt: item.createdAt,
          addedDate: new Date(item.createdAt || item.updatedAt).toLocaleDateString('zh-CN'),
          isTakenOut: true // 已取出的食材
        }
      })

      allItems.push(...recentTakenOutFoods)
    }

    // 3. 去重（防止同一食材既在当前列表又在已取出列表中）
    const uniqueItems = []
    const seenIds = new Set()

    for (const item of allItems) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id)
        uniqueItems.push(item)
      } else {
        // 如果ID重复，优先保留已取出的版本
        const existingIndex = uniqueItems.findIndex(existing => existing.id === item.id)
        if (existingIndex !== -1 && item.isTakenOut) {
          uniqueItems[existingIndex] = item
        }
      }
    }

    // 4. 按添加时间排序，最新的在前面
    return uniqueItems.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.updatedAt)
      const timeB = new Date(b.createdAt || b.updatedAt)
      return timeB - timeA
    })
  }

  // 获取最近添加的食材（根据展开状态显示不同数量）
  const recentlyAdded = computed(() => {
    const allRecentData = getAllRecentSevenDays()

    if (allRecentData.length === 0) {
      return []
    }

    // 如果展开，显示所有；否则只显示前4个
    return showAllRecentlyAdded.value ? allRecentData : allRecentData.slice(0, 4)
  })

  // 获取所有最近7天的食材数量
  const allRecentSevenDaysCount = computed(() => {
    return getAllRecentSevenDays().length
  })

  // 工具函数
  // 计算食材距离过期的天数
  const calculateExpiryDays = (expireDate) => {
    const today = new Date()
    const expire = new Date(expireDate)
    const diffTime = expire - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // 根据食材名称和分类获取对应图片
  const getItemImage = (name, category) => {
    // 根据食材名称匹配图片
    const imageMap = {
      '牛奶': milkImg,
      '鸡蛋': eggsImg,
      '面包': breadImg,
      '蔬菜': saladImg,
      '沙拉': saladImg,
      '土豆': potatoImg,
      '面条': noddlesImg
    }

    // 先尝试精确匹配
    for (const [key, img] of Object.entries(imageMap)) {
      if (name.includes(key)) {
        return img
      }
    }

    // 根据分类匹配默认图片
    const categoryImageMap = {
      '乳制品': milkImg,
      '蛋类': eggsImg,
      '主食': breadImg,
      '生鲜': saladImg,
      '蔬菜': saladImg,
      '肉类': potatoImg
    }

    return categoryImageMap[category] || saladImg // 默认图片
  }

  // 获取过期状态颜色
  const getExpiryColor = (days) => {
    if (days <= 0) return '#e74c3c' // 已过期
    if (days <= 1) return '#e74c3c' // 1天内过期
    if (days <= 3) return '#f39c12' // 3天内过期
    return '#27ae60' // 正常
  }

  // 根据分类ID获取该分类下的食品列表
  const getFoodsByCategory = (categoryId) => {
    const category = foodCategories.value.find(cat => cat.id == categoryId)
    if (!category) return []

    // 首先尝试直接通过数据库中的category字段匹配
    let filteredFoods = foodData.value.filter(item => {
      // 直接匹配category字段
      if (item.category === category.name) return true

      // 处理一些常见的分类名称变体
      const categoryVariants = {
        '果蔬类': ['果蔬类', '水果', '果蔬'],
        '蔬菜类': ['蔬菜类','蔬菜'],
        '肉类': ['肉类', '肉', '禽肉'],
        '饮品': ['饮品', '乳制品', '奶制品', '乳品', '饮料'],
        '主食': ['主食', '谷物', '粮食', '米面', '蛋类'],
        '罐头': ['罐头', '罐装食品'],
        '调料': ['调料', '调味品', '佐料', '香料'],
        '海鲜': ['海鲜', '水产', '海产品','生鲜'],
        '熟食': ['熟食', '卤菜', '熟制品']
      }

      const variants = categoryVariants[category.name] || [category.name]
      return variants.some(variant => item.category === variant)
    })

    // 如果直接匹配没有结果，使用关键词匹配作为备选方案
    if (filteredFoods.length === 0) {
      const categoryKeywords = {
        1: ['蔬菜', '水果', '番茄', '土豆', '白菜', '萝卜', '苹果', '香蕉'], // 果蔬类
        2: ['肉', '牛肉', '猪肉', '鸡肉', '鱼', '虾'], // 肉类
        3: ['牛奶', '酸奶', '奶酪', '黄油', '饮品', '饮料'], // 饮品
        4: ['米', '面', '面包', '面条', '馒头', '包子', '蛋', '鸡蛋', '鸭蛋', '鹌鹑蛋'], // 主食（包含蛋类）
        5: ['罐头', '午餐肉', '鱼罐头'], // 罐头
        6: ['盐', '糖', '醋', '酱油', '料酒', '胡椒'], // 调料
        7: ['海鲜', '虾', '蟹', '鱼', '贝', '海带', '紫菜', '鲍鱼', '扇贝'], // 海鲜
        8: ['熟食', '卤菜', '烧鸡', '烤鸭', '火腿', '香肠', '腊肉'] // 熟食
      }

      const keywords = categoryKeywords[categoryId] || []
      filteredFoods = foodData.value.filter(item => {
        return keywords.some(keyword => item.name.includes(keyword))
      })
    }

    return filteredFoods.map(item => ({
      ...item,
      id: item._id || item.id,
      image: getItemImage(item.name, item.category || category.name),
      expiryDays: calculateExpiryDays(item.expireDate)
    }))
  }

  // 获取分类描述
  const getCategoryDescription = (categoryName) => {
    const descriptions = {
      '果蔬类': '新鲜的水果，富含维生素和纤维，建议冷藏保存。',
      '蔬菜类': '新鲜的蔬菜，富含维生素和纤维，建议放蔬菜室冷藏保存。',
      '肉类': '各种肉类食品，富含蛋白质，需要冷藏或冷冻保存。',
      '乳制品': '牛奶、酸奶等乳制品，需要冷藏保存，注意保质期。',
      '主食': '米面等主食类，提供碳水化合物，常温干燥保存。',
      '罐头': '各种罐装食品，保质期较长，常温保存即可。',
      '调料': '各种调味品，增加食物风味，密封保存。'
    }
    return descriptions[categoryName] || '各种食材，请注意保存方式和保质期。'
  }

  // 获取数据库中实际存在的分类
  const getActualCategories = computed(() => {
    const categories = [...new Set(foodData.value.map(item => item.category).filter(Boolean))]
    return categories.sort()
  })

  // 显示的分类列表（根据展开状态决定）
  const visibleCategories = computed(() => {
    if (showAllCategories.value) {
      return foodCategories.value
    }
    return foodCategories.value.slice(0, maxVisibleCategories)
  })

  // 是否需要显示"更多"按钮
  const shouldShowMoreButton = computed(() => {
    return foodCategories.value.length > maxVisibleCategories
  })

  // 切换分类展开/收起状态
  const toggleCategoriesExpansion = () => {
    showAllCategories.value = !showAllCategories.value
  }

  // 调试函数：获取指定分类的所有食品
  const debugCategoryFoods = (categoryId) => {
    const category = foodCategories.value.find(cat => cat.id == categoryId)
    if (!category) {
      return
    }

    // 直接匹配
    const directMatch = foodData.value.filter(item => item.category === category.name)

    // 变体匹配
    const categoryVariants = {
      '果蔬类': ['果蔬类', '水果', '果蔬'],
      '蔬菜类': ['蔬菜类','蔬菜'],
      '肉类': ['肉类', '肉', '禽肉'],
      '饮品': ['饮品', '乳制品', '奶制品', '乳品', '饮料'],
      '主食': ['主食', '谷物', '粮食', '米面', '蛋类'],
      '罐头': ['罐头', '罐装食品'],
      '调料': ['调料', '调味品', '佐料', '香料'],
      '海鲜': ['海鲜', '水产', '海产品','生鲜'],
      '熟食': ['熟食', '卤菜', '熟制品']
    }

    const variants = categoryVariants[category.name] || [category.name]
    const variantMatch = foodData.value.filter(item =>
      variants.some(variant => item.category === variant)
    )

    // 最终结果
    const finalResult = getFoodsByCategory(categoryId)
  }

  // 异步操作
  // 从数据库加载食材数据
  const loadFoodData = async () => {
    try {
      loading.value = true
      const response = await foodService.getAllFoods()

      if (response && response.length > 0) {
        foodData.value = response.map(item => ({
          ...item,
          id: item._id || item.id
        }))
      } else {
        foodData.value = []
      }
    } catch (error) {
      console.error('加载食材数据失败:', error)
      foodData.value = []
    } finally {
      loading.value = false
    }
  }

  // 根据ID从数据库获取单个食品的详细信息
  const getFoodById = async (foodId) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/food/${foodId}`)

      if (response.data) {
        const food = response.data

        // 返回格式化的食品数据
        const formattedData = {
          id: food._id || food.id,
          name: food.name,
          category: food.category || '未知分类',
          expireDate: food.expireDate,
          storageLocation: food.storageLocation || '冰箱',
          createdAt: food.createdAt ? new Date(food.createdAt).toLocaleDateString('zh-CN') : '未知',
          updatedAt: food.updatedAt ? new Date(food.updatedAt).toLocaleDateString('zh-CN') : '未知',
          synonyms: food.synonyms || [],
          description: food.description || '',
          nutritionInfo: food.nutritionInfo || {},
          image: getItemImage(food.name, food.category),
          expiryDays: calculateExpiryDays(food.expireDate)
        }

        return formattedData
      }

      return null
    } catch (error) {

      // 根据错误类型显示不同的提示信息
      let errorMessage = '获取食品详情失败'
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = '食品不存在或已被删除'
        } else if (error.response.status === 400) {
          errorMessage = '无效的食品ID'
        } else if (error.response.status === 500) {
          errorMessage = '服务器错误，请稍后重试'
        }
      } else if (error.request) {
        errorMessage = '网络连接失败，请检查网络'
      }

      showToast({
        message: errorMessage,
        type: 'fail'
      })

      throw error
    }
  }

  // 事件处理函数
  // 分类点击处理
  const handleCategoryClick = (category, router) => {

    // 将分类数据存储到缓存中，避免敏感信息暴露在URL中
    const cacheKey = `category_${category.id}`
    setRouteData(cacheKey, {
      id: category.id,
      name: category.name,
      icon: category.icon,
      bgColor: category.bgColor,
      iconColor: category.iconColor
    })

    // 跳转到分类详情页面，只传递必要的ID参数
    router.push({
      name: 'CategoryDetail',
      params: { categoryId: category.id }
    })
  }

  // 推荐点击处理 - 跳转到菜谱详情页面
  const handleRecommendClick = (router) => {
    const recipe = recommendData.value.recipe
    const ingredient = recommendData.value.ingredient

    // 将菜谱数据存储到缓存中
    const cacheKey = `recipe_${recipe.id}`
    const recipeDetail = getRecipeById(recipe.id)
    
    setRouteData(cacheKey, {
      ...recipeDetail,
      recommendedIngredient: ingredient, // 添加推荐的食材信息
      allRecommendedRecipes: recommendData.value.allRecommendedRecipes // 添加所有推荐菜谱
    })

    // 跳转到菜谱详情页面
    router.push({
      name: 'RecipeDetail',
      params: { id: recipe.id }
    })
  }

  // 最近添加项点击处理
  const handleRecentItemClick = (item, router) => {
    // 如果食材已被取出，显示提示信息
    if (item.isTakenOut) {
      showToast({
        message: `${item.name} 已取出，无法查看详情`,
        type: 'warning'
      })
      return
    }

    // 将食品数据存储到缓存中
    const cacheKey = `food_${item.id}`
    setRouteData(cacheKey, {
      id: item.id,
      name: item.name,
      category: item.category,
      expireDate: item.expireDate,
      storageLocation: item.storageLocation || '冰箱',
      createdAt: item.createdAt || item.addedDate || new Date().toISOString().split('T')[0],
      synonyms: item.synonyms || []
    })

    // 跳转到食品详情页面，只传递ID参数
    router.push({
      name: 'FoodDetail',
      params: { id: item.id }
    })
  }

  // 切换最近添加列表的展开/收起状态
  const toggleRecentlyAddedExpansion = () => {
    showAllRecentlyAdded.value = !showAllRecentlyAdded.value
  }

  // 查看全部点击处理（切换展开/收起状态）
  const handleViewAllClick = () => {
    toggleRecentlyAddedExpansion()
  }

  // 过期预警点击处理
  const handleExpiryWarningClick = () => {
    const expiringItems = foodData.value.filter(item => {
      const days = calculateExpiryDays(item.expireDate)
      return days <= 3 && days >= 0 // 只包含即将过期但未过期的食材
    }).sort((a, b) => calculateExpiryDays(a.expireDate) - calculateExpiryDays(b.expireDate))

    if (expiringItems.length === 0) {
      showToast({
        message: '暂无即将过期的食材',
        type: 'success'
      })
      return
    }

    // 显示即将过期食材列表
    const itemList = expiringItems.map(item => {
      const days = calculateExpiryDays(item.expireDate)
      return `${item.name} (${days}天后过期)`
    }).join('<br>')

    showDialog({
      title: '即将过期食材',
      message: itemList,
      allowHtml: true,
      confirmButtonText: '知道了'
    })
  }

  // 已过期食材点击处理
  const handleExpiredClick = () => {
    const expiredItems = foodData.value.filter(item => {
      const days = calculateExpiryDays(item.expireDate)
      return days < 0
    }).sort((a, b) => calculateExpiryDays(a.expireDate) - calculateExpiryDays(b.expireDate))

    if (expiredItems.length === 0) {
      showToast({
        message: '暂无已过期的食材',
        type: 'success'
      })
      return
    }

    const itemList = expiredItems.map(item => {
      const days = Math.abs(calculateExpiryDays(item.expireDate))
      return `<span style="color: #e74c3c; font-weight: bold;">${item.name} (已过期${days}天)</span>`
    }).join('<br>')

    showDialog({
      title: '已过期食材',
      message: itemList,
      allowHtml: true,
      confirmButtonText: '知道了'
    })
  }

  // 库存不足点击处理
  const handleLowStockClick = () => {
    const currentStock = lowstock.value
    const usedStock = foodData.value.length
    const totalStock = total.value

    showDialog({
      title: '库存统计',
      message: `总库存: ${totalStock}项\n已使用: ${usedStock}项\n剩余库存: ${currentStock}项`,
      confirmButtonText: '知道了'
    })
  }

  // 路由数据缓存管理函数
  const setRouteData = (key, data) => {
    routeDataCache.value.set(key, data)
  }

  const getRouteData = (key) => {
    return routeDataCache.value.get(key)
  }

  const clearRouteData = (key) => {
    routeDataCache.value.delete(key)
  }



  // 取出食材功能
  const takeOutFood = async (food) => {
    const foodId = food._id || food.id

    try {
      // 先从数据库中删除食品
      const response = await axios.delete(`http://localhost:3001/api/food/${foodId}`)

      if (response.status === 200 || response.status === 204) {
        // 数据库删除成功后，从本地状态中移除
        const index = foodData.value.findIndex(item => (item._id || item.id) === foodId)
        if (index > -1) {
          foodData.value.splice(index, 1)
        }

        // 创建取出记录
        const takenOutItem = {
          ...food,
          takenOutDate: new Date().toISOString(),
          takenOutTime: new Date().toLocaleString('zh-CN')
        }

        // 添加到已取出列表的开头
        takenOutFoods.value.unshift(takenOutItem)

        // 清理过期记录并保存
        cleanExpiredTakenOutFoods()
        saveTakenOutFoods()

        showToast({
          message: `${food.name} 已取出`,
          type: 'success'
        })
      } else {
        throw new Error(`删除失败，状态码: ${response.status}`)
      }
    } catch (error) {

      // 根据错误类型显示不同的提示信息
      let errorMessage = '取出失败，请重试'
      if (error.response) {
        // 服务器响应了错误状态码
        if (error.response.status === 404) {
          errorMessage = '食材不存在或已被删除'
        } else if (error.response.status === 500) {
          errorMessage = '服务器错误，请稍后重试'
        }
      } else if (error.request) {
        // 网络错误
        errorMessage = '网络连接失败，请检查网络'
      }

      showToast({
        message: errorMessage,
        type: 'fail'
      })

      // 抛出错误，让调用方知道操作失败
      throw error
    }
  }

  return {
    // 状态
    foodData,
    loading,
    total,
    foodCategories,
    showAllCategories,
    maxVisibleCategories,
    showAllRecentlyAdded,

    // 计算属性
    expired,
    outdate,
    lowstock,
    recommendData,
    recentlyAdded,
    allRecentSevenDaysCount,
    getExpiringIngredient,
    getActualCategories,
    visibleCategories,
    shouldShowMoreButton,

    // 工具函数
    calculateExpiryDays,
    getItemImage,
    getExpiryColor,
    getFoodsByCategory,
    getCategoryDescription,
    debugCategoryFoods,
    toggleCategoriesExpansion,
    toggleRecentlyAddedExpansion,
    getRecipesByIngredient,
    getRecipeById,
    getCategoryIdByFoodCategory,
    isFoodTakenOut,

    // 异步操作
    loadFoodData,
    getFoodById,

    // 路由数据缓存管理
    setRouteData,
    getRouteData,
    clearRouteData,

    // 已取出食材管理
    takenOutFoods,
    takeOutFood,
    loadTakenOutFoods,
    saveTakenOutFoods,
    cleanExpiredTakenOutFoods,
    clearAllTakenOutFoods,

    // 事件处理
    handleCategoryClick,
    handleRecommendClick,
    handleRecentItemClick,
    handleViewAllClick,
    handleExpiredClick,
    handleExpiryWarningClick,
    handleLowStockClick,

    // 事件监听器设置
    setupEventListeners
  }
}, {
  // Pinia store选项
  persist: false // 我们手动管理持久化
})