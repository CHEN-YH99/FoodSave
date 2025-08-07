<template>
  <div class="container">
    <!-- 头部搜索栏 -->
    <div class="head">
      <van-search v-model="searchvalue" placeholder="搜索食材..." @input="handleInput" @search="search" @focus="handleFocus"
        @blur="handleBlur" class="search" />
      <van-icon name="scan" color="rgb(0 150 5)" class="van-icon" @click="scancode" size="25" />
    </div>

    <!-- 扫码弹窗 -->
    <van-popup v-model:show="showScanPopup" position="center" :style="{ width: '90%', height: '70%' }" round closeable
      close-icon="cross" @close="closeScanPopup">
      <div class="scan-container">
        <div class="scan-header">
          <van-nav-bar title="扫描二维码" left-arrow @click-left="closeScanPopup" />
          <div class="scan-desc">
            <p>将二维码放入框内，即可自动扫描</p>
          </div>
        </div>

        <div class="scan-content">
          <!-- 摄像头扫码识别 -->
          <div class="camera">
            <video ref="video" id="video" autoplay></video>
            <div class="border">
              <!-- 扫码框的四个角和中间区域 -->
              <div class="item-1 item"></div>
              <div class="item-2 item"></div>
              <div class="item-3 item"></div>
              <div class="item-4 item"></div>
              <div class="plate-rank-content item-5">
                <div class="angle-border left-top-border" :class="{ 'code-detected': codeDetected }"></div>
                <div class="angle-border right-top-border" :class="{ 'code-detected': codeDetected }"></div>
                <div class="angle-border left-bottom-border" :class="{ 'code-detected': codeDetected }"></div>
                <div class="angle-border right-bottom-border" :class="{ 'code-detected': codeDetected }"></div>
                <div class="solid" :class="{ 'code-detected': codeDetected }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="scan-actions">
          <van-button type="primary" size="large" @click="startScan" :loading="isScanning"
            loading-text="正在识别二维码/条形码...">
            {{ isScanning ? '正在识别中...' : '开始扫码' }}
          </van-button>

          <van-button plain size="large" @click="toggleFlash" class="flash-btn">
            <van-icon :name="flashOn ? 'fire' : 'fire-o'" />
            {{ flashOn ? '关闭闪光灯' : '打开闪光灯' }}
          </van-button>
        </div>

        <div class="scan-tips">
          <van-notice-bar left-icon="info-o" :scrollable="false" :type="codeDetected ? 'warning' : 'primary'">
            {{ codeDetected ? '检测到码，正在读取内容...' : '支持二维码和条形码识别，请将码完整置于扫描框内' }}
          </van-notice-bar>
        </div>
      </div>
    </van-popup>

    <!-- 搜索建议/结果弹出框 -->
    <div class="dropdown" v-if="showDropdown">
      <!-- 搜索建议 -->
      <template v-if="showSuggestions">
        <div v-for="item in filteredSuggestions" :key="item.item.id" @click="selectItem(item.item)"
          class="dropdown-item">
          <div class="name">{{ item.item.name }}</div>
          <div class="meta">
            <span class="category">{{ item.item.category }}</span>
            <span class="location">{{ item.item.storageLocation }}</span>
          </div>
        </div>
      </template>

      <!-- 搜索结果 -->
      <template v-else-if="searchResults.length > 0 && searchvalue">
        <div class="section-title">搜索结果 ({{ searchResults.length }})</div>
        <div v-for="item in searchResults" :key="item.item.id" @click="selectSearchResult(item.item)"
          class="dropdown-item">
          <div class="name">{{ item.item.name }}</div>
          <div class="meta">
            <span class="category">{{ item.item.category }}</span>
            <span class="location">{{ item.item.storageLocation }}</span>
            <span :class="getExpireClass(item.item.expireDate)">{{ item.item.expireDate }}</span>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <template v-else-if="searchResults.length === 0 && searchvalue">
        <div class="empty-message">
          <van-empty description="没有找到匹配的食材" />
        </div>
      </template>
    </div>


  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import axios from 'axios';
import Fuse from 'fuse.js';
import { nanoid } from 'nanoid';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

