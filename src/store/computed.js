import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// 配置axios基础URL
const API_BASE_URL = 'http://localhost:3001/api'

export const useComputedStore = defineStore('computed', () => {
  // 食材数据
  const foodData = ref([])
  const loading = ref(false)

  // 获取所有食材数据
  const fetchFoodData = async () => {
    try {
      loading.value = true
      const response = await axios.get(`${API_BASE_URL}/food`)
      foodData.value = response.data
    } catch (error) {
      // 获取食材数据失败
    } finally {
      loading.value = false
    }
  }

  // 计算分类统计
  const categoryStats = computed(() => {
    if (!foodData.value.length) {
      // 如果没有数据，返回模拟数据用于展示
      return [
        { name: '蔬菜', count: 15, percentage: 35 },
        { name: '水果', count: 12, percentage: 28 },
        { name: '主食', count: 8, percentage: 19 },
        { name: '肉类', count: 5, percentage: 12 },
        { name: '其他', count: 3, percentage: 6 }
      ]
    }

    const stats = {}
    let total = 0

    foodData.value.forEach(food => {
      const category = food.category || '其他'
      if (!stats[category]) {
        stats[category] = 0
      }
      stats[category] += food.quantity || 1
      total += food.quantity || 1
    })

    // 转换为百分比
    const result = Object.entries(stats).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100) || 0
    }))

    return result.sort((a, b) => b.count - a.count)
  })

  // 计算存储位置统计
  const storageStats = computed(() => {
    const stats = {}

    foodData.value.forEach(food => {
      const location = food.storageLocation || '未知'
      if (!stats[location]) {
        stats[location] = 0
      }
      stats[location] += food.quantity || 1
    })

    return Object.entries(stats).map(([location, count]) => ({
      location,
      count
    })).sort((a, b) => b.count - a.count)
  })

  // 计算即将过期的食材
  const expiringFoods = computed(() => {
    const now = new Date()
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    return foodData.value.filter(food => {
      if (!food.expireDate) return false
      const expireDate = new Date(food.expireDate)
      return expireDate <= threeDaysLater && expireDate >= now
    })
  })

  // 计算已过期的食材（浪费统计）
  const expiredFoods = computed(() => {
    const now = new Date()

    return foodData.value.filter(food => {
      if (!food.expireDate) return false
      const expireDate = new Date(food.expireDate)
      return expireDate < now
    })
  })

  // 计算浪费重量
  const wasteWeight = computed(() => {
    return expiredFoods.value.reduce((total, food) => {
      return total + (food.quantity || 0)
    }, 0)
  })

  // 计算每周添加趋势（最近4周）
  const weeklyTrend = computed(() => {
    const now = new Date()
    const weeks = []

    // 生成最近4周的数据
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)

      const weekFoods = foodData.value.filter(food => {
        if (!food.createdAt && !food.purchaseDate) return false
        const createdDate = new Date(food.createdAt || food.purchaseDate)
        return createdDate >= weekStart && createdDate < weekEnd
      })

      const totalWeight = weekFoods.reduce((sum, food) => sum + (food.quantity || 0), 0)

      weeks.push({
        week: `第${4 - i}周`,
        weight: totalWeight,
        count: weekFoods.length
      })
    }

    // 如果没有真实数据，提供一些模拟数据用于展示
    if (weeks.every(week => week.weight === 0)) {
      return [
        { week: '第1周', weight: 5, count: 3 },
        { week: '第2周', weight: 8, count: 5 },
        { week: '第3周', weight: 6, count: 4 },
        { week: '第4周', weight: 10, count: 7 }
      ]
    }

    return weeks
  })

  // 营养分析（模拟数据，实际应该根据食材类型计算）
  const nutritionAnalysis = computed(() => {
    const categories = categoryStats.value
    const total = categories.reduce((sum, cat) => sum + cat.count, 0)

    // 根据食材分类估算营养成分
    let protein = 0, carbs = 0, fat = 0, fiber = 0

    categories.forEach(cat => {
      const ratio = cat.count / total
      switch (cat.name) {
        case '肉类':
        case '海鲜':
          protein += ratio * 100
          fat += ratio * 60
          break
        case '主食':
          carbs += ratio * 120
          fiber += ratio * 30
          break
        case '蔬菜':
          fiber += ratio * 80
          carbs += ratio * 20
          break
        case '水果':
          carbs += ratio * 40
          fiber += ratio * 50
          break
        default:
          protein += ratio * 20
          carbs += ratio * 30
          fat += ratio * 20
          fiber += ratio * 25
      }
    })

    return [
      { name: '蛋白质', value: Math.round(protein), color: '#ff6b6b' },
      { name: '碳水', value: Math.round(carbs), color: '#4ecdc4' },
      { name: '脂肪', value: Math.round(fat), color: '#45b7d1' },
      { name: '纤维', value: Math.round(fiber), color: '#96ceb4' }
    ]
  })

  // 根据时间筛选器获取时间范围
  const getDateRange = (period) => {
    const now = new Date()
    let startDate, endDate = now

    switch (period) {
      case '本周':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)
        startDate = weekStart
        break
      case '本月':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case '近3个月':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        break
      case '本年':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    return { startDate, endDate }
  }

  // 根据时间筛选器获取过滤后的食材数据
  const getFilteredFoodData = (period) => {
    const { startDate, endDate } = getDateRange(period)
    
    return foodData.value.filter(food => {
      const createdDate = new Date(food.createdAt || food.purchaseDate || food.expireDate)
      return createdDate >= startDate && createdDate <= endDate
    })
  }

  // 根据时间筛选器获取分类统计
  const getCategoryStatsByPeriod = (period) => {
    const filteredData = getFilteredFoodData(period)
    
    if (!filteredData.length) {
      return [
        { name: '蔬菜', count: 15, percentage: 35 },
        { name: '水果', count: 12, percentage: 28 },
        { name: '主食', count: 8, percentage: 19 },
        { name: '肉类', count: 5, percentage: 12 },
        { name: '其他', count: 3, percentage: 6 }
      ]
    }

    const stats = {}
    let total = 0

    filteredData.forEach(food => {
      const category = food.category || '其他'
      if (!stats[category]) {
        stats[category] = 0
      }
      stats[category] += food.quantity || 1
      total += food.quantity || 1
    })

    const result = Object.entries(stats).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100) || 0
    }))

    return result.sort((a, b) => b.count - a.count)
  }

  // 根据时间筛选器获取浪费数据
  const getWasteDataByPeriod = (period) => {
    const { startDate, endDate } = getDateRange(period)
    const now = new Date()
    
    // 获取当前时间段的过期食材
    const currentExpiredFoods = foodData.value.filter(food => {
      if (!food.expireDate) return false
      const expireDate = new Date(food.expireDate)
      const createdDate = new Date(food.createdAt || food.purchaseDate || food.expireDate)
      return expireDate < now && createdDate >= startDate && createdDate <= endDate
    })

    // 获取上一个时间段的过期食材用于计算趋势
    let prevStartDate, prevEndDate
    const timeDiff = endDate.getTime() - startDate.getTime()
    prevEndDate = new Date(startDate.getTime() - 1)
    prevStartDate = new Date(startDate.getTime() - timeDiff)

    const prevExpiredFoods = foodData.value.filter(food => {
      if (!food.expireDate) return false
      const expireDate = new Date(food.expireDate)
      const createdDate = new Date(food.createdAt || food.purchaseDate || food.expireDate)
      return expireDate < now && createdDate >= prevStartDate && createdDate <= prevEndDate
    })

    const currentAmount = currentExpiredFoods.reduce((total, food) => total + (food.quantity || 0), 0)
    const prevAmount = prevExpiredFoods.reduce((total, food) => total + (food.quantity || 0), 0)

    // 计算趋势百分比
    let trend = 0
    if (prevAmount > 0) {
      trend = Math.round(((currentAmount - prevAmount) / prevAmount) * 100)
    } else if (currentAmount > 0) {
      trend = 100
    }

    return {
      amount: currentAmount,
      trend: trend
    }
  }

  // 根据时间筛选器获取每周趋势
  const getWeeklyTrendByPeriod = (period) => {
    const { startDate, endDate } = getDateRange(period)
    const weeks = []
    const timeDiff = endDate.getTime() - startDate.getTime()
    const weekCount = Math.ceil(timeDiff / (7 * 24 * 60 * 60 * 1000))
    const actualWeekCount = Math.min(weekCount, 4)

    for (let i = actualWeekCount - 1; i >= 0; i--) {
      const weekStart = new Date(endDate.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(endDate.getTime() - i * 7 * 24 * 60 * 60 * 1000)

      const weekFoods = foodData.value.filter(food => {
        if (!food.createdAt && !food.purchaseDate) return false
        const createdDate = new Date(food.createdAt || food.purchaseDate)
        return createdDate >= weekStart && createdDate < weekEnd
      })

      const totalWeight = weekFoods.reduce((sum, food) => sum + (food.quantity || 0), 0)

      weeks.push({
        week: `第${actualWeekCount - i}周`,
        weight: totalWeight,
        count: weekFoods.length
      })
    }

    if (weeks.every(week => week.weight === 0)) {
      return [
        { week: '第1周', weight: 5, count: 3 },
        { week: '第2周', weight: 8, count: 5 },
        { week: '第3周', weight: 6, count: 4 },
        { week: '第4周', weight: 10, count: 7 }
      ]
    }

    return weeks
  }

  // 根据时间筛选器获取营养分析
  const getNutritionAnalysisByPeriod = (period) => {
    const categories = getCategoryStatsByPeriod(period)
    const total = categories.reduce((sum, cat) => sum + cat.count, 0)

    let protein = 0, carbs = 0, fat = 0, fiber = 0

    categories.forEach(cat => {
      const ratio = cat.count / total
      switch (cat.name) {
        case '肉类':
        case '海鲜':
          protein += ratio * 100
          fat += ratio * 60
          break
        case '主食':
          carbs += ratio * 120
          fiber += ratio * 30
          break
        case '蔬菜':
          fiber += ratio * 80
          carbs += ratio * 20
          break
        case '水果':
          carbs += ratio * 40
          fiber += ratio * 50
          break
        default:
          protein += ratio * 20
          carbs += ratio * 30
          fat += ratio * 20
          fiber += ratio * 25
      }
    })

    return [
      { name: '蛋白质', value: Math.round(protein), color: '#ff6b6b' },
      { name: '碳水', value: Math.round(carbs), color: '#4ecdc4' },
      { name: '脂肪', value: Math.round(fat), color: '#45b7d1' },
      { name: '纤维', value: Math.round(fiber), color: '#96ceb4' }
    ]
  }

  // 生成月度报告
  const generateMonthlyReport = () => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const monthName = `${currentYear}年${currentMonth}月`
    
    // 获取本月数据
    const monthlyData = getCategoryStatsByPeriod('本月')
    const wasteData = getWasteDataByPeriod('本月')
    const weeklyData = getWeeklyTrendByPeriod('本月')
    const nutritionData = getNutritionAnalysisByPeriod('本月')
    
    // 计算本月统计
    const totalItems = monthlyData.reduce((sum, cat) => sum + cat.count, 0)
    const totalWaste = wasteData.amount
    const wasteRate = totalItems > 0 ? ((totalWaste / totalItems) * 100).toFixed(1) : 0
    
    // 找出最多和最少的分类
    const topCategory = monthlyData[0] || { name: '无', count: 0 }
    const leastCategory = monthlyData[monthlyData.length - 1] || { name: '无', count: 0 }
    
    // 计算平均每周添加量
    const avgWeeklyAdd = weeklyData.length > 0 
      ? (weeklyData.reduce((sum, week) => sum + week.weight, 0) / weeklyData.length).toFixed(1)
      : 0
    
    // 营养分析总结
    const topNutrition = nutritionData.reduce((max, item) => 
      item.value > max.value ? item : max, nutritionData[0] || { name: '无', value: 0 }
    )
    
    // 生成报告内容
    const report = {
      title: `${monthName}食材管理月度报告`,
      generateTime: now.toLocaleString('zh-CN'),
      summary: {
        totalItems,
        totalWaste,
        wasteRate,
        avgWeeklyAdd
      },
      categoryAnalysis: {
        topCategory: topCategory.name,
        topCategoryCount: topCategory.count,
        leastCategory: leastCategory.name,
        leastCategoryCount: leastCategory.count,
        categories: monthlyData
      },
      wasteAnalysis: {
        amount: totalWaste,
        trend: wasteData.trend,
        trendDescription: wasteData.trend > 0 ? '上升' : wasteData.trend < 0 ? '下降' : '持平'
      },
      weeklyTrend: weeklyData,
      nutritionAnalysis: {
        topNutrient: topNutrition.name,
        topNutrientValue: topNutrition.value,
        details: nutritionData
      },
      recommendations: generateRecommendations(wasteRate, topCategory.name, wasteData.trend)
    }
    
    return report
  }
  
  // 生成建议
  const generateRecommendations = (wasteRate, topCategory, wasteTrend) => {
    const recommendations = []
    
    // 基于浪费率的建议
    if (wasteRate > 20) {
      recommendations.push('浪费率较高，建议合理规划采购量，避免过度囤积')
    } else if (wasteRate > 10) {
      recommendations.push('浪费率适中，可以进一步优化食材使用计划')
    } else {
      recommendations.push('浪费率控制良好，继续保持')
    }
    
    // 基于主要分类的建议
    if (topCategory === '蔬菜') {
      recommendations.push('蔬菜类食材较多，注意保鲜储存，建议优先消费易腐食材')
    } else if (topCategory === '水果') {
      recommendations.push('水果类食材较多，建议按成熟度分类储存，及时食用')
    } else if (topCategory === '肉类') {
      recommendations.push('肉类食材较多，注意冷冻保存，合理安排烹饪计划')
    }
    
    // 基于浪费趋势的建议
    if (wasteTrend > 10) {
      recommendations.push('浪费趋势上升明显，建议检查储存条件和食材使用习惯')
    } else if (wasteTrend < -10) {
      recommendations.push('浪费趋势下降良好，继续保持当前的管理方式')
    }
    
    // 通用建议
    recommendations.push('定期检查食材保质期，建立先进先出的使用原则')
    recommendations.push('根据实际需求制定采购计划，避免冲动购买')
    
    return recommendations
  }

  return {
    // 状态
    foodData,
    loading,

    // 计算属性
    categoryStats,
    storageStats,
    expiringFoods,
    expiredFoods,
    wasteWeight,
    weeklyTrend,
    nutritionAnalysis,

    // 方法
    fetchFoodData,
    getCategoryStatsByPeriod,
    getWasteDataByPeriod,
    getWeeklyTrendByPeriod,
    getNutritionAnalysisByPeriod,
    generateMonthlyReport
  }
})