import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '@/services/api'
import { showToast } from 'vant'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userInfo = computed(() => {
    if (!user.value) return {}
    return {
      ...user.value,
      _id: user.value._id || user.value.id,
      id: user.value.id || user.value._id
    }
  })

  // 设置token到请求头
  const setAuthToken = (newToken, rememberMe = false) => {
    token.value = newToken
    if (newToken) {
      if (rememberMe) {
        // 七天免登录
        const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000) // 7天
        localStorage.setItem('token', newToken)
        localStorage.setItem('tokenExpiry', expiryTime.toString())
        localStorage.setItem('rememberMe', 'true')
        
        // 设置cookie，7天过期
        document.cookie = `token=${newToken}; expires=${new Date(expiryTime).toUTCString()}; path=/`
      } else {
        localStorage.setItem('token', newToken)
        localStorage.removeItem('rememberMe')
        // 设置session cookie
        document.cookie = `token=${newToken}; path=/`
      }
      // 设置axios默认请求头
      import('@/services/api').then(({ default: apiClient }) => {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      })
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('tokenExpiry')
      localStorage.removeItem('rememberMe')
      // 清除cookie
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      // 移除axios默认请求头
      import('@/services/api').then(({ default: apiClient }) => {
        delete apiClient.defaults.headers.common['Authorization']
      })
    }
  }

  // 检查token是否过期
  const isTokenExpired = () => {
    const expiryTime = localStorage.getItem('tokenExpiry')
    if (!expiryTime) return false
    return Date.now() > parseInt(expiryTime)
  }

  // 从cookie获取token
  const getTokenFromCookie = () => {
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'token') {
        return value
      }
    }
    return null
  }

  // 初始化时设置token
  if (token.value) {
    if (!isTokenExpired()) {
      const rememberMe = localStorage.getItem('rememberMe') === 'true'
      setAuthToken(token.value, rememberMe)
    } else {
      // token过期，清除
      token.value = null
      setAuthToken(null)
    }
  } else {
    // 尝试从cookie获取token
    const cookieToken = getTokenFromCookie()
    if (cookieToken) {
      token.value = cookieToken
      localStorage.setItem('token', cookieToken)
      setAuthToken(cookieToken)
    }
  }

  // 用户注册
  const register = async (userData) => {
    try {
      loading.value = true
      const response = await userApi.register(userData)
      
      if (response.success) {
        // 注册成功但不自动登录，让用户手动登录
        return { success: true, user: response.data.user }
      } else {
        throw new Error(response.message || '注册失败')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '注册失败'
      showToast({
        message: errorMessage,
        type: 'fail'
      })
      return { success: false, message: errorMessage }
    } finally {
      loading.value = false
    }
  }

  // 用户登录
  const login = async (credentials) => {
    try {
      loading.value = true
      const response = await userApi.login(credentials)
      
      if (response.success) {
        setAuthToken(response.data.token, credentials.rememberMe)
        user.value = response.data.user
        
        showToast({
          message: '登录成功',
          type: 'success'
        })
        
        return { success: true, user: response.data.user }
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '登录失败'
      showToast({
        message: errorMessage,
        type: 'fail'
      })
      return { success: false, message: errorMessage }
    } finally {
      loading.value = false
    }
  }

  // 获取用户信息
  const fetchUserInfo = async (userId) => {
    try {
      const response = await userApi.getUserInfo(userId)
      if (response.success) {
        user.value = response.data.user
        return response.data.user
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  }

  // 更新用户信息
  const updateUserInfo = async (userId, userData) => {
    try {
      loading.value = true
      const response = await userApi.updateUserInfo(userId, userData)
      
      if (response.success) {
        // 确保正确更新用户信息，包括ID字段
        const updatedUser = {
          ...user.value,
          ...response.data.user,
          _id: response.data.user._id || response.data.user.id || user.value._id,
          id: response.data.user.id || response.data.user._id || user.value.id
        }
        user.value = updatedUser
        
        showToast({
          message: '更新成功',
          type: 'success'
        })
        
        return { success: true, user: updatedUser }
      } else {
        throw new Error(response.message || '更新失败')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '更新失败'
      showToast({
        message: errorMessage,
        type: 'fail'
      })
      return { success: false, message: errorMessage }
    } finally {
      loading.value = false
    }
  }

  // 上传头像
  const uploadAvatar = async (userId, file) => {
    try {
      loading.value = true
      const formData = new FormData()
      formData.append('avatar', file)
      
      const response = await userApi.uploadAvatar(userId, formData)
      
      if (response.success) {
        user.value = { ...user.value, avatar: response.avatarUrl }
        
        showToast({
          message: '头像上传成功',
          type: 'success'
        })
        
        return { success: true, avatarUrl: response.avatarUrl }
      } else {
        throw new Error(response.message || '头像上传失败')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '头像上传失败'
      showToast({
        message: errorMessage,
        type: 'fail'
      })
      return { success: false, message: errorMessage }
    } finally {
      loading.value = false
    }
  }

  // 验证token
  const verifyToken = async () => {
    if (!token.value) return false
    
    try {
      const response = await userApi.verifyToken()
      if (response.success) {
        user.value = response.data.user
        return true
      } else {
        user.value = null
        setAuthToken(null)
        return false
      }
    } catch (error) {
      user.value = null
      setAuthToken(null)
      return false
    }
  }

  // 用户登出
  const logout = () => {
    user.value = null
    setAuthToken(null)
    
    showToast({
      message: '已退出登录',
      type: 'success'
    })
  }

  return {
    // 状态
    user,
    token,
    loading,
    
    // 计算属性
    isAuthenticated,
    userInfo,
    
    // 方法
    register,
    login,
    logout,
    fetchUserInfo,
    updateUserInfo,
    uploadAvatar,
    verifyToken,
    setAuthToken
  }
})