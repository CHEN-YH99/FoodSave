/**
 * 应用常量配置
 */

// API 相关常量
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001/api',
  TIMEOUT: 10000,
  RETRY_TIMES: 3
}

// API 端点配置
export const API_ENDPOINTS = {
  FOOD: '/food',
  USER: '/user',
  ANALYTICS: '/analytics'
}

// 路由常量
export const ROUTE_NAMES = {
  INDEX: 'Index',
  COMPUTED: 'Computed',
  ADDFOOT: 'Addfoot',
  FOOD_MAP: 'FoodMap',
  MINE: 'Mine',
  FOOD_DETAIL: 'FoodDetail',
  CATEGORY_DETAIL: 'CategoryDetail',
  RECIPE_DETAIL: 'RecipeDetail',
  INGREDIENT_RECIPES: 'IngredientRecipes',
  PERSONAL_INFORMATION: 'PersonalInformation',
  AUTH: 'Auth'
}

// 食材过期状态
export const EXPIRY_STATUS = {
  EXPIRED: 'expired',
  EXPIRING_SOON: 'expiring_soon',
  FRESH: 'fresh'
}

// 食材过期天数阈值
export const EXPIRY_THRESHOLDS = {
  EXPIRED: 0,
  WARNING: 3,
  SAFE: 7
}

// 本地存储键名
export const STORAGE_KEYS = {
  TAKEN_OUT_FOODS: 'takenOutFoods',
  USER_PREFERENCES: 'userPreferences',
  ROUTE_CACHE: 'routeCache'
}

// 食材分类映射
export const CATEGORY_MAPPING = {
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

// 食材分类数据
export const FOOD_CATEGORIES = [
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
]

// 菜谱难度等级
export const RECIPE_DIFFICULTY = {
  EASY: '简单',
  MEDIUM: '中等',
  HARD: '困难'
}

// 消息类型
export const MESSAGE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'fail',
  WARNING: 'warning',
  INFO: 'info'
}

// 默认配置
export const DEFAULT_CONFIG = {
  MAX_VISIBLE_CATEGORIES: 6,
  MAX_RECENT_ITEMS: 4,
  RECENT_DAYS_LIMIT: 7,
  MAX_RECOMMENDED_RECIPES: 3,
  TOTAL_STOCK: 100
}