// 响应式变量
const searchvalue = ref('');
const data = ref([]); // 存储食材数据
const fuse = ref(null); // Fuse实例
const filteredSuggestions = ref([]); // 搜索建议
const searchResults = ref([]); // 搜索结果
const showSuggestions = ref(false); // 是否显示建议列表
const showDropdown = ref(false); // 是否显示下拉框

// 扫码相关变量
const showScanPopup = ref(false); // 是否显示扫码弹窗
const isScanning = ref(false); // 是否正在扫描
const flashOn = ref(false); // 闪光灯状态
const video = ref(null); // 视频元素引用
let stream = null; // 媒体流
let codeReader = null; // 二维码识别器
let scanInterval = null; // 扫描间隔定时器
let detectionCanvas = null; // 用于码检测的画布
let detectionContext = null; // 画布上下文
const scanResult = ref(''); // 扫描结果
const codeDetected = ref(false); // 是否检测到码

// 防抖函数
const debounce = (fn, delay = 300) => {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

// 添加一个标志来跟踪是否正在执行搜索
const isSearching = ref(false);

// 初始化Fuse
const initFuse = (items) => {
  return new Fuse(items, {
    keys: [
      { name: 'name', weight: 3 },
      { name: 'category', weight: 2 },
      { name: 'storageLocation', weight: 1 },
      { name: 'synonyms', weight: 2 }
    ],
    threshold: 0.4, // 容错率设置
    includeScore: true,
    includeMatches: true
  });
};

// 从MongoDB加载食材数据
const loadFoodData = async () => {
  try {
    // console.log('🔗 正在从MongoDB加载食材数据...');
    const response = await axios.get('http://localhost:3001/api/food');
    // console.log(response.data);

    if (response.data && response.data.length > 0) {
      // console.log(`✅ 成功从MongoDB加载 ${response.data.length} 条食材数据`);

      // MongoDB返回的数据已经有_id，转换为id字段以保持兼容性
      data.value = response.data.map(item => ({
        ...item,
        id: item._id || item.id || nanoid()
      }));

      // 初始化Fuse.js用于本地备选搜索
      fuse.value = initFuse(data.value);

      // 显示数据概览
      const categories = [...new Set(data.value.map(item => item.category))];
      // console.log('📋 数据分类:', categories.join(', '));
    } else {
      import('vant').then(({ showToast }) => {
        showToast({
          message: 'MongoDB中暂无食材数据',
          type: 'fail'
        });
      });
    }
  } catch (error) {
    data.value = []; // 确保数据为空数组

    // 显示错误提示
    import('vant').then(({ showToast }) => {
      showToast({
        message: '无法连接到MongoDB服务器',
        type: 'fail'
      });
    });
  }
};

// 处理输入事件（实时搜索 - 完全基于MongoDB）
const handleInput = debounce(async (value) => {
  // 如果正在执行搜索，跳过防抖处理
  if (isSearching.value) return;

  if (value.length > 0) {
    try {
      // 完全使用MongoDB服务器端搜索
      const [suggestionsRes, searchRes] = await Promise.all([
        axios.get(`http://localhost:3001/api/food/suggestions?q=${encodeURIComponent(value)}&limit=5`),
        axios.get(`http://localhost:3001/api/food/search?q=${encodeURIComponent(value)}&limit=20`)
      ]);

      // 转换数据格式以保持与Fuse.js的兼容性
      filteredSuggestions.value = suggestionsRes.data.map(item => ({
        item: { ...item, id: item._id || item.id }
      }));
      searchResults.value = searchRes.data.map(item => ({
        item: { ...item, id: item._id || item.id }
      }));

      // 如果输入长度较短，优先显示建议；较长时显示结果
      if (value.length <= 2) {
        showSuggestions.value = true;
      } else {
        showSuggestions.value = false; // 直接显示搜索结果
      }
      showDropdown.value = true;
    } catch (error) {
      // 只有在有本地缓存数据时才使用Fuse.js作为备选
      if (fuse.value && data.value.length > 0) {
        const results = fuse.value.search(value);
        filteredSuggestions.value = results.slice(0, 5);
        searchResults.value = results;

        if (value.length <= 2) {
          showSuggestions.value = true;
        } else {
          showSuggestions.value = false;
        }
        showDropdown.value = true;
      } else {
        // 没有数据可搜索
        showDropdown.value = false;
        import('vant').then(({ showToast }) => {
          showToast({
            message: '搜索服务不可用，请检查服务器连接',
            type: 'fail'
          });
        });
      }
    }
  } else {
    showSuggestions.value = false;
    showDropdown.value = false;
    searchResults.value = [];
  }
}, 200);

// 搜索函数（回车或点击搜索按钮）- 优先使用MongoDB
const search = async () => {
  if (!searchvalue.value.trim()) {
    showDropdown.value = false;
    return;
  }

  // 设置搜索标志，防止防抖函数干扰
  isSearching.value = true;

  try {
    // 优先使用MongoDB服务器端搜索
    const response = await axios.get(`http://localhost:3001/api/food/search?q=${encodeURIComponent(searchvalue.value.trim())}&limit=50`);

    // 转换数据格式以保持与Fuse.js的兼容性
    searchResults.value = response.data.map(item => ({
      item: { ...item, id: item._id || item.id }
    }));

  } catch (error) {
    // 服务器搜索失败时fallback到本地搜索
    if (fuse.value && data.value.length > 0) {
      const results = fuse.value.search(searchvalue.value.trim());
      searchResults.value = results;
    } else {
      searchResults.value = [];
      import('vant').then(({ showToast }) => {
        showToast({
          message: '搜索失败，请检查网络连接',
          type: 'fail'
        });
      });
    }
  }

  showSuggestions.value = false; // 确保显示搜索结果而不是建议
  showDropdown.value = true;

  // 重置搜索标志
  setTimeout(() => {
    isSearching.value = false;
  }, 300);
};

// 选择建议项
const selectItem = (item) => {
  // 1. 将食品名称自动填充到搜索输入框
  searchvalue.value = item.name;

  // 2. 重新搜索以显示相关结果
  const results = fuse.value.search(item.name);
  searchResults.value = results;
  showSuggestions.value = false;
  showDropdown.value = true; // 3. 保持下拉框显示状态

  // 4. 保持搜索输入框的焦点状态
  setTimeout(() => {
    const searchInput = document.querySelector('.van-search__field');
    if (searchInput) {
      searchInput.focus();
    }
  }, 50);
};

// 处理搜索框获得焦点
const handleFocus = () => {
  // 如果有搜索内容，重新显示下拉框
  if (searchvalue.value.trim()) {
    showDropdown.value = true;
  }
};

// 处理搜索框失去焦点
const handleBlur = () => {
  // 如果正在搜索，不处理失焦事件
  if (isSearching.value) return;

  // 延迟关闭，允许点击下拉框项目
  setTimeout(() => {
    // 再次检查是否在搜索状态
    if (!isSearching.value) {
      // 只有在没有搜索内容时才关闭下拉框
      // 如果有搜索内容，保持下拉框显示，让用户可以继续交互
      if (!searchvalue.value.trim()) {
        showDropdown.value = false;
        showSuggestions.value = false;
      }
    }
  }, 150);
};

// 选择搜索结果项
const selectSearchResult = (item) => {

  // 将食品名称自动填充到搜索输入框
  searchvalue.value = item.name;
  showDropdown.value = false; //自动填充进去后关闭下拉框

  // 保持搜索输入框的焦点状态
  setTimeout(() => {
    const searchInput = document.querySelector('.van-search__field');
    if (searchInput) {
      searchInput.focus();
    }
  }, 50);

  // 可以emit事件给父组件
  // emit('select-item', item);
};

// 扫码功能
const scancode = async () => {
  showScanPopup.value = true;
  // 延迟一下等弹窗完全显示后再开启摄像头
  setTimeout(() => {
    openCamera();
  }, 300);
};

// 关闭扫码弹窗
const closeScanPopup = () => {
  showScanPopup.value = false;
  isScanning.value = false;
  flashOn.value = false;
  stopCamera();
};

// 停止摄像头
const stopCamera = () => {
  // 停止扫描间隔
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  // 清理二维码识别器
  if (codeReader) {
    codeReader.reset();
    codeReader = null;
  }

  // 清理检测画布
  if (detectionCanvas) {
    detectionCanvas = null;
    detectionContext = null;
  }

  isScanning.value = false;
  codeDetected.value = false;
};

// 开启摄像头
const openCamera = async () => {
  try {
    // 先停止之前的摄像头
    stopCamera();

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // 后置摄像头
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 15, max: 30 } // 限制帧率，减少资源消耗
      }
    });

    if (video.value) {
      video.value.srcObject = stream;

      // 初始化二维码识别器
      codeReader = new BrowserMultiFormatReader();

      // 等待视频加载完成后开始识别
      video.value.addEventListener('loadedmetadata', () => {
        // 延迟一下确保视频完全加载
        setTimeout(() => {
          if (isScanning.value) {
            startContinuousScan();
          }
        }, 1000);
      }, { once: true }); // 只监听一次
    }
  } catch (error) {
    import('vant').then(({ showToast }) => {
      showToast({
        message: '无法访问摄像头，请检查权限设置',
        type: 'fail'
      });
    });
  }
};

