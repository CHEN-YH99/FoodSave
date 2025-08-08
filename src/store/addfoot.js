import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAddFootStore = defineStore('addfoot', () => {
  // 加载状态
  const isloading = ref(false)

  // 保存表单数据
  const onSave = async (formData) => {
    try {
      isloading.value = true;

      // 模拟保存数据的异步操作（比如发送到服务器）
      await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟2秒的网络请求

      // 这里可以添加实际的保存逻辑
      console.log('保存的数据:', formData);

    } catch (error) {
      // 处理错误
      console.error('保存失败:', error);
      throw error; // 重新抛出错误，让组件可以处理
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
  const showReminderPicker = ref(false)

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
    { text: '其他', value: '其他' }
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
    '冰箱上层冷藏室',
    '冰箱中层冷藏室',
    '冰箱下层冷冻室 ★',
    '冰箱门储物格',
    '常温储存',
    '阴凉干燥处',
    '冷冻室',
    '保鲜盒'
  ])

  const unitColumns = ref([
    '个', '只', '条', '根', '片', '块', '包', '袋', '盒', '瓶', '罐', '千克', '克', '斤', '两', '升', '毫升'
  ])

  const reminderColumns = ref([
    '1天后', '2天后', '3天后', '5天后', '7天后', '10天后', '15天后', '30天后'
  ])

  // 表单验证
  const isFormValid = computed(() => {
    return formData.value.name.trim() !== '' &&
      formData.value.category !== '' &&
      formData.value.purchaseDate !== '' &&
      formData.value.shelfLife !== ''
  })

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

  const onReminderConfirm = ({ selectedValues }) => {
    showReminderPicker.value = false
  }

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
    showReminderPicker,

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
    handleinput,
    selectRecentFood,
    handleCategoryClick,
    onCategoryConfirm,
    onDateConfirm,
    onShelfLifeConfirm,
    onStorageConfirm,
    onUnitConfirm,
    onReminderConfirm
  }
})