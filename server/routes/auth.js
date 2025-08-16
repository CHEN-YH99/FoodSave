import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password, nickname } = req.body;

    // 基本验证
    if (!username || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: '所有字段都是必需的'
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱或手机号已存在'
      });
    }

    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 随机分配默认头像
    const defaultAvatars = [
      '/src/assets/avatars/avatar1.svg',
      '/src/assets/avatars/avatar2.svg',
      '/src/assets/avatars/avatar3.svg',
      '/src/assets/avatars/avatar4.svg',
      '/src/assets/avatars/avatar5.svg',
      '/src/assets/avatars/avatar6.svg'
    ];
    const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    // 创建新用户
    const newUser = new User({
      username,
      email,
      phone,
      password: hashedPassword,
      nickname: nickname || username,
      avatar: randomAvatar
    });

    await newUser.save();

    // 生成JWT token
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: newUser._id,
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          phone: newUser.phone,
          nickname: newUser.nickname,
          avatar: newUser.avatar
        }
      }
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    // 基本验证
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 查找用户，支持用户名、邮箱、手机号登录
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username },
        { phone: username }
      ]
    }).lean(false);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: '用户不存在'
      });
    }

    console.log('登录用户信息:', {
      id: user._id,
      username: user.username,
      loginType: username.includes('@') ? 'email' : /^\d+$/.test(username) ? 'phone' : 'username',
      avatar: user.avatar
    });

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: '密码错误'
      });
    }

    // 根据rememberMe设置token过期时间
    const tokenExpiry = rememberMe ? '7d' : '24h';

    // 生成JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        rememberMe: rememberMe || false
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: tokenExpiry }
    );

    // 重新查询用户以确保获取最新数据
    const latestUser = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        rememberMe: rememberMe || false,
        user: {
          id: latestUser._id,
          _id: latestUser._id,
          username: latestUser.username,
          email: latestUser.email,
          phone: latestUser.phone,
          nickname: latestUser.nickname,
          avatar: latestUser.avatar,
          bio: latestUser.bio || '',
          createdAt: latestUser.createdAt,
          updatedAt: latestUser.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新用户信息
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // 验证userId
    if (!userId || userId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: '用户ID不能为空'
      });
    }

    // 获取当前用户信息
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 检查唯一性字段（用户名、邮箱、手机号）
    const uniqueFields = ['username', 'email', 'phone'];
    for (const field of uniqueFields) {
      if (updateData[field] && updateData[field] !== currentUser[field]) {
        // 检查新值是否已被其他用户使用
        const existingUser = await User.findOne({
          [field]: updateData[field],
          _id: { $ne: userId } // 排除当前用户
        });

        if (existingUser) {
          const fieldNames = {
            username: '用户名',
            email: '邮箱',
            phone: '手机号'
          };
          return res.status(400).json({
            success: false,
            message: `${fieldNames[field]}已被其他用户使用`
          });
        }
      }
    }

    // 更新用户信息
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, select: '-password' }
    );

    // 验证更新是否成功
    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: '更新失败'
      });
    }

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: {
        user: {
          ...updatedUser.toObject(),
          id: updatedUser._id,
          _id: updatedUser._id
        }
      }
    });

  } catch (error) {
    console.error('更新用户信息错误:', error);

    // 处理MongoDB唯一性约束错误
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldNames = {
        username: '用户名',
        email: '邮箱',
        phone: '手机号'
      };
      return res.status(400).json({
        success: false,
        message: `${fieldNames[field] || '该字段'}已存在`
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取用户信息
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // 验证userId
    if (!userId || userId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: '用户ID不能为空'
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          id: user._id,
          _id: user._id
        }
      }
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 验证token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          id: user._id,
          _id: user._id
        }
      }
    });

  } catch (error) {
    console.error('验证token错误:', error);
    res.status(401).json({
      success: false,
      message: 'token无效'
    });
  }
});

export default router;