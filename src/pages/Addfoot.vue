<template>
  <div class="add-food-page">
    <!-- 导航栏 -->
    <van-nav-bar title="添加食材" left-arrow @click-left="onClickLeft" fixed placeholder>
      <template #right>
        <van-button type="primary" size="small" round @click="onSave" :disabled="!isFormValid">
          <van-icon name="success" />
        </van-button>
      </template>
    </van-nav-bar>

    <div class="form-container">
      <!-- 食材名称 -->
      <div class="form-section">
        <div class="section-title">
          <span class="required">*</span>
          食材名称
        </div>
        <van-field v-model="formData.name" placeholder="输入食材名称..." clearable />

        <!-- 最近使用的食材 -->
        <div class="recent-foods">
          <div class="recent-title">最近：</div>
          <div class="recent-tags">
            <van-tag v-for="food in recentFoods" :key="food" type="default" size="medium"
              @click="selectRecentFood(food)">
              {{ food }}
            </van-tag>
          </div>
        </div>
      </div>

      <!-- 分类 -->
      <div class="form-section">
        <div class="section-title">
          <span class="required">*</span>
          分类
        </div>
        <van-field v-model="formData.category" placeholder="选择分类" readonly is-link @click="showCategoryPicker = true" />
      </div>

      <!-- 购买日期和保质期 -->
      <div class="form-section">
        <div class="date-row">
          <div class="date-item">
            <div class="section-title">
              <span class="required">*</span>
              购买日期
            </div>
            <van-field v-model="formData.purchaseDate" placeholder="选择日期" readonly is-link
              @click="showDatePicker = true" />
          </div>
          <div class="date-item">
            <div class="section-title">
              <span class="required">*</span>
              保质期
            </div>
            <van-field v-model="formData.shelfLife" placeholder="选择保质期" readonly is-link
              @click="showShelfLifePicker = true" />
          </div>
        </div>
      </div>

      <!-- 存储位置 -->
      <div class="form-section">
        <div class="section-title">
          <span class="required">*</span>
          存储位置
        </div>
        <van-field v-model="formData.storageLocation" placeholder="选择存储位置" readonly is-link
          @click="showStoragePicker = true">
          <template #right-icon>
            <van-icon name="star" v-if="formData.storageLocation.includes('★')" />
          </template>
        </van-field>
      </div>

      <!-- 数量和单位 -->
      <div class="form-section">
        <div class="quantity-row">
          <div class="quantity-item">
            <div class="section-title">数量</div>
            <div class="stepper-container">
              <van-stepper v-model="formData.quantity" min="0" step="1" integer />
            </div>
          </div>
          <div class="quantity-item">
            <div class="section-title">单位</div>
            <van-field v-model="formData.unit" placeholder="选择单位" readonly is-link @click="showUnitPicker = true" />
          </div>
        </div>
      </div>

      <!-- 临期提醒 -->
      <div class="form-section">
        <div class="section-title">临期提醒</div>
        <div class="reminder-row">
          <span class="reminder-text">3天后</span>
          <van-button type="default" size="small" plain @click="showReminderPicker = true">
            可自定义 <van-icon name="arrow" />
          </van-button>
        </div>
      </div>
    </div>

    <!-- 分类选择器 -->
    <van-popup v-model:show="showCategoryPicker" position="bottom">
      <van-picker :columns="categoryColumns" @confirm="onCategoryConfirm" @cancel="showCategoryPicker = false" />
    </van-popup>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom">
      <van-date-picker v-model="currentDate" @confirm="onDateConfirm" @cancel="showDatePicker = false"
        :min-date="minDate" :max-date="maxDate" />
    </van-popup>

    <!-- 保质期选择器 -->
    <van-popup v-model:show="showShelfLifePicker" position="bottom">
      <van-picker :columns="shelfLifeColumns" @confirm="onShelfLifeConfirm" @cancel="showShelfLifePicker = false" />
    </van-popup>

    <!-- 存储位置选择器 -->
    <van-popup v-model:show="showStoragePicker" position="bottom">
      <van-picker :columns="storageColumns" @confirm="onStorageConfirm" @cancel="showStoragePicker = false" />
    </van-popup>

    <!-- 单位选择器 -->
    <van-popup v-model:show="showUnitPicker" position="bottom">
      <van-picker :columns="unitColumns" @confirm="onUnitConfirm" @cancel="showUnitPicker = false" />
    </van-popup>

    <!-- 提醒时间选择器 -->
    <van-popup v-model:show="showReminderPicker" position="bottom">
      <van-picker :columns="reminderColumns" @confirm="onReminderConfirm" @cancel="showReminderPicker = false" />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'vant'

