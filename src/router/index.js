import { createRouter, createWebHistory } from 'vue-router'
// 定义路由
const routes = [
  {
    path: '/',
    name: 'Index',
    // component: index,
    //懒加载方式导入组件,必须配置vite.config.js才能使用“@”，不然会报错
    component: () => import('@/pages/Index.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/computed',
    name: 'Computed',
    // component: location,
    component: () => import('@/pages/Computed.vue'),
    meta: { title: '统计' }
  },
  {
    path: '/addfoot',
    name: 'Addfoot',
    // component: location,
    component: () => import('@/pages/Addfoot.vue'),
    meta: { 
      title: '地图', 
      hideHeader: true 
    }
  },
  {
    path: '/remind',
    name: 'Remind',
    // component: location,
    component: () => import('@/pages/Remind.vue'),
    meta: { title: '地图' }
  },
  {
    path: '/mine',
    name: 'Mine',
    // component: mine,
    component: () => import('@/pages/Mine.vue'),
    meta: { title: '我的' }
  },
  {
    path: '/food-detail/:id',
    name: 'FoodDetail',
    component: () => import('@/components/foot/FoodCardDetail.vue'),
    meta: {
      title: '食品详情',
      hideHeader: true,
      hideTabBar: true
    },
    props: true
  },
  {
    path: '/category/:categoryId',
    name: 'CategoryDetail',
    component: () => import('@/components/foot/FoodCardDetail.vue'),
    meta: {
      title: '分类详情',
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