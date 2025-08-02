<template>
  <!-- 食品状态栏 -->
  <div class="footstore commonstyle">
    <van-button class="danger" round @click="handleExpiryWarningClick" :loading="loading">
      <van-icon name="warning-o" />
      即将过期: {{ loading ? '...' : outdate }}项
    </van-button>
    <van-button class="warning" round @click="handleLowStockClick" :loading="loading">
      <van-icon name="shop-o" />
      库存不足: {{ loading ? '...' : lowstock }}项
    </van-button>
  </div>
  <!-- 食品分类栏 -->
  <div class="food-classification">
    <van-grid :column-num="4" :gutter="10" :border="false">
      <van-grid-item v-for="item in foodCategories" :key="item.id" @click="handleCategoryClick(item)">
        <div class="category-item">
          <div class="icon-wrapper" :style="{ backgroundColor: item.bgColor }">
            <van-icon :name="item.icon" :color="item.iconColor" size="25" />
          </div>
          <span class="category-text">{{ item.name }}</span>
        </div>
      </van-grid-item>
    </van-grid>
  </div>
  <!-- 智能推荐 -->
  <div class="recommend commonstyle">
    <div class="recommend-header">
      <div class="header-left">
        <van-icon name="bulb-o" color="#ff9500" size="25" />
        <span class="recommend-title">智能推荐</span>
      </div>
    </div>

    <div class="recommend-card" @click="handleRecommendClick">
      <div class="card-left">
        <div class="ingredient-section">
          <van-image width="70" height="70" :src="recommendData.ingredient.image" fit="cover" round
            class="ingredient-img" />
          <div class="ingredient-info">
            <div class="ingredient-name">{{ recommendData.ingredient.name }}</div>
            <div class="ingredient-status" :style="{ color: getExpiryColor(recommendData.ingredient.expiryDays) }">
              {{ recommendData.ingredient.expiryDays <= 0 ? '已过期' : recommendData.ingredient.expiryDays <= 3 ?
                `${recommendData.ingredient.expiryDays}天后过期` : '即将过期' }} </div>
            </div>
          </div>

          <div class="arrow-section">
            <van-icon name="arrow" color="#ff9500" size="18" />
            <span class="suggest-text">推荐菜谱:</span>
          </div>
        </div>

        <div class="card-right">
          <div class="recipe-section">
            <van-image width="60" height="60" :src="recommendData.recipe.image" fit="cover" round class="recipe-img" />
            <div class="recipe-name">{{ recommendData.recipe.name }}</div>
          </div>
          <van-icon name="arrow" color="#c8c9cc" size="16" class="more-icon" />
        </div>
      </div>
    </div>
    <!-- 最近添加 -->
    <div class="recently-added commonstyle">
      <div class="recently-header">
        <div class="header-left">
          <van-icon name="clock-o" color="rgb(0, 150, 5)" size="25" />
          <span class="recently-title">最近添加</span>
        </div>
      </div>

      <div class="recently-list">
        <van-cell-group :border="false">
          <van-cell v-for="item in recentlyAdded" :key="item.id" @click="handleRecentItemClick(item)" clickable
            class="recent-item">
            <template #icon>
              <van-image :src="item.image" width="50" height="50" fit="cover" round class="item-image" />
            </template>

            <template #title>
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-expiry" :style="{ color: getExpiryColor(item.expiryDays) }">
                  <van-icon name="clock-o" size="12" />
                  {{ item.expiryDays }}天后过期
                </div>
              </div>
            </template>

            <template #right-icon>
              <van-icon name="ellipsis" color="#c8c9cc" size="18" />
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <div class="view-all" @click="handleViewAllClick">
        <span class="view-all-text">查看全部</span>
      </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
// 导入本地图片
import potatoImg from '@/assets/images/potato.jpeg';
import noddlesImg from '@/assets/images/noddles.jpeg';
import milkImg from '@/assets/images/milk.svg';
import eggsImg from '@/assets/images/eggs.svg';
import breadImg from '@/assets/images/bread.svg';
import saladImg from '@/assets/images/salad.svg';

