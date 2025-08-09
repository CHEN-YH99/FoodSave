import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { showToast, showDialog } from 'vant'

// 导入本地图片
import potatoImg from '@/assets/images/potato.jpeg'
import noddlesImg from '@/assets/images/noddles.jpeg'
import milkImg from '@/assets/images/milk.svg'
import eggsImg from '@/assets/images/eggs.svg'
import breadImg from '@/assets/images/bread.svg'
import saladImg from '@/assets/images/salad.svg'

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

  // 推荐数据 - 基于即将过期的食材
  const recommendData = computed(() => {
    const ingredient = getExpiringIngredient.value

    // 根据食材推荐菜谱（简单的映射关系）
    const recipeMap = {
      '番茄': { name: '意面', image: noddlesImg },
      '土豆': { name: '土豆丝', image: potatoImg },
      '鸡蛋': { name: '炒蛋', image: eggsImg },
      '牛奶': { name: '奶昔', image: milkImg },
      '面包': { name: '三明治', image: breadImg },
      '蔬菜': { name: '蔬菜沙拉', image: saladImg }
    }

    let recipe = { name: '意面', image: noddlesImg }
    for (const [key, value] of Object.entries(recipeMap)) {
      if (ingredient.name.includes(key)) {
        recipe = value
        break
      }
    }

    return {
      ingredient,
      recipe
    }
  })

  // 获取最近7天的所有食材（用于内部过滤）
  const getAllRecentSevenDays = () => {
    if (!foodData.value || foodData.value.length === 0) {
      return []
    }

    // 计算7天前的日期
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // 过滤出最近7天添加的食材
    const recentData = foodData.value.filter(item => {
      // 检查是否有有效的创建时间
      if (!item.createdAt && !item.updatedAt) {
        return false // 没有时间戳的数据不显示
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
    })

    // 按添加时间排序，最新的在前面
    return recentData
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || a.updatedAt)
        const timeB = new Date(b.createdAt || b.updatedAt)
        return timeB - timeA
      })
      .map(item => ({
        id: item._id || item.id,
        name: item.name,
        image: getItemImage(item.name, item.category),
        expiryDays: calculateExpiryDays(item.expireDate),
        category: item.category,
        expireDate: item.expireDate,
        storageLocation: item.storageLocation,
        createdAt: item.createdAt,
        addedDate: new Date(item.createdAt || item.updatedAt).toLocaleDateString('zh-CN')
      }))
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
        '果蔬类': ['果蔬类', '蔬菜', '水果', '果蔬', '生鲜'],
        '肉类': ['肉类', '肉', '禽肉'],
        '饮品': ['饮品', '乳制品', '奶制品', '乳品', '饮料'],
        '主食': ['主食', '谷物', '粮食', '米面', '蛋类'],
        '罐头': ['罐头', '罐装食品'],
        '调料': ['调料', '调味品', '佐料', '香料'],
        '海鲜': ['海鲜', '水产', '海产品'],
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
      '果蔬类': '新鲜的水果和蔬菜，富含维生素和纤维，建议冷藏保存。',
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
      '果蔬类': ['果蔬类', '蔬菜', '水果', '果蔬', '生鲜'],
      '肉类': ['肉类', '肉', '禽肉'],
      '饮品': ['饮品', '乳制品', '奶制品', '乳品', '饮料'],
      '主食': ['主食', '谷物', '粮食', '米面', '蛋类'],
      '罐头': ['罐头', '罐装食品'],
      '调料': ['调料', '调味品', '佐料', '香料'],
      '海鲜': ['海鲜', '水产', '海产品'],
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
      const response = await axios.get('http://localhost:3001/api/food')

      if (response.data && response.data.length > 0) {
        foodData.value = response.data.map(item => ({
          ...item,
          id: item._id || item.id
        }))



        const withTimestamp = response.data.filter(item => item.createdAt || item.updatedAt).length
        const withoutTimestamp = response.data.length - withTimestamp

        // 统计数据库中的分类信息
        const categories = [...new Set(response.data.map(item => item.category).filter(Boolean))]

        // 按分类统计食品数量
        const categoryStats = {}
        response.data.forEach(item => {
          const cat = item.category || '未分类'
          categoryStats[cat] = (categoryStats[cat] || 0) + 1
        })
      } else {
        foodData.value = []
      }
    } catch (error) {
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

  // 推荐点击处理
  const handleRecommendClick = (router) => {
    const ingredient = recommendData.value.ingredient
    const foodId = 'recommend-' + Date.now()

    // 将食品数据存储到缓存中
    const cacheKey = `food_${foodId}`
    setRouteData(cacheKey, {
      id: foodId,
      name: ingredient.name,
      category: '推荐食材',
      expireDate: new Date(Date.now() + ingredient.expiryDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      storageLocation: '冰箱',
      createdAt: new Date().toISOString().split('T')[0],
      synonyms: []
    })

    // 跳转到食品详情页面，只传递ID参数
    router.push({
      name: 'FoodDetail',
      params: { id: foodId }
    })
  }

  // 最近添加项点击处理
  const handleRecentItemClick = (item, router) => {

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