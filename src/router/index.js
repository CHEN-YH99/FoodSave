import { createRouter, createWebHistory } from 'vue-router'
import { ROUTE_NAMES } from '@/constants' //导入constants配置好的路由名称

// 定义路由
const routes = [
  {
    path: '/',
    name: ROUTE_NAMES.INDEX,
    component: () => import('@/views/Index.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/computed',
    name: ROUTE_NAMES.COMPUTED,
    component: () => import('@/views/Computed.vue'),
    meta: {
      title: '统计',
      hideHeader: true
    }
  },
  {
    path: '/addfoot',
    name: ROUTE_NAMES.ADDFOOT,
    component: () => import('@/views/Addfoot.vue'),
    meta: {
      title: '添加食材',
      hideHeader: true
    }
  },
  {
    path: '/foodmap',
    name: ROUTE_NAMES.FOOD_MAP,
    component: () => import('@/views/FoodMap.vue'),
    meta: {
      title: '存放位置',
      hideHeader: true
    }
  },
  {
    path: '/mine',
    name: ROUTE_NAMES.MINE,
    component: () => import('@/views/Mine.vue'),
    meta: {
      title: '我的',
      hideHeader: true,
      hideTabBar: true
    },
  },
  {
    path: '/food-detail/:id',
    name: ROUTE_NAMES.FOOD_DETAIL,
    component: () => import('@/components/business/FoodCardDetail.vue'),
    meta: {
      title: '食品详情',
      hideHeader: true,
      hideTabBar: true
    },
    props: true
  },
  {
    path: '/category/:categoryId',
    name: ROUTE_NAMES.CATEGORY_DETAIL,
    component: () => import('@/components/business/FoodCardDetail.vue'),
    meta: {
      title: '分类详情',
      hideHeader: true,
      hideTabBar: true
    },
    props: true
  },
  {
    path: '/recipe/:id',
    name: ROUTE_NAMES.RECIPE_DETAIL,
    component: () => import('@/views/RecipeDetail.vue'),
    meta: {
      title: '菜谱详情',
      hideHeader: true,
      hideTabBar: true
    },
    props: true
  },
  {
    path: '/ingredient-recipes/:ingredientId',
    name: ROUTE_NAMES.INGREDIENT_RECIPES,
    component: () => import('@/views/IngredientRecipes.vue'),
    meta: {
      title: '食材菜谱',
      hideHeader: true,
      hideTabBar: true
    },
    props: true
  },
  {
    path: '/personal-information',
    name: ROUTE_NAMES.PERSONAL_INFORMATION,
    component: () => import('@/components/mine/PersonalInformation.vue'),
    meta: {
      title: '个人信息',
      hideHeader: true,
      hideTabBar: true
    }
  },
  {
    path: '/auth',
    name: ROUTE_NAMES.AUTH,
    component: () => import('@/views/Auth.vue'),
    meta: {
      title: '登录注册',
      hideHeader: true,
      hideTabBar: true
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫 - 登录鉴权
router.beforeEach(async (to, from, next) => {
  // 导入认证store
  const { useAuthStore } = await import('@/store/auth')
  const authStore = useAuthStore()
  
  // 不需要登录验证的页面（允许未登录访问）
  const publicPages = ['/auth', '/']
  const isPublicPage = publicPages.includes(to.path)
  
  // 如果是公开页面，直接放行
  if (isPublicPage) {
    next()
    return
  }
  
  // 检查是否有token
  if (!authStore.token) {
    next('/auth')
    return
  }
  
  // 验证token有效性
  const isValid = await authStore.verifyToken()
  if (!isValid) {
    next('/auth')
    return
  }
  
  next()
})

// 导出路由实例
export default router