// 食材数据
const foodData = ref([]);
const loading = ref(false);
const total = ref(100); //总库存

// 计算即将过期的食材数量（3天内过期）
const outdate = computed(() => {
  const today = new Date();
  return foodData.value.filter(item => {
    const expireDate = new Date(item.expireDate);
    const diffTime = expireDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0; // 3天内过期且未过期
  }).length;
});

// 计算库存不足的食材数量（这里可以根据实际需求定义库存不足的标准）
const lowstock = computed(() => {
  // 库存100减去已使用数量
  // console.log('总库存:', total.value, '已使用:', foodData.value.length);
  
  return total.value - foodData.value.length;
});

// 食物分类数据
const foodCategories = ref([
  {
    id: 1,
    name: '生鲜',
    icon: 'shop-o',
    bgColor: '#e8f5e8',
    iconColor: '#52c41a'
  },
  {
    id: 2,
    name: '冷冻',
    icon: 'fire-o',
    bgColor: '#e6f7ff',
    iconColor: '#1890ff'
  },
  {
    id: 3,
    name: '干货',
    icon: 'flower-o',
    bgColor: '#fff7e6',
    iconColor: '#fa8c16'
  },
  {
    id: 4,
    name: '饮料',
    icon: 'shopping-cart-o',
    bgColor: '#fff0f6',
    iconColor: '#eb2f96'
  }
]);

// 推荐数据 - 基于即将过期的食材
const recommendData = computed(() => {
  const ingredient = getExpiringIngredient.value;

  // 根据食材推荐菜谱（简单的映射关系）
  const recipeMap = {
    '番茄': { name: '意面', image: noddlesImg },
    '土豆': { name: '土豆丝', image: potatoImg },
    '鸡蛋': { name: '炒蛋', image: eggsImg },
    '牛奶': { name: '奶昔', image: milkImg },
    '面包': { name: '三明治', image: breadImg },
    '蔬菜': { name: '蔬菜沙拉', image: saladImg }
  };

  let recipe = { name: '意面', image: noddlesImg };
  for (const [key, value] of Object.entries(recipeMap)) {
    if (ingredient.name.includes(key)) {
      recipe = value;
      break;
    }
  }

  return {
    ingredient,
    recipe
  };
});

// 从数据库加载食材数据
const loadFoodData = async () => {
  try {
    loading.value = true;
    console.log('🔗 正在从MongoDB加载食材数据...');
    const response = await axios.get('http://localhost:3001/api/food');

    if (response.data && response.data.length > 0) {
      foodData.value = response.data.map(item => ({
        ...item,
        id: item._id || item.id
      }));
      console.log(`✅ 成功加载 ${foodData.value.length} 条食材数据`);
      // console.log('库存计算 - 总库存:', total.value, '已使用:', foodData.value.length, '剩余:', total.value - foodData.value.length);
    } else {
      console.warn('⚠️ MongoDB中没有找到食材数据');
      foodData.value = [];
    }
  } catch (error) {
    console.error('❌ 从MongoDB加载数据失败:', error);
    // 如果加载失败，使用默认数据
    foodData.value = [];
  } finally {
    loading.value = false;
  }
};

