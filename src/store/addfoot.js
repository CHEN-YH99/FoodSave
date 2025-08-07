import { defineStore } from 'pinia';
import { ref } from 'vue'
export const useAddFootStore = defineStore('addfoot', () => {
  const isloading = ref(false)

  //点击保存实现异步加载
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
  // category: '蔬菜',
  // purchaseDate: '2025/08/06',
  // shelfLife: '7天',
  // storageLocation: '冰箱下层冷冻室 ★',
  // quantity: 1,
  // unit: '千克'
})

// 最近使用的食材
const recentFoods = ref([])

// 动态获取输入框的内容
const handleinput = () => {
  recentFoods.value.unshift(formData.value.name)
  formData.value.name = ''
}
// 弹窗显示状态
const showCategoryPicker = ref(false)
// const showDatePicker = ref(false)
// const showShelfLifePicker = ref(false)
// const showStoragePicker = ref(false)
// const showUnitPicker = ref(false)
// const showReminderPicker = ref(false)

// // 日期相关
// const currentDate = ref(new Date())
// const minDate = new Date(2020, 0, 1)
// const maxDate = new Date(2030, 11, 31)

// // 选择器数据
// const categoryColumns = ref([
//   '蔬菜', '水果', '肉类', '海鲜', '蛋奶', '主食', '调料', '饮品', '其他'
// ])

// const shelfLifeColumns = ref([
//   '1天', '2天', '3天', '7天', '15天', '30天', '60天', '90天', '180天', '365天'
// ])

// const storageColumns = ref([
//   '冰箱上层冷藏室',
//   '冰箱中层冷藏室',
//   '冰箱下层冷冻室 ★',
//   '冰箱门储物格',
//   '常温储存',
//   '阴凉干燥处',
//   '冷冻室',
//   '保鲜盒'
// ])

// const unitColumns = ref([
//   '个', '只', '条', '根', '片', '块', '包', '袋', '盒', '瓶', '罐', '千克', '克', '斤', '两', '升', '毫升'
// ])

// const reminderColumns = ref([
//   '1天后', '2天后', '3天后', '5天后', '7天后', '10天后', '15天后', '30天后'
// ])

// // 表单验证
// const isFormValid = computed(() => {
//   return formData.value.name.trim() !== '' &&
//     formData.value.category !== '' &&
//     formData.value.purchaseDate !== '' &&
//     formData.value.shelfLife !== '' &&
//     formData.value.storageLocation !== ''
// })

// 方法
const onClickLeft = () => {
  router.back()
}

const selectRecentFood = (food) => {
  formData.value.name = food
}

const onCategoryConfirm = ({ selectedValues }) => {
  formData.value.category = selectedValues[0]
  showCategoryPicker.value = false
}

// const onDateConfirm = ({ selectedValues }) => {
//   const [year, month, day] = selectedValues
//   formData.value.purchaseDate = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
//   showDatePicker.value = false
// }

// const onShelfLifeConfirm = ({ selectedValues }) => {
//   formData.value.shelfLife = selectedValues[0]
//   showShelfLifePicker.value = false
// }

// const onStorageConfirm = ({ selectedValues }) => {
//   formData.value.storageLocation = selectedValues[0]
//   showStoragePicker.value = false
// }

// const onUnitConfirm = ({ selectedValues }) => {
//   formData.value.unit = selectedValues[0]
//   showUnitPicker.value = false
// }

// const onReminderConfirm = ({ selectedValues }) => {
//   Toast(`提醒时间设置为：${selectedValues[0]}`)
//   showReminderPicker.value = false
// }

  return {
    isloading,
    onSave,
    formData,
    handleinput,
    showCategoryPicker,
    // showDatePicker,
    // showShelfLifePicker,
    // showStoragePicker,
    // showUnitPicker,
    // showReminderPicker,
    // currentDate,
    // minDate,
    // maxDate,
    // categoryColumns,
    // shelfLifeColumns,
    // storageColumns,
    // unitColumns,
    // reminderColumns,
    // isFormValid,
    onClickLeft,
    selectRecentFood,
    onCategoryConfirm,
    // onDateConfirm,
    // onShelfLifeConfirm,
    // onStorageConfirm,
    // onUnitConfirm,
    // onReminderConfirm,
    recentFoods
  }
})