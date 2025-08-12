/**
 * 工具函数集合
 */

import { EXPIRY_THRESHOLDS, STORAGE_KEYS } from '@/constants'

/**
 * 日期相关工具函数
 */
export const dateUtils = {
  /**
   * 计算距离过期的天数
   * @param {string|Date} expireDate - 过期日期
   * @returns {number} 距离过期的天数
   */
  calculateExpiryDays(expireDate) {
    const today = new Date()
    const expire = new Date(expireDate)
    const diffTime = expire - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  },

  /**
   * 格式化日期
   * @param {string|Date} date - 日期
   * @param {string} format - 格式化模式
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
  },

  /**
   * 获取相对时间描述
   * @param {string|Date} date - 日期
   * @returns {string} 相对时间描述
   */
  getRelativeTime(date) {
    const now = new Date()
    const target = new Date(date)
    const diffMs = target - now
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `已过期${Math.abs(diffDays)}天`
    } else if (diffDays === 0) {
      return '今天过期'
    } else if (diffDays === 1) {
      return '明天过期'
    } else if (diffDays === 2) {
      return '后天过期'
    } else {
      return `${diffDays}天后过期`
    }
  }
}

/**
 * 本地存储工具函数
 */
export const storageUtils = {
  /**
   * 设置本地存储
   * @param {string} key - 存储键
   * @param {any} value - 存储值
   */
  setItem(key, value) {
    try {
      const serializedValue = JSON.stringify(value)
      localStorage.setItem(key, serializedValue)
    } catch (error) {
      console.error('设置本地存储失败:', error)
    }
  },

  /**
   * 获取本地存储
   * @param {string} key - 存储键
   * @param {any} defaultValue - 默认值
   * @returns {any} 存储的值
   */
  getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('获取本地存储失败:', error)
      return defaultValue
    }
  },

  /**
   * 删除本地存储
   * @param {string} key - 存储键
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('删除本地存储失败:', error)
    }
  },

  /**
   * 清空本地存储
   */
  clear() {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('清空本地存储失败:', error)
    }
  }
}

/**
 * 食材相关工具函数
 */
export const foodUtils = {
  /**
   * 获取过期状态颜色
   * @param {number} days - 距离过期天数
   * @returns {string} 颜色值
   */
  getExpiryColor(days) {
    if (days <= EXPIRY_THRESHOLDS.EXPIRED) return '#e74c3c' // 已过期 - 红色
    if (days <= 1) return '#e74c3c' // 1天内 - 红色
    if (days <= EXPIRY_THRESHOLDS.WARNING) return '#f39c12' // 3天内 - 橙色
    return '#27ae60' // 正常 - 绿色
  },

  /**
   * 根据食材名称和分类获取对应图片
   * @param {string} name - 食材名称
   * @param {string} category - 食材分类
   * @returns {string} 图片路径
   */
  getItemImage(name, category) {
    // 静态导入图片资源
    const images = {
      '牛奶': '/src/assets/images/milk.svg',
      '鸡蛋': '/src/assets/images/eggs.svg',
      '面包': '/src/assets/images/bread.svg',
      '蔬菜': '/src/assets/images/salad.svg',
      '沙拉': '/src/assets/images/salad.svg',
      '土豆': '/src/assets/images/potato.jpeg',
      '面条': '/src/assets/images/noddles.jpeg'
    }

    // 先尝试精确匹配
    for (const [key, imagePath] of Object.entries(images)) {
      if (name.includes(key)) {
        return imagePath
      }
    }

    // 根据分类匹配默认图片
    const categoryImageMap = {
      '乳制品': images['牛奶'],
      '蛋类': images['鸡蛋'],
      '主食': images['面包'],
      '生鲜': images['蔬菜'],
      '蔬菜': images['蔬菜'],
      '肉类': images['土豆']
    }

    return categoryImageMap[category] || images['蔬菜'] // 默认图片
  },

  /**
   * 根据食品类别获取对应的分类ID
   * @param {string} foodCategory - 食品类别
   * @returns {number} 分类ID
   */
  getCategoryIdByFoodCategory(foodCategory) {
    const { CATEGORY_MAPPING } = require('@/constants')
    return CATEGORY_MAPPING[foodCategory] || 10 // 默认返回"其他"分类
  }
}

/**
 * 验证工具函数
 */
export const validationUtils = {
  /**
   * 验证是否为有效的日期
   * @param {any} date - 待验证的日期
   * @returns {boolean} 是否为有效日期
   */
  isValidDate(date) {
    const d = new Date(date)
    return d instanceof Date && !isNaN(d.getTime())
  },

  /**
   * 验证是否为空值
   * @param {any} value - 待验证的值
   * @returns {boolean} 是否为空
   */
  isEmpty(value) {
    return value === null || value === undefined || value === '' || 
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'object' && Object.keys(value).length === 0)
  },

  /**
   * 验证字符串长度
   * @param {string} str - 待验证的字符串
   * @param {number} min - 最小长度
   * @param {number} max - 最大长度
   * @returns {boolean} 是否符合长度要求
   */
  isValidLength(str, min = 0, max = Infinity) {
    if (typeof str !== 'string') return false
    return str.length >= min && str.length <= max
  }
}

/**
 * 通用工具函数
 */
export const commonUtils = {
  /**
   * 防抖函数
   * @param {Function} func - 要防抖的函数
   * @param {number} delay - 延迟时间
   * @returns {Function} 防抖后的函数
   */
  debounce(func, delay) {
    let timeoutId
    return function (...args) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
  },

  /**
   * 节流函数
   * @param {Function} func - 要节流的函数
   * @param {number} delay - 延迟时间
   * @returns {Function} 节流后的函数
   */
  throttle(func, delay) {
    let lastCall = 0
    return function (...args) {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        return func.apply(this, args)
      }
    }
  },

  /**
   * 深拷贝
   * @param {any} obj - 要拷贝的对象
   * @returns {any} 拷贝后的对象
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => this.deepClone(item))
    if (typeof obj === 'object') {
      const clonedObj = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key])
        }
      }
      return clonedObj
    }
  },

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}