// 初始化检测画布
const initDetectionCanvas = () => {
  if (!detectionCanvas) {
    detectionCanvas = document.createElement('canvas');
    detectionContext = detectionCanvas.getContext('2d');
  }
};

// 检测视频帧中是否存在二维码或条形码特征
const detectCodeInFrame = () => {
  if (!video.value || !detectionContext) return false;
  
  try {
    const videoWidth = video.value.videoWidth;
    const videoHeight = video.value.videoHeight;
    
    if (videoWidth === 0 || videoHeight === 0) return false;
    
    // 设置画布尺寸（使用较小的尺寸以提高检测速度）
    const scale = 0.3; // 缩放比例，减少计算量
    detectionCanvas.width = videoWidth * scale;
    detectionCanvas.height = videoHeight * scale;
    
    // 将视频帧绘制到画布
    detectionContext.drawImage(video.value, 0, 0, detectionCanvas.width, detectionCanvas.height);
    
    // 获取图像数据
    const imageData = detectionContext.getImageData(0, 0, detectionCanvas.width, detectionCanvas.height);
    const data = imageData.data;
    
    // 简单的边缘检测和模式识别
    const hasCodePattern = detectCodePattern(data, detectionCanvas.width, detectionCanvas.height);
    
    return hasCodePattern;
  } catch (error) {
    return false;
  }
};

