<template>
  <div class="add-food-page">
    <!-- 导航栏 -->
    <van-nav-bar title="添加食材" left-arrow @click-left="store.onClickLeft" fixed placeholder>
      <template #right>
        <van-button 
          :loading="store.isloading" 
          text="保存" 
          color="rgba(0,150,5,0.5)" 
          size="small" 
          round 
          @click="onSave"
          :disabled="!isFormValid">
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
        <van-field v-model="store.formData.name" @keyup.enter ="store.handleinput" placeholder="输入食材名称..." clearable />

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
        <van-field v-model="store.formData.category" placeholder="选择分类" readonly is-link @click="store.showCategoryPicker = true" />
      </div>

      <!-- 购买日期和保质期 -->
      <!-- <div class="form-section">
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
      </div> -->

      <!-- 存储位置 -->
      <!-- <div class="form-section">
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
      </div> -->

      <!-- 数量和单位 -->
      <!-- <div class="form-section">
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
      </div> -->

      <!-- 临期提醒 -->
      <!-- <div class="form-section">
        <div class="section-title">临期提醒</div>
        <div class="reminder-row">
          <span class="reminder-text">3天后</span>
          <van-button type="default" size="small" plain @click="showReminderPicker = true">
            可自定义 <van-icon name="arrow" />
          </van-button>
        </div>
      </div> -->
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
import { useAddFootStore } from '../store/addfoot.js'
// import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'vant'

const router = useRouter()
const store = useAddFootStore()

// 按钮加载初始化
// const isloading = ref(false)




const onSave = async () => {
  if (!isFormValid.value) {
    Toast('请填写完整信息')
    return
  }

  // 调用 store 的 onSave 方法，传入表单数据
  await store.onSave(formData.value)

  Toast({ type: 'success', message: '食材添加成功' })
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