import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// 配置axios基础URL
const API_BASE_URL = 'http://localhost:3001/api'

export const useAddFootStore = defineStore('addfoot', () => {
  // 加载状态
  const isloading = ref(false)

  // 计算过期日期
  const calculateExpireDate = (purchaseDate, shelfLife) => {
    const purchase = new Date(purchaseDate);
    let days = 0;
    
    if (shelfLife.includes('天')) {
      days = parseInt(shelfLife);
    } else if (shelfLife.includes('年')) {
      days = parseInt(shelfLife) * 365;
    }
    
    const expireDate = new Date(purchase);
    expireDate.setDate(expireDate.getDate() + days);
    
    return expireDate.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).replace(/\//g, '/');
  }

  // 保存表单数据到 MongoDB
  const onSave = async (inputFormData) => {
    try {
      isloading.value = true;
      
      // 计算过期日期
      const expireDate = calculateExpireDate(inputFormData.purchaseDate, inputFormData.shelfLife);
      
      // 准备要发送的数据
      const foodData = {
        name: inputFormData.name.trim(),
        category: inputFormData.category,
        storageLocation: inputFormData.storageLocation,
        purchaseDate: inputFormData.purchaseDate,
        shelfLife: inputFormData.shelfLife,
        expireDate: expireDate,
        quantity: inputFormData.quantity,
        unit: inputFormData.unit
      };

      // 模拟网络延迟，让用户能看到加载动画（最少显示800ms）
      const startTime = Date.now();
      
      // 发送POST请求到后端API
      const response = await axios.post(`${API_BASE_URL}/food`, foodData, {
        timeout: 10000, // 10秒超时
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = response.data;
      
      // 确保加载动画至少显示800ms
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsedTime));
      }
      
      // 保存成功后，将食材名称添加到最近使用列表
      if (!recentFoods.value.includes(inputFormData.name.trim())) {
        recentFoods.value.unshift(inputFormData.name.trim());
        // 限制最近使用列表的长度
        if (recentFoods.value.length > 10) {
          recentFoods.value = recentFoods.value.slice(0, 10);
        }
      }
      
      // 重置store中的表单数据
      Object.assign(formData.value, {
        name: '',
        category: '',
        purchaseDate: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/'),
        shelfLife: '',
        storageLocation: '',
        quantity: 1,
        unit: '千克'
      });

      // 触发全局事件，通知其他页面数据已更新
      window.dispatchEvent(new CustomEvent('foodDataUpdated', { 
        detail: { 
          action: 'add', 
          food: result 
        } 
      }));
      
      return result;

    } catch (error) {
      // 处理不同类型的错误
      
      let errorMessage = '保存失败，请重试';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = '网络请求超时，请检查网络连接';
      } else if (error.response) {
        // 服务器返回错误状态码
        const status = error.response.status;
        if (status === 400) {
          errorMessage = '数据格式错误，请检查输入信息';
        } else if (status === 500) {
          errorMessage = '服务器内部错误，请稍后重试';
        } else if (status === 404) {
          errorMessage = '服务接口不存在，请联系管理员';
        }
      } else if (error.request) {
        // 网络错误
        errorMessage = '网络连接失败，请检查网络设置';
      }
      
      // 重新抛出错误，包含自定义错误信息
      const customError = new Error(errorMessage);
      customError.originalError = error;
      throw customError;
      
    } finally {
      // 无论成功还是失败，都将 isloading 设置为 false
      isloading.value = false;
    }
  }

  // 表单数据
  const formData = ref({
    name: '',
    category: '',
    purchaseDate: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/'),
    shelfLife: '',
    storageLocation: '',
    quantity: 1,
    unit: '千克'
  })

  // 最近使用的食材
  const recentFoods = ref([])

  // 动态获取输入框的内容
  const handleinput = () => {
    if (formData.value.name.trim()) {
      recentFoods.value.unshift(formData.value.name.trim())
      formData.value.name = ''
    }
  }

  // 弹窗显示状态
  const showCategoryPicker = ref(false)
  const showDatePicker = ref(false)
  const showShelfLifePicker = ref(false)
  const showStoragePicker = ref(false)
  const showUnitPicker = ref(false)
  // const showReminderPicker = ref(false)

  // 日期相关
  const today = new Date()
  const currentDate = ref([today.getFullYear(), today.getMonth() + 1, today.getDate()])
  const minDate = new Date(2020, 0, 1)
  const maxDate = new Date(2030, 11, 31)

  // 选择器数据
  const categoryColumns = ref([
    { text: '蔬菜', value: '蔬菜' },
    { text: '水果', value: '水果' },
    { text: '肉类', value: '肉类' },
    { text: '海鲜', value: '海鲜' },
    { text: '主食', value: '主食' },
    { text: '调料', value: '调料' },
    { text: '饮品', value: '饮品' },
    { text: '其他', value: '其他' },
    { text: '熟食', value: '熟食' },
    { text: '罐头', value: '罐头' },
  ])

  const shelfLifeColumns = ref([
    { text: '1天', value: '1天' },
    { text: '2天', value: '2天' },
    { text: '3天', value: '3天' },
    { text: '5天', value: '5天' },
    { text: '7天', value: '7天' },
    { text: '10天', value: '10天' },
    { text: '15天', value: '15天' },
    { text: '30天', value: '30天' },
    { text: '45天', value: '45天' },
    { text: '60天', value: '60天' },
    { text: '90天', value: '90天' },
    { text: '180天', value: '180天' },
    { text: '365天', value: '365天' },
    { text: '2年', value: '2年' },
    { text: '3年', value: '3年' }
  ])

  const storageColumns = ref([
    {text: '冰箱上层冷藏室', value: '冰箱上层冷藏室'},
    {text: '冰箱中层冷藏室', value: '冰箱中层冷藏室'},
    {text: '冰箱下层冷冻室 ★', value: '冰箱下层冷冻室 ★'},
    {text: '冰箱门储物格', value: '冰箱门储物格'},
    {text: '常温储存', value: '常温储存'},
    {text: '阴凉干燥处', value: '阴凉干燥处'},
    {text: '冷冻室', value: '冷冻室'},
    {text: '保鲜盒', value: '保鲜盒'}
  ])

  const unitColumns = ref([
    {text: '斤', value: '斤'},
    {text: '两', value: '两'},
    {text: '升', value: '升'},
    {text: '毫升', value: '毫升'},
    {text: '个', value: '个'},
    {text: '只', value: '只'},
    {text: '条', value: '条'},
    {text: '根', value: '根'},
    {text: '片', value: '片'},
    {text: '块', value: '块'},
    {text: '包', value: '包'},
    {text: '袋', value: '袋'},
    {text: '盒', value: '盒'},
    {text: '瓶', value: '瓶'},
    {text: '罐', value: '罐'},
    {text: '千克', value: '千克'},
    {text: '克', value: '克'},
    
  ])

  const reminderColumns = ref([
    '1天后', '2天后', '3天后', '5天后', '7天后', '10天后', '15天后', '30天后'
  ])

  // 表单验证(信息栏不能为空, 否则无法保存)
  const isFormValid = computed(() => {
    return formData.value.name.trim() !== '' &&
      formData.value.category !== '' &&
      formData.value.purchaseDate !== '' &&
      formData.value.shelfLife !== '' &&
      formData.value.storageLocation!== '' &&
      formData.value.unit!== ''
  })

  // 重置加载状态
  const resetLoadingState = () => {
    isloading.value = false
  }

  // 基础方法
  const selectRecentFood = (food) => {
    formData.value.name = food
  }

  // 选择器处理方法
  const handleCategoryClick = () => {
    showCategoryPicker.value = true
  }

  const onCategoryConfirm = ({ selectedValues }) => {
    formData.value.category = selectedValues[0]
    showCategoryPicker.value = false
  }

  const onDateConfirm = ({ selectedValues }) => {
    // 处理日期选择器的确认事件
    const [year, month, day] = selectedValues
    formData.value.purchaseDate = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
    currentDate.value = [year, month, day]
    showDatePicker.value = false
  }

  const onShelfLifeConfirm = ({ selectedValues }) => {
    formData.value.shelfLife = selectedValues[0]
    showShelfLifePicker.value = false
  }

  const onStorageConfirm = ({ selectedValues }) => {
    formData.value.storageLocation = selectedValues[0]
    showStoragePicker.value = false
  }

  const onUnitConfirm = ({ selectedValues }) => {
    formData.value.unit = selectedValues[0]
    showUnitPicker.value = false
  }

  // const onReminderConfirm = ({ selectedValues }) => {
  //   showReminderPicker.value = false
  // }

  return {
    // 状态数据
    isloading,
    formData,
    recentFoods,
    isFormValid,

    // 弹窗状态
    showCategoryPicker,
    showDatePicker,
    showShelfLifePicker,
    showStoragePicker,
    showUnitPicker,
    // showReminderPicker,

    // 日期相关
    currentDate,
    minDate,
    maxDate,

    // 选择器数据
    categoryColumns,
    shelfLifeColumns,
    storageColumns,
    unitColumns,
    reminderColumns,

    // 方法
    onSave,
    calculateExpireDate,
    resetLoadingState,
    handleinput,
    selectRecentFood,
    handleCategoryClick,
    onCategoryConfirm,
    onDateConfirm,
    onShelfLifeConfirm,
    onStorageConfirm,
    onUnitConfirm,
  }
})