// 检测码的特征模式
const detectCodePattern = (imageData, width, height) => {
  let edgeCount = 0;
  const threshold = 50; // 边缘检测阈值
  
  // 简化的边缘检测 - 检测水平和垂直方向的强烈对比
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const gray = (imageData[idx] + imageData[idx + 1] + imageData[idx + 2]) / 3;
      
      // 检查水平边缘
      const leftIdx = (y * width + (x - 1)) * 4;
      const rightIdx = (y * width + (x + 1)) * 4;
      const leftGray = (imageData[leftIdx] + imageData[leftIdx + 1] + imageData[leftIdx + 2]) / 3;
      const rightGray = (imageData[rightIdx] + imageData[rightIdx + 1] + imageData[rightIdx + 2]) / 3;
      
      if (Math.abs(leftGray - rightGray) > threshold) {
        edgeCount++;
      }
      
      // 检查垂直边缘
      const topIdx = ((y - 1) * width + x) * 4;
      const bottomIdx = ((y + 1) * width + x) * 4;
      const topGray = (imageData[topIdx] + imageData[topIdx + 1] + imageData[topIdx + 2]) / 3;
      const bottomGray = (imageData[bottomIdx] + imageData[bottomIdx + 1] + imageData[bottomIdx + 2]) / 3;
      
      if (Math.abs(topGray - bottomGray) > threshold) {
        edgeCount++;
      }
    }
  }
  
  // 检测规律性模式（二维码和条形码都有规律的黑白模式）
  const totalPixels = width * height;
  const edgeRatio = edgeCount / totalPixels;
  
  // 如果边缘密度在合理范围内，可能存在码
  return edgeRatio > 0.05 && edgeRatio < 0.3;
};

