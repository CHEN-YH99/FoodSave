import express from 'express';
import Food from '../models/Food.js';

const router = express.Router();

// 获取所有食材 - 从MongoDB读取
router.get('/', async (req, res) => {
  try {
    const foods = await Food.find().sort({ createdAt: -1 });
    
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: '获取食材失败', error: error.message });
  }
});

// 搜索食材
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    
    if (!q) {
      return res.json([]);
    }

    // 转义特殊正则表达式字符
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 使用正则表达式搜索，避免文本索引问题
    const searchQuery = {
      $or: [
        { name: { $regex: escapedQuery, $options: 'i' } },
        { category: { $regex: escapedQuery, $options: 'i' } },
        { storageLocation: { $regex: escapedQuery, $options: 'i' } },
        { synonyms: { $elemMatch: { $regex: escapedQuery, $options: 'i' } } },
        { description: { $regex: escapedQuery, $options: 'i' } }
      ]
    };

    const foods = await Food.find(searchQuery)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json(foods);
  } catch (error) {
    console.error('搜索错误:', error);
    res.status(500).json({ message: '搜索失败', error: error.message });
  }
});

// 获取搜索建议
router.get('/suggestions', async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    
    if (!q) {
      return res.json([]);
    }

    // 转义特殊正则表达式字符
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 优先匹配名称开头的食材
    const suggestions = await Food.find({
      $or: [
        { name: { $regex: `^${escapedQuery}`, $options: 'i' } },
        { name: { $regex: escapedQuery, $options: 'i' } },
        { synonyms: { $elemMatch: { $regex: escapedQuery, $options: 'i' } } }
      ]
    })
    .limit(parseInt(limit))
    .select('name category storageLocation expireDate')
    .sort({ name: 1 });

    res.json(suggestions);
  } catch (error) {
    console.error('获取建议错误:', error);
    res.status(500).json({ message: '获取建议失败', error: error.message });
  }
});

// 根据ID获取单个食材
router.get('/:id', async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    
    if (!food) {
      return res.status(404).json({ message: '食材不存在' });
    }
    
    res.json(food);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: '无效的食材ID格式' });
    }
    res.status(500).json({ message: '获取食材失败', error: error.message });
  }
});

// 添加新食材
router.post('/', async (req, res) => {
  try {
    const food = new Food(req.body);
    await food.save();
    res.status(201).json(food);
  } catch (error) {
    res.status(400).json({ message: '添加食材失败', error: error.message });
  }
});

// 更新食材
router.put('/:id', async (req, res) => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!food) {
      return res.status(404).json({ message: '食材不存在' });
    }
    res.json(food);
  } catch (error) {
    res.status(400).json({ message: '更新食材失败', error: error.message });
  }
});

// 删除食材
router.delete('/:id', async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) {
      return res.status(404).json({ message: '食材不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

export default router;