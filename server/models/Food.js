import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true // 为搜索创建索引
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  storageLocation: {
    type: String,
    required: true
  },
  purchaseDate: {
    type: String,
    required: true
  },
  shelfLife: {
    type: String,
    required: true
  },
  expireDate: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  unit: {
    type: String,
    default: '千克'
  },
  synonyms: [{
    type: String
  }],
  description: String,
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  }
}, {
  timestamps: true
});

// 创建文本搜索索引
foodSchema.index({
  name: 'text',
  category: 'text',
  storageLocation: 'text',
  synonyms: 'text'
});

export default mongoose.model('Food', foodSchema);