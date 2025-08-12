# FoodSave - 智能食材管理系统

## 项目简介

FoodSave是一个基于Vue 3的智能食材管理系统，帮助用户管理家庭食材，提供过期提醒、智能推荐菜谱等功能。

## 技术栈

- **前端框架**: Vue 3 + Composition API
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **UI组件库**: Vant 4
- **样式预处理**: SCSS
- **构建工具**: Vite
- **数据库**: MongoDB
- **后端**: Node.js + Express

## 项目结构

```
src/
├── views/                  # 页面组件
│   ├── Index.vue          # 首页
│   ├── Addfoot.vue        # 添加食材页
│   ├── Computed.vue       # 统计页面
│   ├── FoodMap.vue        # 食材地图
│   ├── Mine.vue           # 个人中心
│   ├── RecipeDetail.vue   # 菜谱详情
│   └── IngredientRecipes.vue # 食材菜谱列表
├── components/             # 组件
│   ├── common/            # 通用组件
│   │   ├── Head.vue       # 头部组件
│   │   └── TabBar.vue     # 底部导航
│   └── business/          # 业务组件
│       ├── SmartRecommendation.vue # 智能推荐
│       └── FoodCardDetail.vue      # 食材详情卡片
├── services/              # 服务层
│   └── api.js            # API服务
├── utils/                 # 工具函数
│   └── index.js          # 通用工具
├── hooks/                 # 组合式API
│   ├── useFood.js        # 食材管理Hook
│   └── useRecipe.js      # 菜谱管理Hook
├── constants/             # 常量配置
│   └── index.js          # 项目常量
├── types/                 # 类型定义
│   └── index.js          # 数据类型
├── store/                 # 状态管理
│   ├── index.js          # 主store
│   ├── addfoot.js        # 添加食材store
│   └── computed.js       # 统计store
├── router/                # 路由配置
│   └── index.js          # 路由定义
└── assets/                # 静态资源
    ├── images/           # 图片资源
    └── style/            # 样式文件
```

## 核心功能

### 1. 食材管理
- 添加、编辑、删除食材
- 食材分类管理
- 存储位置管理
- 过期时间追踪

### 2. 智能推荐
- 基于即将过期食材的菜谱推荐
- 多食材多菜谱展示
- 随机刷新推荐内容
- 一键跳转制作步骤

### 3. 过期提醒
- 实时计算过期天数
- 过期状态分类显示
- 智能颜色标识
- 批量操作支持

### 4. 统计分析
- 食材使用统计
- 过期率分析
- 分类占比展示
- 趋势图表显示

## 企业级特性

### 1. 架构设计
- **分层架构**: 表现层、业务层、服务层、工具层
- **模块化**: 按功能模块划分，职责清晰
- **组合式API**: 使用Vue 3 Composition API提高代码复用性
- **类型安全**: JSDoc类型注释，提高代码可维护性

### 2. 代码规范
- **统一命名**: 遵循Vue官方命名规范
- **错误处理**: 统一的错误处理机制
- **代码注释**: 详细的函数和模块注释
- **文件组织**: 清晰的目录结构和文件命名

### 3. 性能优化
- **懒加载**: 路由和组件懒加载
- **缓存机制**: 数据缓存和本地存储
- **防抖节流**: 用户交互优化
- **内存管理**: 及时清理事件监听器

### 4. 可维护性
- **常量管理**: 统一的常量配置
- **工具函数**: 通用功能抽取
- **Hook复用**: 业务逻辑组合式复用
- **服务封装**: API调用统一封装

## 开发指南

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖
```bash
npm install
# 或
yarn install
```

### 开发运行
```bash
npm run dev
# 或
yarn dev
```

### 构建部署
```bash
npm run build
# 或
yarn build
```

## 代码规范

### 1. 组件命名
- 页面组件：PascalCase (如: `Index.vue`)
- 业务组件：PascalCase (如: `SmartRecommendation.vue`)
- 通用组件：PascalCase (如: `Head.vue`)

### 2. 函数命名
- 事件处理：`handle` + 动作 (如: `handleClick`)
- 工具函数：动词开头 (如: `calculateExpiryDays`)
- Hook函数：`use` + 功能 (如: `useFood`)

### 3. 常量命名
- 全大写下划线分隔 (如: `API_ENDPOINTS`)
- 按功能分组管理

### 4. 文件组织
- 按功能模块划分目录
- 相关文件就近放置
- 避免深层嵌套

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 更新日志

### v2.0.0 (2025-01-12)
- 🎉 重构项目架构，采用企业级标准
- ✨ 优化智能推荐功能，支持多食材多菜谱
- 🔧 引入组合式API，提高代码复用性
- 📦 重新组织项目结构，提高可维护性
- 🐛 修复已知问题，提升用户体验

### v1.0.0 (2024-12-01)
- 🎉 项目初始版本
- ✨ 基础食材管理功能
- ✨ 过期提醒功能
- ✨ 简单菜谱推荐