<template>
  <van-nav-bar title="个人中心" left-arrow @click-left="goBack" />
  <div class="mine-container">
    <!-- 顶部用户信息区域 -->
    <div class="header-section">
      <div class="user-profile">
        <div class="avatar-container">
          <van-image class="avatar" :src="userAvatar" round width="80" height="80" />
          <div class="vip-badge" v-if="authStore.isAuthenticated">
            <van-icon name="diamond-o" />
          </div>
        </div>
        <div class="user-info">
          <h2 class="username">{{ displayName }}</h2>
          <div class="user-tags" v-if="authStore.isAuthenticated">
            <van-tag type="warning" size="mini" round>★ 高级会员</van-tag>
            <van-tag type="success" size="mini" round>环保达人</van-tag>
          </div>
          <div class="user-tags" v-else>
            <van-tag type="default" size="mini" round>未登录</van-tag>
          </div>
          <p class="achievement" v-if="authStore.isAuthenticated">已节省食物浪费 {{ userStats.totalSavings }}g</p>
          <p class="achievement" v-else>登录后查看更多功能</p>
        </div>
        <van-button v-if="authStore.isAuthenticated" type="primary" size="small" round icon="edit" @click="editProfile"
          class="edit-btn">
          编辑
        </van-button>
        <van-button v-else type="primary" size="small" round icon="contact" @click="goToAuth" class="edit-btn">
          登录
        </van-button>
      </div>
    </div>

    <!-- 智能设备状态 -->
    <div class="device-section">
      <div class="section-title">
        <h3>智能设备</h3>
        <span class="device-count">{{ connectedDevices }}/3 已连接</span>
      </div>
      <div class="device-list">
        <div class="device-item" @click="manageDevice('fridge')">
          <div class="device-info">
            <div class="device-icon fridge">
              <van-icon name="shop-o" />
            </div>
            <div class="device-details">
              <h4>智能冰箱</h4>
              <p>{{ deviceStatus.fridge ? '运行正常' : '离线状态' }}</p>
            </div>
          </div>
          <div class="device-status">
            <div :class="['status-dot', deviceStatus.fridge ? 'online' : 'offline']"></div>
          </div>
        </div>

        <div class="device-item" @click="manageDevice('scale')">
          <div class="device-info">
            <div class="device-icon scale">
              <van-icon name="balance-o" />
            </div>
            <div class="device-details">
              <h4>智能冰柜</h4>
              <p>{{ deviceStatus.scale ? '运行正常' : '离线状态' }}</p>
            </div>
          </div>
          <div class="device-status">
            <div :class="['status-dot', deviceStatus.scale ? 'online' : 'offline']"></div>
          </div>
        </div>

        <div class="device-item" @click="manageDevice('printer')">
          <div class="device-info">
            <div class="device-icon printer">
              <van-icon name="printer" />
            </div>
            <div class="device-details">
              <h4>标签打印机</h4>
              <p>{{ deviceStatus.printer ? '运行正常' : '离线状态' }}</p>
            </div>
          </div>
          <div class="device-status">
            <div :class="['status-dot', deviceStatus.printer ? 'online' : 'offline']"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置菜单 -->
    <div class="settings-section">
      <div class="section-title">
        <h3>基本设置</h3>
      </div>
      <div class="settings-grid">
        <div class="setting-item" @click="openSettings('notification')">
          <div class="setting-icon notification">
            <van-icon name="bell" />
          </div>
          <span>通知设置</span>
          <van-icon name="arrow" class="arrow-icon" />
        </div>

        <div class="setting-item" @click="openSettings('storage')">
          <div class="setting-icon storage">
            <van-icon name="notes-o" />
          </div>
          <span>存储管理</span>
          <van-icon name="arrow" class="arrow-icon" />
        </div>

        <div class="setting-item" @click="openSettings('theme')">
          <div class="setting-icon theme">
            <van-icon name="setting-o" />
          </div>
          <span>主题模式</span>
          <van-icon name="arrow" class="arrow-icon" />
        </div>

        <div class="setting-item" @click="openSettings('units')">
          <div class="setting-icon units">
            <van-icon name="like-o" />
          </div>
          <span>我的喜欢</span>
          <van-icon name="arrow" class="arrow-icon" />
        </div>

        <div class="setting-item" @click="openSettings('favorites')">
          <div class="setting-icon favorites">
            <van-icon name="star-o" />
          </div>
          <span>我的收藏</span>
          <van-icon name="arrow" class="arrow-icon" />
        </div>
      </div>
    </div>

    <!-- 家庭成员 -->
    <div class="family-section">
      <div class="section-title">
        <h3>家庭成员</h3>
        <van-button type="primary" size="mini" round icon="plus" @click="inviteMember">
          邀请
        </van-button>
      </div>
      <div class="member-carousel">
        <div class="member-item" v-for="member in familyMembers" :key="member.id">
          <van-image :src="member.avatar" round width="50" height="50" class="member-avatar" />
          <span class="member-name">{{ member.name }}</span>
          <div class="member-role">{{ member.role === 'admin' ? '管理员' : '成员' }}</div>
        </div>
      </div>
    </div>

    <!-- 底部支持区域 -->
    <div class="support-section">
      <div class="support-list">
        <div class="support-item" @click="openSupport('manual')">
          <van-icon name="description" />
          <span>用户手册</span>
        </div>
        <div class="support-item" @click="openSupport('feedback')">
          <van-icon name="chat-o" />
          <span>意见反馈</span>
        </div>
        <div class="support-item" @click="openSupport('about')">
          <van-icon name="info-o" />
          <span>关于我们</span>
        </div>
        <div class="support-item logout" @click="logout">
          <van-icon name="sign" />
          <span>{{ authStore.isAuthenticated ? '退出登录' : '登录' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router' //这里使用局部导入，方便维护
import { useAuthStore } from '@/store/auth'
import { showToast, showConfirmDialog, showNotify } from 'vant'

// 路由实例
const router = useRouter()
const authStore = useAuthStore()

// 用户统计数据
const userStats = ref({
  totalSavings: 1280
})

// 家庭成员数据
const familyMembers = ref([
  {
    id: 1,
    name: '妈妈',
    avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    role: 'admin'
  },
  {
    id: 2,
    name: '爸爸',
    avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    role: 'member'
  }
])

// 设备连接状态
const deviceStatus = ref({
  fridge: true,
  scale: false,
  printer: false
})

// 计算已连接设备数量
const connectedDevices = computed(() => {
  return Object.values(deviceStatus.value).filter(status => status).length
})

// 用户显示名称
const displayName = computed(() => {
  if (authStore.isAuthenticated && authStore.userInfo.nickname) {
    return authStore.userInfo.nickname
  }
  return '智能厨房管家'
})

// 默认头像列表
const defaultAvatars = [
  '/src/assets/avatars/avatar1.svg',
  '/src/assets/avatars/avatar2.svg',
  '/src/assets/avatars/avatar3.svg',
  '/src/assets/avatars/avatar4.svg',
  '/src/assets/avatars/avatar5.svg',
  '/src/assets/avatars/avatar6.svg'
]

// 用户头像
const userAvatar = computed(() => {
  if (authStore.isAuthenticated && authStore.userInfo.avatar && authStore.userInfo.avatar.trim() !== '') {
    return authStore.userInfo.avatar
  } else if (authStore.isAuthenticated) {
    // 根据用户ID随机分配默认头像
    const userId = authStore.userInfo.id || authStore.userInfo._id || '1'
    const avatarIndex = parseInt(userId.toString().slice(-1)) % defaultAvatars.length
    return defaultAvatars[avatarIndex]
  }
  return 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
})

// 页面加载时的初始化
// onMounted(() => {
//   // 模拟加载用户数据
// })

// 编辑资料
const editProfile = () => {
  if (authStore.isAuthenticated) {
    router.push({ name: 'PersonalInformation' })
  } else {
    goToAuth()
  }
}

// 跳转到登录页面
const goToAuth = () => {
  router.push({ name: 'Auth' })
}

// 返回
const goBack = (path = -1) => {
  if (typeof path === 'string') {
    router.push(path)
  } else {
    history.back()
  }
}

// 设备管理
const manageDevice = (deviceType) => {
  const deviceNames = {
    fridge: '智能冰箱',
    scale: '智能冰柜',
    printer: '智能标签打印机'
  }

  const isConnected = deviceStatus.value[deviceType]

  if (isConnected) {
    // 设备已连接，显示管理选项
    showConfirmDialog({
      title: `管理${deviceNames[deviceType]}`,
      message: '设备已连接，您可以进行以下操作：',
      confirmButtonText: '查看详情',
      cancelButtonText: '断开连接'
    }).then(() => {
      showToast(`查看${deviceNames[deviceType]}详情`)
    }).catch(() => {
      // 断开设备连接
      deviceStatus.value[deviceType] = false
      showToast(`已断开${deviceNames[deviceType]}连接`)
    })
  } else {
    // 设备未连接，尝试连接
    showConfirmDialog({
      title: `连接${deviceNames[deviceType]}`,
      message: '设备未连接，是否尝试连接？',
      confirmButtonText: '连接设备',
      cancelButtonText: '取消'
    }).then(() => {
      // 模拟连接过程
      showToast('正在连接设备...')
      setTimeout(() => {
        const success = Math.random() > 0.3 // 70% 成功率
        if (success) {
          deviceStatus.value[deviceType] = true
          showNotify({
            type: 'success',
            message: `${deviceNames[deviceType]}连接成功！`
          })
        } else {
          showNotify({
            type: 'danger',
            message: `${deviceNames[deviceType]}连接失败，请检查设备状态`
          })
        }
      }, 2000)
    })
  }
}

// 邀请家庭成员
const inviteMember = () => {
  showToast('邀请新成员功能开发中...')
}



// 系统设置
const openSettings = (settingType) => {
  const settingNames = {
    notification: '通知设置',
    storage: '存储空间设置',
    units: '单位偏好',
    theme: '主题模式',
    favorites: '我的收藏'
  }

  if (settingType === 'theme') {
    // 主题切换逻辑
    showConfirmDialog({
      title: '选择主题',
      message: '请选择您喜欢的主题模式',
      confirmButtonText: '深色模式',
      cancelButtonText: '浅色模式'
    }).then(() => {
      showToast('已切换到深色模式')
      // 这里可以添加实际的主题切换逻辑
    }).catch(() => {
      showToast('已切换到浅色模式')
    })
  } else {
    showToast(`打开${settingNames[settingType]}`)
  }
}

// 支持与反馈
const openSupport = (supportType) => {
  const supportNames = {
    manual: '用户手册',
    feedback: '意见反馈',
    about: '关于我们'
  }
  showToast(`打开${supportNames[supportType]}`)
}

// 退出登录
const logout = () => {
  if (!authStore.isAuthenticated) {
    goToAuth()
    return
  }

  showConfirmDialog({
    title: '确认退出',
    message: '确定要退出登录吗？',
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    confirmButtonColor: '#ee0a24'
  }).then(() => {
    authStore.logout()
    // 退出后跳转到登录页面
    router.push({ name: 'Auth' })
  }).catch(() => {
    // 用户取消
  })
}

// 监听用户信息变化，实时更新页面
watch(() => authStore.userInfo, (newUserInfo) => {
  if (newUserInfo) {
    // 用户信息更新时，可以在这里执行一些额外的逻辑
    // console.log('用户信息已更新:', newUserInfo)
  }
}, { deep: true })

// 页面初始化
onMounted(async () => {
  // 如果有token但没有用户信息，尝试验证token
  if (authStore.token && !authStore.user) {
    try {
      await authStore.verifyToken()
    } catch (error) {
      console.log('Token验证失败，可能已过期')
    }
  }
  
  // 如果已登录，获取最新用户信息
  if (authStore.isAuthenticated && authStore.userInfo) {
    try {
      await authStore.fetchUserInfo(authStore.userInfo._id)
    } catch (error) {
      console.log('获取用户信息失败:', error)
    }
  }
})
</script>

<style scoped lang="scss">
.mine-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding-bottom: 80px;

  // 顶部用户信息区域
  .header-section {
    background: linear-gradient(135deg, rgba(0, 150, 5, 0.3) 0%, rgba(3, 253, 2, 0.4) 100%);
    padding: 20px 16px 30px;
    // border-radius: 0 0 24px 24px;
    margin-bottom: 20px;

    .user-profile {
      display: flex;
      align-items: center;
      gap: 16px;

      .avatar-container {
        position: relative;

        .vip-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);

          .van-icon {
            color: #fff;
            font-size: 12px;
          }
        }
      }

      .user-info {
        flex: 1;

        .username {
          color: white;
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .user-tags {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .achievement {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          margin: 0;
        }
      }

      .edit-btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        backdrop-filter: blur(10px);
      }
    }
  }



  // 智能设备状态
  .device-section {
    padding: 0 16px;
    margin-bottom: 24px;

    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      h3 {
        font-size: 18px;
        font-weight: 600;
        color: #323233;
        margin: 0;
      }

      .device-count {
        font-size: 12px;
        color: #969799;
        background: #f7f8fa;
        padding: 4px 8px;
        border-radius: 8px;
      }
    }

    .device-list {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

      .device-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        cursor: pointer;
        transition: background-color 0.2s ease;

        &:not(:last-child) {
          border-bottom: 1px solid #f7f8fa;
        }

        &:active {
          background-color: #f7f8fa;
        }

        .device-info {
          display: flex;
          align-items: center;
          gap: 12px;

          .device-icon {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;

            .van-icon {
              font-size: 20px;
              color: white;
            }

            &.fridge {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            &.scale {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }

            &.printer {
              background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
            }
          }

          .device-details {
            h4 {
              font-size: 16px;
              font-weight: 600;
              color: #323233;
              margin: 0 0 4px 0;
            }

            p {
              font-size: 12px;
              color: #969799;
              margin: 0;
            }
          }
        }

        .device-status {
          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;

            &.online {
              background: #07c160;
              box-shadow: 0 0 0 2px rgba(7, 193, 96, 0.2);
            }

            &.offline {
              background: #ee0a24;
              box-shadow: 0 0 0 2px rgba(238, 10, 36, 0.2);
            }
          }
        }
      }
    }
  }

  // 家庭成员
  .family-section {
    padding: 0 16px;
    margin-bottom: 24px;

    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      h3 {
        font-size: 18px;
        font-weight: 600;
        color: #323233;
        margin: 0;
      }
    }

    .member-carousel {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      padding-bottom: 8px;

      .member-item {
        flex-shrink: 0;
        text-align: center;
        background: white;
        border-radius: 16px;
        padding: 16px 12px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        min-width: 80px;

        .member-avatar {
          margin-bottom: 8px;
        }

        .member-name {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #323233;
          margin-bottom: 4px;
        }

        .member-role {
          font-size: 12px;
          color: #969799;
        }
      }
    }
  }

  // 设置菜单
  .settings-section {
    padding: 0 16px;
    margin-bottom: 24px;

    .settings-grid {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

      .setting-item {
        display: flex;
        align-items: center;
        padding: 16px;
        cursor: pointer;
        transition: background-color 0.2s ease;

        &:not(:last-child) {
          border-bottom: 1px solid #f7f8fa;
        }

        &:active {
          background-color: #f7f8fa;
        }

        .setting-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;

          .van-icon {
            font-size: 18px;
            color: white;
          }

          &.notification {
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
          }

          &.storage {
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
          }

          &.theme {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.units {
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          }

          &.favorites {
            background: linear-gradient(135deg, #fddb92 0%, #d1fdff 100%);
          }
        }

        span {
          flex: 1;
          font-size: 16px;
          color: #323233;
        }

        .arrow-icon {
          color: #c8c9cc;
          transform: rotate(-90deg);
        }
      }
    }
  }

  // 底部支持区域
  .support-section {
    padding: 0 16px;

    .support-list {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;

      .support-item {
        background: white;
        border-radius: 12px;
        padding: 16px 8px;
        text-align: center;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        cursor: pointer;
        transition: all 0.3s ease;

        &:active {
          transform: scale(0.95);
        }

        &.logout {

          .van-icon,
          span {
            color: #ee0a24;
          }
        }

        .van-icon {
          font-size: 20px;
          color: #646566;
          margin-bottom: 8px;
        }

        span {
          display: block;
          font-size: 12px;
          color: #646566;
        }
      }
    }
  }

  // 响应式设计
  @media (max-width: 375px) {
    // 响应式样式保留
  }
}
</style>