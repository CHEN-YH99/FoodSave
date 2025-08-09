<template>
  <div class="add-food-page">
    <!-- 导航栏 -->
    <van-nav-bar title="添加食材" left-arrow @click-left="() => router.back()" fixed placeholder>
      <template #right>
        <van-button :loading="store.isloading" text="保存" color="rgba(0,150,5,0.5)" size="small" round @click="onSave"
          :disabled="!store.isFormValid">
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
        <van-field v-model="store.formData.name" @keyup.enter="store.handleinput" placeholder="输入食材名称..." clearable />

        <!-- 最近使用的食材 -->
        <div class="recent-foods" v-if="store.recentFoods.length > 0">
          <div class="recent-title">最近：</div>
          <div class="recent-tags">
            <van-tag v-for="food in store.recentFoods" :key="food" type="default" size="medium"
              @click="store.selectRecentFood(food)">
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
        <van-field v-model="store.formData.category" placeholder="选择分类" readonly is-link
          @click="store.handleCategoryClick" />
      </div>

      <!-- 购买日期和保质期 -->
      <div class="form-section">
        <div class="date-row">
          <div class="date-item">
            <div class="section-title">
              <span class="required">*</span>
              存放日期
            </div>
            <van-field v-model="store.formData.purchaseDate" placeholder="选择日期" readonly is-link
              @click="store.showDatePicker = true" />
          </div>
          <div class="date-item">
            <div class="section-title">
              <span class="required">*</span>
              保质期
            </div>
            <van-field v-model="store.formData.shelfLife" placeholder="点击输入" clearable>
              <template #button>
                <van-button size="small" type="primary" plain @click="store.showShelfLifePicker = true">
                  选择
                </van-button>
              </template>
            </van-field>
          </div>
        </div>
      </div>

      <!-- 存储位置 -->
      <div class="form-section">
        <div class="section-title">
          <span class="required">*</span>
          存储位置
        </div>
        <van-field v-model="store.formData.storageLocation" placeholder="选择存储位置" readonly is-link
          @click="store.showStoragePicker = true">
          <template #right-icon>
            <van-icon name="star" v-if="store.formData.storageLocation.includes('★')" />
          </template>
        </van-field>
      </div>

      <!-- 数量和单位 -->
      <div class="form-section">
        <div class="quantity-row">
          <div class="quantity-item">
            <div class="section-title">数量</div>
            <div class="stepper-container">
              <van-stepper v-model="store.formData.quantity" min="0" step="1" integer />
            </div>
          </div>
          <div class="quantity-item">
            <div class="section-title">单位</div>
            <van-field v-model="store.formData.unit" placeholder="选择单位" readonly is-link
              @click="store.showUnitPicker = true" />
          </div>
        </div>
      </div>
    </div>

    <!-- 选择器弹窗 -->
    <!-- 分类选择器 -->
    <van-popup v-model:show="store.showCategoryPicker" position="bottom">
      <van-picker title="选择分类" :columns="[store.categoryColumns]" @confirm="store.onCategoryConfirm"
        @cancel="store.showCategoryPicker = false" />
    </van-popup>

    <!-- 日期选择器 -->
    <van-popup v-model:show="store.showDatePicker" position="bottom">
      <van-date-picker v-model="store.currentDate" title="选择购买日期" @confirm="store.onDateConfirm"
        @cancel="store.showDatePicker = false" :min-date="store.minDate" :max-date="store.maxDate" />
    </van-popup>

    <!-- 保质期选择器 -->
    <van-popup v-model:show="store.showShelfLifePicker" position="bottom">
      <van-picker title="选择保质期" :columns="[store.shelfLifeColumns]" @confirm="store.onShelfLifeConfirm"
        @cancel="store.showShelfLifePicker = false" />
    </van-popup>

    <!-- 存储位置选择器 -->
    <van-popup v-model:show="store.showStoragePicker" position="bottom">
      <van-picker title="选择存储位置" :columns="store.storageColumns" @confirm="store.onStorageConfirm"
        @cancel="store.showStoragePicker = false" />
    </van-popup>

    <!-- 单位选择器 -->
    <van-popup v-model:show="store.showUnitPicker" position="bottom">
      <van-picker title="选择单位" :columns="store.unitColumns" @confirm="store.onUnitConfirm"
        @cancel="store.showUnitPicker = false" />
    </van-popup>
  </div>
</template>

<script setup>
import { useAddFootStore } from '../store/addfoot.js'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()
const store = useAddFootStore()

// 处理提醒确认（需要在组件中处理 Toast）
const handleReminderConfirm = ({ selectedValues }) => {
  showToast(`提醒时间设置为：${selectedValues[0]}`)
  store.onReminderConfirm({ selectedValues })
}

// 保存表单
const onSave = async () => {
  if (!store.isFormValid) {
    showToast('请填写完整信息')
    return
  }

  try {
    await store.onSave(store.formData)
    showToast({ type: 'success', message: '食材添加成功' })
    router.back()
  } catch (error) {
    showToast({ type: 'fail', message: '保存失败，请重试' })
  }
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

    // 统一字段高度
    :deep(.van-field) {
      min-height: 44px;

      .van-field__control {
        min-height: 44px;
        line-height: 44px;
      }

      .van-field__button {
        height: 44px;
        display: flex;
        align-items: center;
      }
    }
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