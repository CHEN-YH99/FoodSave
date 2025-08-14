/**
 * API 服务层
 * 统一管理所有API请求
 */

import axios from 'axios'
import { API_CONFIG, MESSAGE_TYPES } from '@/constants'
import { showToast } from 'vant'

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 添加token到请求头
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 统一错误处理
    handleApiError(error)
    return Promise.reject(error)
  }
)

/**
 * 统一错误处理
 * @param {Error} error - 错误对象
 */
function handleApiError(error) {
  let errorMessage = '网络请求失败'
  
  if (error.response) {
    // 服务器响应了错误状态码
    const { status } = error.response
    switch (status) {
      case 400:
        errorMessage = '请求参数错误'
        break
      case 401:
        errorMessage = '未授权访问'
        break
      case 403:
        errorMessage = '禁止访问'
        break
      case 404:
        errorMessage = '资源不存在'
        break
      case 500:
        errorMessage = '服务器内部错误'
        break
      default:
        errorMessage = `请求失败 (${status})`
    }
  } else if (error.request) {
    // 网络错误
    errorMessage = '网络连接失败，请检查网络'
  }
  
  showToast({
    message: errorMessage,
    type: MESSAGE_TYPES.ERROR
  })
}

/**
 * 食材服务
 */
export const foodService = {
  /**
   * 获取所有食材
   */
  async getAllFoods() {
    const response = await apiClient.get('/food')
    return response.data
  },

  /**
   * 根据ID获取食材详情
   * @param {string} id - 食材ID
   */
  async getFoodById(id) {
    const response = await apiClient.get(`/food/${id}`)
    return response.data
  },

  /**
   * 添加新食材
   * @param {Object} foodData - 食材数据
   */
  async addFood(foodData) {
    const response = await apiClient.post('/food', foodData)
    return response.data
  },

  /**
   * 更新食材信息
   * @param {string} id - 食材ID
   * @param {Object} foodData - 更新的食材数据
   */
  async updateFood(id, foodData) {
    const response = await apiClient.put(`/food/${id}`, foodData)
    return response.data
  },

  /**
   * 删除食材
   * @param {string} id - 食材ID
   */
  async deleteFood(id) {
    const response = await apiClient.delete(`/food/${id}`)
    return response.data
  }
}

/**
 * 用户相关API
 */
export const userApi = {
  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   */
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData)
    return response.data
  },

  /**
   * 用户登录
   * @param {Object} credentials - 登录凭据
   */
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  /**
   * 获取用户信息
   * @param {string} userId - 用户ID
   */
  async getUserInfo(userId) {
    const response = await apiClient.get(`/users/${userId}`)
    return response.data
  },

  /**
   * 更新用户信息
   * @param {string} userId - 用户ID
   * @param {Object} userData - 更新的用户数据
   */
  async updateUserInfo(userId, userData) {
    const response = await apiClient.put(`/users/${userId}`, userData)
    return response.data
  },

  /**
   * 上传用户头像
   * @param {string} userId - 用户ID
   * @param {FormData} formData - 头像文件数据
   */
  async uploadAvatar(userId, formData) {
    const response = await apiClient.post(`/users/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  /**
   * 验证token
   */
  async verifyToken() {
    const response = await apiClient.get('/auth/verify')
    return response.data
  }
}

/**
 * 统计相关API（预留）
 */
export const analyticsApi = {
  // 统计相关API方法
}

export default apiClient