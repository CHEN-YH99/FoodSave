import { createRouter, createWebHistory } from 'vue-router'
import { ROUTE_NAMES } from '@/constants'

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
    }
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
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})
// 导出路由实例
export default router