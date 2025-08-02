# 食材管理系统

基于Vue 3 + Express + MongoDB的食材管理系统，支持智能搜索功能。

## 功能特点

- 🔍 智能搜索：支持食材名称、分类、存储位置的模糊搜索
- 📱 响应式设计：适配移动端和桌面端
- 🗄️ MongoDB存储：数据持久化存储
- ⚡ 实时搜索：输入即搜索，快速响应
- 📷 扫码功能：支持二维码扫描（模拟）

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动MongoDB
确保MongoDB服务正在运行（默认端口27017）

### 3. 初始化数据库
```bash
npm run init
```

### 4. 启动服务器
```bash
npm run server
```

### 5. 启动前端开发服务器
```bash
npm run dev
```

### 或者同时启动前后端
```bash
npm run dev:full
```

## 搜索功能说明

Head组件完全基于MongoDB实现搜索功能：

- **MongoDB数据源**：直接从MongoDB的`food_management`数据库读取数据
- **实时搜索**：输入时自动搜索MongoDB中的食材数据
- **搜索建议**：短输入时显示MongoDB中的搜索建议
- **搜索结果**：长输入时显示MongoDB中的详细搜索结果
- **智能匹配**：支持食材名称、分类、存储位置、同义词的模糊搜索
- **扫码搜索**：支持二维码扫描后在MongoDB中搜索（模拟功能）
- **备选方案**：仅在MongoDB不可用时使用本地缓存数据

## API接口

- `GET /api/food` - 获取所有食材
- `GET /api/food/search?q=关键词` - 搜索食材
- `GET /api/food/suggestions?q=关键词` - 获取搜索建议

## 技术栈

- **前端**: Vue 3, Vant UI, Axios, Fuse.js
- **后端**: Express.js, MongoDB, Mongoose
- **构建工具**: Vite