// 持续扫描二维码/条形码
const startContinuousScan = () => {
  if (!codeReader || !video.value) return;
  
  // 初始化检测画布
  initDetectionCanvas();

  // 清除之前的扫描间隔
  if (scanInterval) {
    clearInterval(scanInterval);
  }

  // 两阶段检测：先快速检测码的存在，再进行详细读取
  scanInterval = setInterval(async () => {
    if (!isScanning.value || !showScanPopup.value || !video.value) {
      clearInterval(scanInterval);
      return;
    }

    try {
      // 第一阶段：快速检测是否存在码的特征
      const hasCodeFeatures = detectCodeInFrame();
      codeDetected.value = hasCodeFeatures;
      
      if (!hasCodeFeatures) {
        // 没有检测到码特征，跳过详细读取
        return;
      }
      
      // 第二阶段：检测到码特征后，进行详细读取
      const result = await codeReader.decodeOnceFromVideoDevice(undefined, video.value);
      
      if (result && isScanning.value) {
        // 扫描成功
        clearInterval(scanInterval);
        handleScanSuccess(result.getText());
      }
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        // 扫码识别中
      }
      // 继续下一次扫描
    }
  }, 200); // 每200ms检测一次
};

// 处理扫描成功
const handleScanSuccess = async (scannedText) => {

  // 验证是否为有效的二维码或条形码内容
  if (!isValidCode(scannedText)) {
    import('vant').then(({ showToast }) => {
      showToast({
        message: '请扫描有效的二维码或条形码',
        type: 'fail'
      });
    });
    return;
  }

  // 停止扫描
  isScanning.value = false;

  // 处理扫描结果 - 这里可以根据实际需求处理
  const searchTerm = extractSearchTerm(scannedText);
  searchvalue.value = searchTerm;

  // 关闭扫码弹窗
  closeScanPopup();

  // 执行MongoDB搜索
  await search();

  // 显示成功提示
  import('vant').then(({ showToast }) => {
    showToast({
      message: `扫描成功：${searchTerm}`,
      type: 'success'
    });
  });
};

// 验证是否为有效的二维码或条形码
const isValidCode = (text) => {
  if (!text || text.trim().length === 0) {
    return false;
  }

  // 检查长度是否合理（避免扫描到无意义的短文本）
  const minLength = 3;
  const maxLength = 500;

  if (text.length < minLength || text.length > maxLength) {
    return false;
  }

  // 检查是否为URL格式（二维码常见格式）
  const urlPattern = /^https?:\/\/.+/i;

  // 检查是否为EAN/UPC条形码格式（8-14位数字）
  const eanUpcPattern = /^\d{8,14}$/;

  // 检查是否为Code128/Code39等格式（字母数字组合）
  const code128Pattern = /^[A-Z0-9\-\.\s\$\/\+%]+$/i;

  // 检查是否包含中文或英文产品名称
  const productNamePattern = /^[\u4e00-\u9fa5a-zA-Z0-9\s\-_\.\(\)（）]+$/;

  // 检查是否为JSON格式（某些二维码包含结构化数据）
  const isJsonLike = text.startsWith('{') && text.endsWith('}');

  // 检查是否为微信/支付宝等支付码格式
  const paymentCodePattern = /^(wxp:\/\/|alipays:\/\/|https:\/\/(qr\.alipay\.com|wx\.tenpay\.com))/i;

  return (
    urlPattern.test(text) ||
    eanUpcPattern.test(text) ||
    code128Pattern.test(text) ||
    productNamePattern.test(text) ||
    isJsonLike ||
    paymentCodePattern.test(text)
  );
};

// 从扫描结果中提取搜索关键词
const extractSearchTerm = (scannedText) => {
  try {
    // 如果是JSON格式，尝试解析
    if (scannedText.startsWith('{') && scannedText.endsWith('}')) {
      const data = JSON.parse(scannedText);
      return data.name || data.product || data.title || '扫码商品';
    }

    // 如果是URL，尝试从URL中提取产品信息
    if (scannedText.startsWith('http')) {
      try {
        const url = new URL(scannedText);
        const productName = url.searchParams.get('name') ||
          url.searchParams.get('product') ||
          url.searchParams.get('title') ||
          url.searchParams.get('q');
        if (productName) {
          return decodeURIComponent(productName);
        }

        // 尝试从路径中提取信息
        const pathSegments = url.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
          const lastSegment = pathSegments[pathSegments.length - 1];
          if (lastSegment && lastSegment !== 'index.html') {
            return decodeURIComponent(lastSegment.replace(/\.(html|php|jsp)$/, ''));
          }
        }
      } catch (urlError) {
        // URL解析失败
      }

      return '扫码商品';
    }

    // 如果是纯数字（条形码），映射到模拟商品
    if (/^\d{8,}$/.test(scannedText)) {
      // 根据条形码的最后几位数字来确定商品类型
      const lastDigit = parseInt(scannedText.slice(-1));
      const mockProducts = [
        '苹果', '香蕉', '牛奶', '鸡蛋', '西红柿',
        '土豆', '面包', '酸奶', '橙子', '胡萝卜'
      ];
      return mockProducts[lastDigit] || mockProducts[0];
    }

    // 如果包含特殊字符，可能是编码后的文本
    if (scannedText.includes('%')) {
      try {
        return decodeURIComponent(scannedText);
      } catch (decodeError) {
        // URL解码失败
      }
    }

    // 直接返回扫描到的文本（可能是产品名称）
    return scannedText.trim();
  } catch (error) {
    return scannedText.trim();
  }
};

