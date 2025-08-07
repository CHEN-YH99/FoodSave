import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import foodRoutes from './routes/food.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// MongoDB连接
// 定义一个异步函数，用于连接数据库
// 定义一个异步函数，用于连接数据库
const connectDB = async () => {
  try {
    // 使用mongoose连接数据库，指定数据库地址
    await mongoose.connect('mongodb://localhost:27017/food_management');
    // 连接成功后，打印提示信息
    // console.log('MongoDB连接成功');
  } catch (error) {
    // 连接失败后，打印错误信息，并退出进程
    // console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
};

// 路由
app.use('/api/food', foodRoutes);

// 启动服务器
// 定义一个异步函数startServer，用于启动服务器
const startServer = async () => {
  // 连接数据库
  await connectDB();
  // 监听端口，启动服务器
  app.listen(PORT, () => {
    // 服务器启动成功
  });
};

startServer();