import express from 'express';
import Food from '../models/Food.js';

const router = express.Router();

// 获取所有食材 - 从MongoDB读取
router.get('/', async (req, res) => {
  try {
    console.log('📋 正在从MongoDB获取所有食材...');
    const foods = await Food.find().sort({ createdAt: -1 });
    console.log(`✅ 成功获取 ${foods.length} 条食材数据`);
    
    if (foods.length === 0) {
      console.log('⚠️ MongoDB中没有食材数据');
    }
    
    res.json(foods);
  } catch (error) {
    console.error('❌ 获取食材失败:', error);
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

    console.log(`搜索请求: "${q}"`);

    // 使用MongoDB的文本搜索和正则表达式搜索结合
    const searchQuery = {
      $or: [
        { $text: { $search: q } },
        { name: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { storageLocation: { $regex: q, $options: 'i' } },
        { synonyms: { $elemMatch: { $regex: q, $options: 'i' } } }
      ]
    };

    const foods = await Food.find(searchQuery)
      .limit(parseInt(limit))
      .sort({ 
        score: { $meta: 'textScore' },
        createdAt: -1 
      });

    console.log(`搜索结果: 找到 ${foods.length} 个匹配项`);
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

    console.log(`建议请求: "${q}"`);

    // 优先匹配名称开头的食材
    const suggestions = await Food.find({
      $or: [
        { name: { $regex: `^${q}`, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { synonyms: { $elemMatch: { $regex: q, $options: 'i' } } }
      ]
    })
    .limit(parseInt(limit))
    .select('name category storageLocation expireDate');

    console.log(`建议结果: 找到 ${suggestions.length} 个建议`);
    res.json(suggestions);
  } catch (error) {
    console.error('获取建议错误:', error);
    res.status(500).json({ message: '获取建议失败', error: error.message });
  }
});

// 根据ID获取单个食材
router.get('/:id', async (req, res) => {
  try {
    console.log(`📋 正在获取食材ID: ${req.params.id}`);
    const food = await Food.findById(req.params.id);
    
    if (!food) {
      console.log(`⚠️ 未找到食材ID: ${req.params.id}`);
      return res.status(404).json({ message: '食材不存在' });
    }
    
    console.log(`✅ 成功获取食材: ${food.name}`);
    res.json(food);
  } catch (error) {
    console.error('❌ 获取单个食材失败:', error);
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