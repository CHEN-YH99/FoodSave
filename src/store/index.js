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

export const useIndexStore = defineStore('index', () => {
  // 状态数据
  const foodData = ref([])
  const loading = ref(false)
  const total = ref(100) // 总库存

  // 食物分类数据
  const foodCategories = ref([
    {
      id: 1,
      name: '果蔬类',
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
      name: '乳制品',
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

  // 获取最近添加的食材（按添加时间排序，取前4个）
  const recentlyAdded = computed(() => {
    const sortedData = [...foodData.value]
      .sort((a, b) => new Date(b.createdAt || b.addedDate || Date.now()) - new Date(a.createdAt || a.addedDate || Date.now()))
      .slice(0, 4)

    return sortedData.map(item => ({
      id: item.id,
      name: item.name,
      image: getItemImage(item.name, item.category),
      expiryDays: calculateExpiryDays(item.expireDate),
      category: item.category,
      expireDate: item.expireDate
    }))
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
      } else {
        foodData.value = []
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      foodData.value = []
    } finally {
      loading.value = false
    }
  }

  // 事件处理函数
  // 分类点击处理
  const handleCategoryClick = (category, router) => {
    console.log('点击了分类:', category.name)
    // 跳转到食品分类详情页面，传递分类ID
    router.push({
      name: 'FoodCardDetail',
      params: { categoryId: category.id },
      query: { 
        name: category.name,
        icon: category.icon,
        bgColor: category.bgColor,
        iconColor: category.iconColor
      }
    })
  }

  // 推荐点击处理
  const handleRecommendClick = () => {
    console.log('点击了推荐:', recommendData.value)
  }

  // 最近添加项点击处理
  const handleRecentItemClick = (item) => {
    console.log('点击了最近添加项:', item)
  }

  // 查看全部点击处理
  const handleViewAllClick = () => {
    console.log('点击了查看全部')
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

  return {
    // 状态
    foodData,
    loading,
    total,
    foodCategories,

    // 计算属性
    expired,
    outdate,
    lowstock,
    recommendData,
    recentlyAdded,
    getExpiringIngredient,

    // 工具函数
    calculateExpiryDays,
    getItemImage,
    getExpiryColor,

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
  }
})