// 开始扫描
const startScan = async () => {
  if (!stream) {
    isScanning.value = true;
    await openCamera();
  } else {
    isScanning.value = true;
    startContinuousScan();
  }
};

// 切换闪光灯
const toggleFlash = async () => {
  flashOn.value = !flashOn.value;

  try {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: flashOn.value }]
        });
      }
    }
  } catch (error) {
    // 闪光灯控制失败
  }

  // 显示状态提示
  import('vant').then(({ showToast }) => {
    showToast({
      message: flashOn.value ? '闪光灯已开启' : '闪光灯已关闭',
      type: 'success'
    });
  });
};

// 获取过期状态样式类
const getExpireClass = (expireDate) => {
  const today = new Date();
  const expire = new Date(expireDate);
  const diffDays = Math.ceil((expire - today) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'expired';
  if (diffDays <= 3) return 'expiring-soon';
  return 'normal';
};

// 点击外部关闭下拉框
const handleClickOutside = (event) => {
  const dropdown = document.querySelector('.dropdown');
  const searchContainer = document.querySelector('.head');

  if (dropdown && !searchContainer.contains(event.target)) {
    // 只有在没有搜索内容时才完全关闭下拉框
    // 如果有搜索内容，保持下拉框可见性，方便用户继续操作
    if (!searchvalue.value.trim()) {
      showDropdown.value = false;
      showSuggestions.value = false;
    }
  }
};

// 页面挂载时加载数据
onMounted(() => {
  loadFoodData();
  document.addEventListener('click', handleClickOutside);
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  stopCamera(); // 清理摄像头资源
});

// 监听搜索值变化
watch(searchvalue, (newVal) => {
  // 如果正在搜索，不处理watch事件
  if (isSearching.value) return;

  if (!newVal.trim()) {
    showDropdown.value = false;
    showSuggestions.value = false;
    searchResults.value = [];
  }
});
</script>

<style scoped>
.head {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgb(255, 255, 255);
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 覆盖Vant搜索框样式 */
:deep(.van-search__content) {
  flex: 1 0 85%;
  transition: all 0.2s ease-in-out;
  border-radius: 20px;
  border: 1px solid #e5e5e5;
}

:deep(.van-search__content):focus-within {
  box-shadow: 0 0 8px rgba(67, 102, 214, 0.3);
  border-color: rgb(0, 150, 5);
}

.van-icon {
  flex-shrink: 0;
  margin-left: -10px;
  cursor: pointer;
}

.search {
  flex: 1 0 85%;
}

/* 下拉框样式 - 气泡效果 */
.dropdown {
  position: fixed;
  top: 80px;
  left: 50px;
  right: 10px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 999;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.06);
  animation: bubbleIn 0.2s ease-out;
}

/* 气泡箭头 */
.dropdown::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 30px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid white;
  filter: drop-shadow(0 -2px 4px rgba(0, 0, 0, 0.1));
}

.dropdown::after {
  content: '';
  position: absolute;
  top: -9px;
  left: 30px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid rgba(0, 0, 0, 0.06);
}