// 计算食材距离过期的天数
const calculateExpiryDays = (expireDate) => {
  const today = new Date();
  const expire = new Date(expireDate);
  const diffTime = expire - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// 获取最近添加的食材（按添加时间排序，取前4个）
const recentlyAdded = computed(() => {
  const sortedData = [...foodData.value]
    .sort((a, b) => new Date(b.createdAt || b.addedDate || Date.now()) - new Date(a.createdAt || a.addedDate || Date.now()))
    .slice(0, 4);

  return sortedData.map(item => ({
    id: item.id,
    name: item.name,
    image: getItemImage(item.name, item.category),
    expiryDays: calculateExpiryDays(item.expireDate),
    category: item.category,
    expireDate: item.expireDate
  }));
});

// 根据食材名称和分类获取对应图片
const getItemImage = (name, category) => {
  // 根据食材名称匹配图片
  const imageMap = {
    '牛奶': milkImg,
    '鸡蛋': eggsImg,
    '面包': breadImg,
    '蔬菜': saladImg,
    '沙拉': saladImg,
    '土豆': potatoImg,
    '面条': noddlesImg
  };

  // 先尝试精确匹配
  for (const [key, img] of Object.entries(imageMap)) {
    if (name.includes(key)) {
      return img;
    }
  }

  // 根据分类匹配默认图片
  const categoryImageMap = {
    '乳制品': milkImg,
    '蛋类': eggsImg,
    '主食': breadImg,
    '生鲜': saladImg,
    '蔬菜': saladImg,
    '肉类': potatoImg
  };

  return categoryImageMap[category] || saladImg; // 默认图片
};

// 获取即将过期的食材用于智能推荐
const getExpiringIngredient = computed(() => {
  const expiringItems = foodData.value.filter(item => {
    const days = calculateExpiryDays(item.expireDate);
    return days <= 3 && days >= 0;
  }).sort((a, b) => calculateExpiryDays(a.expireDate) - calculateExpiryDays(b.expireDate));

  if (expiringItems.length > 0) {
    const item = expiringItems[0];
    return {
      name: item.name,
      image: getItemImage(item.name, item.category),
      expiryDays: calculateExpiryDays(item.expireDate)
    };
  }

  return {
    name: '番茄',
    image: potatoImg,
    expiryDays: 2
  };
});

// 分类点击处理
const handleCategoryClick = (category) => {
  console.log('点击了分类:', category.name);
};

// 推荐点击处理
const handleRecommendClick = () => {
  console.log('点击了推荐:', recommendData.value);
};

// 最近添加项点击处理
const handleRecentItemClick = (item) => {
  console.log('点击了最近添加项:', item);
};

// 查看全部点击处理
const handleViewAllClick = () => {
  console.log('点击了查看全部');
};

// 过期预警点击处理
const handleExpiryWarningClick = () => {
  const expiringItems = foodData.value.filter(item => {
    const days = calculateExpiryDays(item.expireDate);
    return days <= 3 && days >= 0;
  }).sort((a, b) => calculateExpiryDays(a.expireDate) - calculateExpiryDays(b.expireDate));

  if (expiringItems.length === 0) {
    import('vant').then(({ showToast }) => {
      showToast({
        message: '暂无即将过期的食材',
        type: 'success'
      });
    });
    return;
  }

  // 显示过期食材列表
  const itemList = expiringItems.map(item => {
    const days = calculateExpiryDays(item.expireDate);
    return `${item.name} (${days}天后过期)`;
  }).join('\n');

  import('vant').then(({ showDialog }) => {
    showDialog({
      title: '即将过期食材',
      message: itemList,
      confirmButtonText: '知道了'
    });
  });

  console.log('即将过期的食材:', expiringItems);
};

// 库存不足点击处理
const handleLowStockClick = () => {
  const currentStock = lowstock.value;
  const usedStock = foodData.value.length;
  const totalStock = total.value;
  
  import('vant').then(({ showDialog }) => {
    showDialog({
      title: '库存统计',
      message: `总库存: ${totalStock}项\n已使用: ${usedStock}项\n剩余库存: ${currentStock}项`,
      confirmButtonText: '知道了'
    });
  });
  
  console.log('库存统计:', { total: totalStock, used: usedStock, remaining: currentStock });
};

// 获取过期状态颜色
const getExpiryColor = (days) => {
  if (days <= 0) return '#e74c3c'; // 已过期
  if (days <= 1) return '#e74c3c'; // 1天内过期
  if (days <= 3) return '#f39c12'; // 3天内过期
  return '#27ae60'; // 正常
};

// 页面挂载时加载数据
onMounted(() => {
  loadFoodData();
});
</script>

<style scoped lang="scss">
// 公共样式
.commonstyle {
  width: 90%;
  margin: 20px auto;
  background-color: white;
  border-radius: 15px;
  padding: 15px;
}

// 食品状态
.footstore {
  display: flex;
  justify-content: space-around;
  align-items: center;

  .danger {
    background-color: rgb(251, 212, 212);
    color: rgb(255, 0, 0);
    transition: all 0.3s ease;

    &:hover {
      background-color: rgb(248, 180, 180);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 0, 0, 0.2);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .warning {
    background-color: rgb(255, 245, 202);
    color: rgb(255, 145, 0);
    transition: all 0.3s ease;

    &:hover {
      background-color: rgb(255, 235, 180);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 145, 0, 0.2);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

// 食品分类
.food-classification {
  .van-grid-item {
    :deep(.van-grid-item__content) {
      border-radius: 15px;
    }
  }

  .category-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .icon-wrapper {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }

    .category-text {
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }
  }
}

// 智能推荐
.recommend {
  display: flex;
  flex-direction: column;
  align-items: stretch;

  .recommend-header {
    margin-bottom: 16px;

    .header-left {
      display: flex;
      align-items: center;

      .recommend-title {
        margin-left: 8px;
        font-size: 17px;
        font-weight: 600;
        color: #2c3e50;
      }
    }
  }

  .recommend-card {
    background: linear-gradient(135deg, rgba(0, 150, 5, 0.2) 0%, #fff 100%);
    border: 1px solid #f0f0f0;
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      border-color: #ff9500;
    }

    &:active {
      transform: translateY(0);
    }

    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-left {
      display: flex;
      align-items: center;
      flex: 1;

      .ingredient-section {
        display: flex;
        align-items: center;
        margin-right: 20px;

        .ingredient-img {
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .ingredient-info {
          margin-left: 12px;

          .ingredient-name {
            font-size: 15px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 4px;
          }

          .ingredient-status {
            font-size: 12px;
            color: #e74c3c;
            background: #ffeaea;
            padding: 2px 8px;
            border-radius: 10px;
            display: inline-block;
          }
        }
      }

      .arrow-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 16px;

        .suggest-text {
          font-size: 12px;
          color: #7f8c8d;
          margin-top: 4px;
          white-space: nowrap;
        }
      }
    }

    .card-right {
      display: flex;
      align-items: center;

      .recipe-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-right: 12px;

        .recipe-img {
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 8px;
        }

        .recipe-name {
          font-size: 14px;
          font-weight: 600;
          color: #2c3e50;
          text-align: center;
        }
      }

      .more-icon {
        opacity: 0.6;
        transition: opacity 0.2s;
      }
    }

    &:hover .more-icon {
      opacity: 1;
    }
  }
}

// 最近添加
.recently-added {
  display: flex;
  flex-direction: column;
  align-items: stretch;

  .recently-header {
    margin-bottom: 16px;

    .header-left {
      display: flex;
      align-items: center;

      .recently-title {
        margin-left: 8px;
        font-size: 17px;
        font-weight: 600;
        color: #2c3e50;
      }
    }
  }

  .recently-list {
    margin-bottom: 16px;

    :deep(.van-cell-group) {
      background: transparent;
    }

    .recent-item {
      :deep(.van-cell) {
        background: transparent;
        padding: 12px 0;
        border-bottom: 1px solid #f5f5f5;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background: #f8f9fa;
          border-radius: 8px;
        }

        &:active {
          background: #e9ecef;
        }
      }

      .item-image {
        margin-right: 12px;
        border: 2px solid #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .item-info {
        display: flex;
        flex-direction: column;

        .item-name {
          font-size: 16px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .item-expiry {
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        }
      }
    }
  }

  .view-all {
    text-align: center;
    padding: 12px 0;
    cursor: pointer;
    border-radius: 8px;
    transition: background-color 0.2s;

    &:hover {
      background: #f8f9fa;
    }

    &:active {
      background: #e9ecef;
    }

    .view-all-text {
      color: rgb(0, 150, 5);
      font-size: 15px;
      font-weight: 600;
    }
  }
}
</style>