<template>
  <div class="personal-information">
    <!-- 顶部导航栏 -->
    <van-nav-bar title="个人信息" left-arrow @click-left="goBack" class="custom-nav-bar" />

    <div class="content">
      <!-- 头像区域 -->
      <div class="avatar-section">
        <div class="avatar-container" @click="showAvatarOptions">
          <van-image class="avatar" :src="userAvatar" round width="80" height="80" />
          <div class="avatar-overlay">
            <van-icon name="photograph" size="20" color="white" />
          </div>
        </div>
        <div class="avatar-tip">点击更换头像</div>
      </div>

      <!-- 信息表单 -->
      <div class="form-section">
        <van-cell-group inset>
          <van-field v-model="userInfo.nickname" label="昵称" placeholder="请输入昵称" clearable />
          <van-field v-model="userInfo.phone" label="手机号" placeholder="请输入手机号" type="tel" clearable />
          <van-field v-model="userInfo.email" label="邮箱" placeholder="请输入邮箱" type="email" clearable />
          <van-field v-model="userInfo.bio" label="个人简介" placeholder="请输入个人简介" type="textarea" rows="3" maxlength="100"
            show-word-limit />
        </van-cell-group>
      </div>

      <!-- 保存按钮 -->
      <div class="save-section">
        <van-button type="primary" size="large" round @click="saveUserInfo" :loading="saving">
          保存修改
        </van-button>
      </div>
    </div>

    <!-- 头像选择操作面板 -->
    <van-action-sheet v-model:show="showActionSheet" :actions="avatarActions" @select="onSelectAction" cancel-text="取消"
    />

    <!-- 默认头像选择弹窗 -->
    <van-popup v-model:show="showAvatarPicker" position="bottom" round :style="{ height: '60%' }">
      <div class="avatar-picker">
        <div class="picker-header">
          <h3>选择默认头像</h3>
          <van-icon name="cross" @click="showAvatarPicker = false" />
        </div>
        <div class="avatar-grid">
          <div v-for="(avatar, index) in defaultAvatars" :key="index" class="avatar-option"
            :class="{ 'selected': selectedAvatarIndex === index }" @click="selectDefaultAvatar(index)">
            <van-image :src="avatar.src" round width="60" height="60" fit="cover" />
            <div class="avatar-name">{{ avatar.name }}</div>
          </div>
        </div>
        <div class="picker-footer">
          <van-button type="primary" size="large" round @click="confirmDefaultAvatar"
            :disabled="selectedAvatarIndex === -1">
            确认选择
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 隐藏的文件上传组件 -->
    <van-uploader v-model="fileList" :after-read="afterRead" :max-count="1" :preview-image="false" ref="uploader"
      style="display: none;" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { showToast, showConfirmDialog } from 'vant'

// 导入本地头像
import avatar1 from '@/assets/avatars/avatar1.svg'
import avatar2 from '@/assets/avatars/avatar2.svg'
import avatar3 from '@/assets/avatars/avatar3.svg'
import avatar4 from '@/assets/avatars/avatar4.svg'
import avatar5 from '@/assets/avatars/avatar5.svg'
import avatar6 from '@/assets/avatars/avatar6.svg'

const router = useRouter()
const authStore = useAuthStore()

// 用户信息 - 从store中获取
const userInfo = ref({
  nickname: '',
  phone: '',
  email: '',
  bio: ''
})

// 保存状态
const saving = ref(false)

// 用户头像 - 动态获取
const userAvatar = computed(() => {
  return authStore.userInfo.avatar || 'https://fastly.jsdelivr.net/npm/@vant/assets/default_user.jpeg'
})

// 默认头像配置
const defaultAvatars = [
  { name: '红色头像', src: avatar1 },
  { name: '青色头像', src: avatar2 },
  { name: '蓝色头像', src: avatar3 },
  { name: '紫色头像', src: avatar4 },
  { name: '绿色头像', src: avatar5 },
  { name: '黄色头像', src: avatar6 }
]

// 控制状态
const showActionSheet = ref(false)
const showAvatarPicker = ref(false)
const selectedAvatarIndex = ref(-1)
const fileList = ref([])
const uploader = ref(null)

// 头像操作选项
const avatarActions = [
  {
    name: '选择默认头像',
    icon: 'photo-o'
  },
  {
    name: '上传自定义头像',
    icon: 'plus'
  }
]

// 返回上一页
const goBack = () => {
  router.back()
}

// 显示头像选择选项
const showAvatarOptions = () => {
  showActionSheet.value = true
}

// 选择操作
const onSelectAction = (action) => {
  showActionSheet.value = false

  if (action.name === '选择默认头像') {
    showAvatarPicker.value = true
    selectedAvatarIndex.value = -1
  } else if (action.name === '上传自定义头像') {
    // 触发文件选择
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        afterRead({ file })
      }
    }
    input.click()
  }
}

// 选择默认头像
const selectDefaultAvatar = (index) => {
  selectedAvatarIndex.value = index
}

// 确认选择默认头像
const confirmDefaultAvatar = async () => {
  if (selectedAvatarIndex.value !== -1 && authStore.isAuthenticated) {
    // 将默认头像转换为文件并上传
    const avatarUrl = defaultAvatars[selectedAvatarIndex.value].src
    
    try {
      // 创建一个临时的用户信息更新，包含头像URL
      const result = await authStore.updateUserInfo(authStore.userInfo._id, {
        avatar: avatarUrl
      })
      
      if (result.success) {
        showAvatarPicker.value = false
        showToast({
          message: '头像更换成功',
          type: 'success'
        })
      }
    } catch (error) {
      showToast({
        message: '头像更换失败',
        type: 'fail'
      })
    }
  } else if (!authStore.isAuthenticated) {
    showToast({
      message: '请先登录',
      type: 'fail'
    })
  }
}