const router = useRouter()

// 表单数据
const formData = ref({
  name: '',
  category: '蔬菜',
  purchaseDate: '2025/08/06',
  shelfLife: '7天',
  storageLocation: '冰箱下层冷冻室 ★',
  quantity: 1,
  unit: '千克'
})

// 最近使用的食材
const recentFoods = ref(['牛肉', '牛奶', '西红柿', '鸡蛋', '面包'])

// 弹窗显示状态
const showCategoryPicker = ref(false)
const showDatePicker = ref(false)
const showShelfLifePicker = ref(false)
const showStoragePicker = ref(false)
const showUnitPicker = ref(false)
const showReminderPicker = ref(false)

// 日期相关
const currentDate = ref(new Date())
const minDate = new Date(2020, 0, 1)
const maxDate = new Date(2030, 11, 31)

// 选择器数据
const categoryColumns = ref([
  '蔬菜', '水果', '肉类', '海鲜', '蛋奶', '主食', '调料', '零食', '饮品', '其他'
])

const shelfLifeColumns = ref([
  '1天', '2天', '3天', '7天', '15天', '30天', '60天', '90天', '180天', '365天'
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
    formData.value.shelfLife !== '' &&
    formData.value.storageLocation !== ''
})

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

const onDateConfirm = ({ selectedValues }) => {
  const [year, month, day] = selectedValues
  formData.value.purchaseDate = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
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
  Toast(`提醒时间设置为：${selectedValues[0]}`)
  showReminderPicker.value = false
}

const onSave = () => {
  if (!isFormValid.value) {
    Toast('请填写完整信息')
    return
  }

  // 这里可以添加保存逻辑
  Toast.success('食材添加成功')
  router.back()
}
</script>

<style scoped lang="scss">
.add-food-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.form-container {
  padding: 16px;
}

.form-section {
  margin-bottom: 24px;

  .section-title {
    font-size: 14px;
    color: #323233;
    margin-bottom: 8px;
    font-weight: 500;

    .required {
      color: #ee0a24;
      margin-right: 4px;
    }
  }
}

.recent-foods {
  margin-top: 12px;

  .recent-title {
    font-size: 14px;
    color: #646566;
    margin-bottom: 8px;
  }

  .recent-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .van-tag {
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background-color: #1989fa;
        color: white;
      }
    }
  }
}

.date-row {
  display: flex;
  gap: 12px;

  .date-item {
    flex: 1;
  }
}

.quantity-row {
  display: flex;
  gap: 12px;

  .quantity-item {
    flex: 1;

    &:first-child {
      .stepper-container {
        margin-top: 8px;
      }
    }
  }
}

.reminder-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;

  .reminder-text {
    font-size: 16px;
    color: #323233;
  }
}

// 覆盖 Vant 样式
:deep(.van-field__control) {
  font-size: 16px;
}

:deep(.van-nav-bar__title) {
  font-size: 18px;
  font-weight: 600;
}

:deep(.van-button--small) {
  padding: 0 12px;
  height: 32px;
}

:deep(.van-stepper) {
  .van-stepper__input {
    width: 60px;
    margin: 0 8px;
  }
}
</style>