/**
 * 食材相关的组合式API
 */

import { ref, computed } from 'vue'
import { foodApi } from '@/services/api'
import { dateUtils, foodUtils } from '@/utils'
import { EXPIRY_THRESHOLDS, MESSAGE_TYPES } from '@/constants'
import { showToast } from 'vant'

/**
 * 食材管理Hook
 */
export function useFood() {
  const foodData = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * 加载所有食材数据
   */
  const loadFoodData = async () => {
    try {
      loading.value = true
      error.value = null
      const data = await foodApi.getAllFoods()
      
      if (data && data.length > 0) {
        foodData.value = data.map(item => ({
          ...item,
          id: item._id || item.id,
          expiryDays: dateUtils.calculateExpiryDays(item.expireDate),
          image: foodUtils.getItemImage(item.name, item.category)
        }))
      } else {
        foodData.value = []
      }
    } catch (err) {
      error.value = err
      foodData.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 根据ID获取食材详情
   */
  const getFoodById = async (id) => {
    try {
      const data = await foodApi.getFoodById(id)
      if (data) {
        return {
          ...data,
          id: data._id || data.id,
          expiryDays: dateUtils.calculateExpiryDays(data.expireDate),
          image: foodUtils.getItemImage(data.name, data.category)
        }
      }
      return null
    } catch (err) {
      error.value = err
      throw err
    }
  }

  /**
   * 删除食材（取出）
   */
  const takeOutFood = async (food) => {
    try {
      const foodId = food._id || food.id
      await foodApi.deleteFood(foodId)
      
      // 从本地状态中移除
      const index = foodData.value.findIndex(item => (item._id || item.id) === foodId)
      if (index > -1) {
        foodData.value.splice(index, 1)
      }
      
      showToast({
        message: `${food.name} 已取出`,
        type: MESSAGE_TYPES.SUCCESS
      })
      
      return true
    } catch (err) {
      error.value = err
      throw err
    }
  }

  // 计算属性
  const expiredCount = computed(() => {
    return foodData.value.filter(item => 
      dateUtils.calculateExpiryDays(item.expireDate) < EXPIRY_THRESHOLDS.EXPIRED
    ).length
  })

  const expiringCount = computed(() => {
    return foodData.value.filter(item => {
      const days = dateUtils.calculateExpiryDays(item.expireDate)
      return days <= EXPIRY_THRESHOLDS.WARNING && days >= EXPIRY_THRESHOLDS.EXPIRED
    }).length
  })

  const expiredFoods = computed(() => {
    return foodData.value.filter(item => 
      dateUtils.calculateExpiryDays(item.expireDate) < EXPIRY_THRESHOLDS.EXPIRED
    ).sort((a, b) => dateUtils.calculateExpiryDays(a.expireDate) - dateUtils.calculateExpiryDays(b.expireDate))
  })

  const expiringFoods = computed(() => {
    return foodData.value.filter(item => {
      const days = dateUtils.calculateExpiryDays(item.expireDate)
      return days <= EXPIRY_THRESHOLDS.WARNING && days >= EXPIRY_THRESHOLDS.EXPIRED
    }).sort((a, b) => dateUtils.calculateExpiryDays(a.expireDate) - dateUtils.calculateExpiryDays(b.expireDate))
  })

  return {
    // 状态
    foodData,
    loading,
    error,
    
    // 计算属性
    expiredCount,
    expiringCount,
    expiredFoods,
    expiringFoods,
    
    // 方法
    loadFoodData,
    getFoodById,
    takeOutFood
  }
}

/**
 * 食材分类Hook
 */
export function useFoodCategories() {
  /**
   * 根据分类ID获取该分类下的食品列表
   */
  const getFoodsByCategory = (foodData, categoryId, categories) => {
    const category = categories.find(cat => cat.id == categoryId)
    if (!category) return []

    // 直接匹配category字段
    let filteredFoods = foodData.filter(item => {
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

    // 如果直接匹配没有结果，使用关键词匹配
    if (filteredFoods.length === 0) {
      const categoryKeywords = {
        1: ['蔬菜', '水果', '番茄', '土豆', '白菜', '萝卜', '苹果', '香蕉'],
        2: ['肉', '牛肉', '猪肉', '鸡肉', '鱼', '虾'],
        3: ['牛奶', '酸奶', '奶酪', '黄油', '饮品', '饮料'],
        4: ['米', '面', '面包', '面条', '馒头', '包子', '蛋', '鸡蛋', '鸭蛋', '鹌鹑蛋'],
        5: ['罐头', '午餐肉', '鱼罐头'],
        6: ['盐', '糖', '醋', '酱油', '料酒', '胡椒'],
        7: ['海鲜', '虾', '蟹', '鱼', '贝', '海带', '紫菜', '鲍鱼', '扇贝'],
        8: ['熟食', '卤菜', '烧鸡', '烤鸭', '火腿', '香肠', '腊肉']
      }

      const keywords = categoryKeywords[categoryId] || []
      filteredFoods = foodData.filter(item => {
        return keywords.some(keyword => item.name.includes(keyword))
      })
    }

    return filteredFoods.map(item => ({
      ...item,
      id: item._id || item.id,
      image: foodUtils.getItemImage(item.name, item.category || category.name),
      expiryDays: dateUtils.calculateExpiryDays(item.expireDate)
    }))
  }

  return {
    getFoodsByCategory
  }
}