// 处理上传的头像
const afterRead = async (file) => {
  if (!authStore.isAuthenticated) {
    showToast({
      message: '请先登录',
      type: 'fail'
    })
    return
  }

  const result = await authStore.uploadAvatar(authStore.userInfo._id, file.file)
  if (!result.success) {
    // 如果上传失败，使用本地预览
    const reader = new FileReader()
    reader.readAsDataURL(file.file)
    reader.onload = () => {
      // 临时显示本地图片
      showToast({
        message: '头像预览成功，请保存以上传到服务器',
        type: 'warning'
      })
    }
    reader.onerror = () => {
      showToast({
        message: '头像处理失败',
        type: 'fail'
      })
    }
  }
}

// 保存用户信息
const saveUserInfo = async () => {
  if (!authStore.isAuthenticated) {
    showToast({
      message: '请先登录',
      type: 'fail'
    })
    return
  }

  // 验证必填字段
  if (!userInfo.value.nickname.trim()) {
    showToast({
      message: '请输入昵称',
      type: 'fail'
    })
    return
  }

  saving.value = true

  try {
    const result = await authStore.updateUserInfo(authStore.userInfo._id, {
      nickname: userInfo.value.nickname.trim(),
      phone: userInfo.value.phone.trim(),
      email: userInfo.value.email.trim(),
      bio: userInfo.value.bio.trim()
    })

    if (result.success) {
      showToast({
        message: '保存成功',
        type: 'success'
      })
    }

  } catch (error) {
    showToast({
      message: '保存失败，请重试',
      type: 'fail'
    })
  } finally {
    saving.value = false
  }
}

// 初始化用户信息
const initUserInfo = () => {
  if (authStore.isAuthenticated && authStore.userInfo) {
    userInfo.value = {
      nickname: authStore.userInfo.nickname || '',
      phone: authStore.userInfo.phone || '',
      email: authStore.userInfo.email || '',
      bio: authStore.userInfo.bio || '热爱生活，减少浪费，让每一份食材都发挥最大价值！'
    }
  }
}

// 检查登录状态
const checkAuthStatus = async () => {
  if (!authStore.isAuthenticated) {
    const result = await showConfirmDialog({
      title: '未登录',
      message: '请先登录以查看和编辑个人信息',
      confirmButtonText: '去登录',
      cancelButtonText: '返回'
    })
    
    if (result === 'confirm') {
      router.push('/auth')
    } else {
      router.back()
    }
    return false
  }
  return true
}

// 页面挂载时初始化
onMounted(async () => {
  const isAuthenticated = await checkAuthStatus()
  if (isAuthenticated) {
    initUserInfo()
  }
})
</script>

<style lang="scss" scoped>
.personal-information {
  min-height: 100vh;
  background: #f5f5f5;

  .custom-nav-bar {
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .content {
    padding: 20px 16px;
  }

  .avatar-section {
    text-align: center;
    margin-bottom: 30px;
    padding: 20px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    .avatar-container {
      position: relative;
      display: inline-block;
      cursor: pointer;

      .avatar {
        transition: transform 0.3s ease;
        border: 3px solid #fff;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }

      .avatar-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      &:hover {
        .avatar {
          transform: scale(1.05);
        }

        .avatar-overlay {
          opacity: 1;
        }
      }

      &:active {
        .avatar {
          transform: scale(0.95);
        }
      }
    }

    .avatar-tip {
      margin-top: 12px;
      font-size: 14px;
      color: #969799;
    }
  }

  .form-section {
    margin-bottom: 30px;

    :deep(.van-cell-group) {
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    :deep(.van-field) {
      padding: 16px;

      .van-field__label {
        font-weight: 500;
        color: #323233;
      }
    }
  }

  .save-section {
    padding: 0 20px;

    .van-button {
      width: 100%;
      height: 50px;
      font-size: 16px;
      font-weight: 600;
      background: linear-gradient(135deg, rgba(0, 150, 5, 0.8) 0%, rgba(3, 253, 2, 0.8) 100%);
      border: none;
      box-shadow: 0 4px 16px rgba(0, 150, 5, 0.3);

      &:hover {
        box-shadow: 0 6px 20px rgba(0, 150, 5, 0.4);
      }

      &:active {
        transform: translateY(1px);
      }
    }
  }
}

// 头像选择器样式
.avatar-picker {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;

  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #323233;
    }

    .van-icon {
      font-size: 20px;
      color: #969799;
      cursor: pointer;
      padding: 5px;

      &:hover {
        color: #323233;
      }
    }
  }

  .avatar-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    flex: 1;
    overflow-y: auto;
    padding: 10px 0;

    .avatar-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 15px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;

      &:hover {
        background: #f7f8fa;
        transform: translateY(-2px);
      }

      &.selected {
        background: #e8f3ff;
        border-color: #1989fa;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(25, 137, 250, 0.2);
      }

      .avatar-name {
        margin-top: 8px;
        font-size: 12px;
        color: #646566;
        text-align: center;
      }

      &.selected .avatar-name {
        color: #1989fa;
        font-weight: 500;
      }
    }
  }

  .picker-footer {
    padding-top: 20px;
    border-top: 1px solid #eee;

    .van-button {
      width: 100%;
      height: 44px;
      font-size: 16px;
      font-weight: 600;
      background: linear-gradient(135deg, #1989fa 0%, #1677ff 100%);
      border: none;

      &:disabled {
        background: #f7f8fa;
        color: #c8c9cc;
      }
    }
  }
}

// 响应式设计
@media (max-width: 375px) {
  .avatar-picker .avatar-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
}
</style>