/* 气泡动画 */
@keyframes bubbleIn {
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dropdown-item {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.dropdown-item:first-child {
  border-radius: 12px 12px 0 0;
}

.dropdown-item:last-child {
  border-bottom: none;
  border-radius: 0 0 12px 12px;
}

.dropdown-item:only-child {
  border-radius: 12px;
}

.dropdown-item:hover {
  background-color: rgba(0, 150, 5, 0.05);
  transform: translateX(2px);
}

.dropdown-item:active {
  background-color: rgba(0, 150, 5, 0.1);
  transform: translateX(0);
}

.name {
  font-weight: 500;
  margin-bottom: 4px;
}

.meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #666;
}



/* 过期状态样式 */
.expired {
  color: #f53f3f;
}

.expiring-soon {
  color: #ff7d00;
}

.normal {
  color: #00b42a;
}

/* 下拉框内的空状态 */
.empty-message {
  padding: 20px;
  text-align: center;
}

/* 下拉框内的标题 */
.dropdown .section-title {
  padding: 8px 16px;
  margin: 0;
  background-color: rgba(255, 255, 255, 0.95);
  font-size: 12px;
  color: #666;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(8px);
}

/* 扫码弹窗样式 */
.scan-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
  color: white;
  position: relative;
  overflow: hidden;
}

.scan-header {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
}

.scan-header :deep(.van-nav-bar) {
  background: transparent;
  color: white;
}

.scan-header :deep(.van-nav-bar__title) {
  color: white;
  font-weight: 600;
}

.scan-header :deep(.van-nav-bar__arrow) {
  color: white;
}

.scan-desc {
  text-align: center;
  padding: 10px 20px 20px;
}

.scan-desc p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
  color: white;
}

.scan-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20px;
}

/* 摄像头和扫码框样式 */
.camera {
  position: relative;
  width: 280px;
  height: 280px;
  border-radius: 12px;
  overflow: hidden;
}

#video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #333;
}

.border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.item {
  position: absolute;
  background: rgba(0, 0, 0, 0.5);
}

.item-1 {
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
}

.item-2 {
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
}

.item-3 {
  top: 60px;
  bottom: 60px;
  left: 0;
  width: 60px;
}

.item-4 {
  top: 60px;
  bottom: 60px;
  right: 0;
  width: 60px;
}

.plate-rank-content {
  position: absolute;
  top: 60px;
  left: 60px;
  right: 60px;
  bottom: 60px;
  border: 2px solid transparent;
}

.angle-border {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid #00ff88;
  transition: all 0.3s ease;
}

.angle-border.code-detected {
  border-color: #ff6b35;
  box-shadow: 0 0 10px #ff6b35;
}

.left-top-border {
  top: -3px;
  left: -3px;
  border-right: none;
  border-bottom: none;
  border-radius: 8px 0 0 0;
}

.right-top-border {
  top: -3px;
  right: -3px;
  border-left: none;
  border-bottom: none;
  border-radius: 0 8px 0 0;
}

.left-bottom-border {
  bottom: -3px;
  left: -3px;
  border-right: none;
  border-top: none;
  border-radius: 0 0 0 8px;
}

.right-bottom-border {
  bottom: -3px;
  right: -3px;
  border-left: none;
  border-top: none;
  border-radius: 0 0 8px 0;
}

.solid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00ff88, transparent);
  animation: scanAnimation 2s linear infinite;
  transition: all 0.3s ease;
}

.solid.code-detected {
  background: linear-gradient(90deg, transparent, #ff6b35, transparent);
  animation: scanAnimationDetected 1s linear infinite;
}

@keyframes scanAnimationDetected {
  0% {
    top: 0;
    opacity: 1;
  }

  50% {
    opacity: 1;
  }

  100% {
    top: calc(100% - 2px);
    opacity: 0;
  }
}

@keyframes scanAnimation {
  0% {
    top: 0;
    opacity: 1;
  }

  50% {
    opacity: 1;
  }

  100% {
    top: calc(100% - 2px);
    opacity: 0;
  }
}

.scan-actions {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
}

.scan-actions .van-button {
  border-radius: 25px;
  height: 50px;
  font-weight: 500;
}

.flash-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: white !important;
}

.flash-btn:active {
  background: rgba(255, 255, 255, 0.2) !important;
}

.scan-tips {
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.9);
}

.scan-tips :deep(.van-notice-bar) {
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  padding: 0;
}

.scan-tips :deep(.van-notice-bar__left-icon) {
  color: #00ff88;
}

/* 弹窗关闭按钮样式覆盖 */
:deep(.van-popup__close-icon) {
  color: white;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 响应式适配 */
@media (max-width: 375px) {
  .scan-frame {
    width: 200px;
    height: 200px;
  }

  .scan-header h3 {
    font-size: 18px;
  }
}
</style>