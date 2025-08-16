<template>
  <div class="auth-page">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
      <div class="decoration-circle circle-4"></div>
      <div class="decoration-circle circle-5"></div>
      <div class="floating-dots">
        <div class="dot dot-1"></div>
        <div class="dot dot-2"></div>
        <div class="dot dot-3"></div>
        <div class="dot dot-4"></div>
        <div class="dot dot-5"></div>
        <div class="dot dot-6"></div>
      </div>
    </div>

    <div class="auth-container">
      <!-- Logo区域 -->
      <div class="logo-section">
        <div class="logo-icon">
          <img src="/src/assets/images/ArcticonsShopeefoodDriver.svg" alt="Logo" class="logo-image" />
        </div>
        <h1 class="app-title">鲜存</h1>
        <p class="app-subtitle">让每一份食材都发挥最大价值</p>
      </div>

      <!-- 切换标签 -->
      <div class="tab-section">
        <van-tabs v-model:active="activeTab" @change="onTabChange" class="auth-tabs">
          <van-tab title="登录" name="login">
            <!-- 登录表单 -->
            <div class="form-container">
              <van-form @submit="handleLogin" ref="loginForm">
                <van-field v-model="loginFormData.username" name="username" label="账号" placeholder="请输入用户名/手机号/邮箱"
                  :rules="[{ required: true, message: '请输入用户名/手机号/邮箱' }]" left-icon="contact" clearable />
                <van-field v-model="loginFormData.password" type="password" name="password" label="密码"
                  placeholder="请输入密码" :rules="[{ required: true, message: '请输入密码' }]" left-icon="lock" clearable />

                <div class="form-footer">
                  <van-checkbox v-model="agreeLogin">我同意用户协议</van-checkbox>
                  <span class="forgot-password" @click="showForgotPassword">忘记密码？</span>
                </div>

                <div class="remember-me-section">
                  <van-checkbox v-model="rememberMe">七天免登录</van-checkbox>
                </div>

                <van-button round block type="primary" native-type="submit" :loading="authStore.loading"
                  :disabled="!agreeLogin" class="submit-btn">
                  登录
                </van-button>
              </van-form>
            </div>
          </van-tab>

          <van-tab title="注册" name="register">
            <!-- 注册表单 -->
            <div class="form-container">
              <van-form @submit="handleRegister" ref="registerForm">
                <van-field v-model="registerFormData.username" name="username" label="用户名" placeholder="请输入用户名"
                  :rules="usernameRules" left-icon="contact" clearable />
                <van-field v-model="registerFormData.email" name="email" label="邮箱" placeholder="请输入邮箱地址"
                  :rules="emailRules" left-icon="envelop-o" clearable />
                <van-field v-model="registerFormData.phone" name="phone" label="手机号" placeholder="请输入手机号"
                  :rules="phoneRules" left-icon="phone-o" clearable />
                <van-field v-model="registerFormData.password" type="password" name="password" label="密码"
                  placeholder="请输入密码" :rules="passwordRules" left-icon="lock" clearable />
                
                <!-- 密码强度指示器 -->
                <div class="password-strength" v-if="registerFormData.password">
                  <div class="strength-bar">
                    <div class="strength-fill" :style="{ 
                      width: (passwordStrength.level / 4) * 100 + '%', 
                      backgroundColor: passwordStrength.color 
                    }"></div>
                  </div>
                  <div class="strength-text" :style="{ color: passwordStrength.color }">
                    密码强度：{{ passwordStrength.text }}
                  </div>
                  <div class="strength-suggestions" v-if="passwordStrength.suggestions.length > 0">
                    <div class="suggestion-item" v-for="suggestion in passwordStrength.suggestions" :key="suggestion">
                      • {{ suggestion }}
                    </div>
                  </div>
                </div>

                <van-field v-model="registerFormData.confirmPassword" type="password" name="confirmPassword"
                  label="确认密码" placeholder="请再次输入密码" :rules="confirmPasswordRules" left-icon="lock" clearable />

                <div class="form-footer">
                  <van-checkbox v-model="agreeTerms">
                    我已阅读并同意
                    <span class="terms-link" @click="showTerms">《用户协议》</span>
                  </van-checkbox>
                </div>

                <van-button round block type="primary" native-type="submit" :loading="authStore.loading"
                  :disabled="!agreeTerms" class="submit-btn">
                  注册
                </van-button>
              </van-form>
            </div>
          </van-tab>
        </van-tabs>
      </div>

      <!-- 第三方登录 -->
      <div class="social-login">
        <div class="divider">
          <span>其他登录方式</span>
        </div>
        <div class="social-buttons">
          <div class="social-btn" @click="handleSocialLogin('wechat')">
            <van-icon name="wechat" size="24" color="#07c160" />
            <span>微信</span>
          </div>
          <div class="social-btn" @click="handleSocialLogin('qq')">
            <van-icon name="qq" size="24" color="#1677ff" />
            <span>QQ</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 忘记密码弹窗 -->
    <van-popup v-model:show="showForgotPasswordDialog" position="center" round>
      <div class="forgot-password-dialog">
        <h3>找回密码</h3>
        <van-form @submit="handleForgotPassword">
          <van-field v-model="forgotPasswordForm.email" name="email" label="邮箱" placeholder="请输入注册邮箱"
            :rules="emailRules" left-icon="envelop-o" clearable />
          <div class="dialog-buttons">
            <van-button @click="showForgotPasswordDialog = false">取消</van-button>
            <van-button type="primary" native-type="submit">发送重置邮件</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 用户协议弹窗 -->
    <van-popup v-model:show="showTermsDialog" position="center" round :style="{ width: '90%', maxHeight: '70%' }">
      <div class="terms-dialog">
        <div class="terms-header">
          <h3>用户协议</h3>
          <van-icon name="cross" @click="showTermsDialog = false" />
        </div>
        <div class="terms-content">
          <h4>1. 服务条款</h4>
          <p>欢迎使用智能食材管理系统。在使用本服务前，请仔细阅读本协议。</p>

          <h4>2. 用户责任</h4>
          <p>用户应当妥善保管账户信息，不得将账户借给他人使用。</p>

          <h4>3. 隐私保护</h4>
          <p>我们承诺保护用户隐私，不会泄露用户个人信息。</p>

          <h4>4. 服务变更</h4>
          <p>我们保留随时修改或终止服务的权利。</p>

          <h4>5. 免责声明</h4>
          <p>用户使用本服务产生的风险由用户自行承担。</p>
        </div>
        <div class="terms-footer">
          <van-button type="primary" @click="showTermsDialog = false">我已阅读</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { showToast } from 'vant'
import { checkPasswordStrength } from '@/utils/passwordStrength'

const router = useRouter()
const authStore = useAuthStore()

// 当前激活的标签
const activeTab = ref('login')

// 表单引用
const loginForm = ref(null)
const registerForm = ref(null)

// 登录表单数据
const loginFormData = reactive({
  username: '',
  password: ''
})

// 注册表单数据
const registerFormData = reactive({
  username: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

// 忘记密码表单数据
const forgotPasswordForm = reactive({
  email: ''
})

// 控制状态
const rememberMe = ref(false)
const agreeLogin = ref(false)
const agreeTerms = ref(false)
const showForgotPasswordDialog = ref(false)
const showTermsDialog = ref(false)

// 密码强度检测
const passwordStrength = computed(() => {
  return checkPasswordStrength(registerFormData.password)
})

// 监听密码变化，实时检测强度
watch(() => registerFormData.password, () => {
  // 触发响应式更新
}, { immediate: true })

// 表单验证规则
const usernameRules = [
  { required: true, message: '请输入用户名' },
  { min: 3, max: 20, message: '用户名长度为3-20个字符' },
  { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
]

const emailRules = [
  { required: true, message: '请输入邮箱地址' },
  { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入正确的邮箱格式' }
]

const phoneRules = [
  { required: true, message: '请输入手机号' },
  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式' }
]

const passwordRules = [
  { required: true, message: '请输入密码' },
  { min: 6, max: 20, message: '密码长度为6-20个字符' },
  { pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码必须包含字母和数字' }
]

const confirmPasswordRules = [
  { required: true, message: '请确认密码' },
  {
    validator: (value) => {
      if (value !== registerFormData.password) {
        return '两次输入的密码不一致'
      }
      return true
    }
  }
]

// 标签切换
const onTabChange = (name) => {
  activeTab.value = name
  // 清空表单数据
  if (name === 'login') {
    Object.assign(loginFormData, { username: '', password: '' })
  } else {
    Object.assign(registerFormData, {
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    })
  }
}

// 处理登录
const handleLogin = async () => {
  const result = await authStore.login({
    username: loginFormData.username,
    password: loginFormData.password,
    rememberMe: rememberMe.value // 根据用户选择决定是否七天免登录
  })

  if (result.success) {
    // 登录成功，跳转到首页
    router.replace('/')
  }
}

// 处理注册
const handleRegister = async () => {
  const result = await authStore.register({
    username: registerFormData.username,
    email: registerFormData.email,
    phone: registerFormData.phone,
    password: registerFormData.password,
    nickname: registerFormData.username // 默认昵称为用户名
  })

  if (result.success) {
    // 注册成功，自动跳转到登录界面并补全用户名
    activeTab.value = 'login'
    loginFormData.username = registerFormData.username
    showToast({
      message: '注册成功，请登录',
      type: 'success'
    })
    
    // 清空注册表单
    Object.assign(registerFormData, {
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    })
  }
}

// 显示忘记密码对话框
const showForgotPassword = () => {
  showForgotPasswordDialog.value = true
}

// 处理忘记密码
const handleForgotPassword = () => {
  showToast({
    message: '重置邮件已发送，请查收',
    type: 'success'
  })
  showForgotPasswordDialog.value = false
}

// 显示用户协议
const showTerms = () => {
  showTermsDialog.value = true
}

// 第三方登录
const handleSocialLogin = (platform) => {
  showToast({
    message: `${platform === 'wechat' ? '微信' : 'QQ'}登录功能开发中`,
    type: 'warning'
  })
}
</script>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 20% 80%, rgba(0, 150, 5, 0.4) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(3, 253, 2, 0.3) 0%, transparent 60%),
    radial-gradient(ellipse at 40% 40%, rgba(0, 150, 5, 0.2) 0%, transparent 50%),
    radial-gradient(ellipse at 60% 70%, rgba(3, 253, 2, 0.15) 0%, transparent 40%),
    linear-gradient(135deg,
      rgba(0, 150, 5, 0.7) 0%,
      rgba(0, 150, 5, 0.4) 20%,
      rgba(3, 253, 2, 0.5) 40%,
      rgba(0, 150, 5, 0.3) 60%,
      rgba(3, 253, 2, 0.4) 80%,
      rgba(0, 150, 5, 0.6) 100%),
    linear-gradient(45deg,
      rgba(255, 255, 255, 0.02) 0%,
      transparent 50%,
      rgba(255, 255, 255, 0.01) 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      repeating-linear-gradient(45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.01) 2px,
        rgba(255, 255, 255, 0.01) 4px);
    pointer-events: none;
  }
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;

  .decoration-circle {
    position: absolute;
    border-radius: 50%;
    animation: float 8s ease-in-out infinite;
    backdrop-filter: blur(3px);

    &.circle-1 {
      width: 280px;
      height: 280px;
      top: -140px;
      right: -140px;
      animation-delay: 0s;
      background:
        radial-gradient(circle at 30% 30%, rgba(3, 253, 2, 0.2) 0%, transparent 70%),
        linear-gradient(45deg, rgba(0, 150, 5, 0.1) 0%, rgba(3, 253, 2, 0.15) 100%);
      box-shadow: 0 0 60px rgba(0, 150, 5, 0.1);
    }

    &.circle-2 {
      width: 200px;
      height: 200px;
      bottom: -100px;
      left: -100px;
      animation-delay: 3s;
      background:
        radial-gradient(circle at 70% 70%, rgba(0, 150, 5, 0.18) 0%, transparent 70%),
        linear-gradient(-45deg, rgba(3, 253, 2, 0.12) 0%, rgba(0, 150, 5, 0.08) 100%);
      box-shadow: 0 0 40px rgba(3, 253, 2, 0.1);
    }

    &.circle-3 {
      width: 150px;
      height: 150px;
      top: 40%;
      left: -75px;
      animation-delay: 6s;
      background:
        radial-gradient(circle at 50% 50%, rgba(0, 150, 5, 0.15) 0%, transparent 70%),
        linear-gradient(90deg, rgba(3, 253, 2, 0.1) 0%, rgba(0, 150, 5, 0.12) 100%);
      box-shadow: 0 0 30px rgba(0, 150, 5, 0.08);
    }

    &.circle-4 {
      width: 100px;
      height: 100px;
      top: 20%;
      right: 10%;
      animation-delay: 4s;
      background:
        radial-gradient(circle at 40% 60%, rgba(3, 253, 2, 0.12) 0%, transparent 70%);
      box-shadow: 0 0 20px rgba(3, 253, 2, 0.1);
    }

    &.circle-5 {
      width: 80px;
      height: 80px;
      bottom: 30%;
      right: -40px;
      animation-delay: 7s;
      background:
        radial-gradient(circle at 60% 40%, rgba(0, 150, 5, 0.1) 0%, transparent 70%);
      box-shadow: 0 0 15px rgba(0, 150, 5, 0.08);
    }
  }

  .floating-dots {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;

    .dot {
      position: absolute;
      border-radius: 50%;
      animation: pulse 4s ease-in-out infinite;

      &.dot-1 {
        width: 8px;
        height: 8px;
        top: 15%;
        left: 20%;
        background: rgba(0, 150, 5, 0.4);
        animation-delay: 0s;
      }

      &.dot-2 {
        width: 6px;
        height: 6px;
        top: 25%;
        right: 25%;
        background: rgba(3, 253, 2, 0.5);
        animation-delay: 1s;
      }

      &.dot-3 {
        width: 10px;
        height: 10px;
        top: 45%;
        right: 15%;
        background: rgba(0, 150, 5, 0.3);
        animation-delay: 2s;
      }

      &.dot-4 {
        width: 7px;
        height: 7px;
        bottom: 35%;
        left: 15%;
        background: rgba(3, 253, 2, 0.4);
        animation-delay: 3s;
      }

      &.dot-5 {
        width: 9px;
        height: 9px;
        bottom: 20%;
        right: 30%;
        background: rgba(0, 150, 5, 0.35);
        animation-delay: 4s;
      }

      &.dot-6 {
        width: 5px;
        height: 5px;
        top: 35%;
        left: 10%;
        background: rgba(3, 253, 2, 0.6);
        animation-delay: 5s;
      }
    }
  }
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0px) rotate(0deg) scale(1);
    opacity: 0.6;
  }

  33% {
    transform: translateY(-15px) rotate(60deg) scale(1.05);
    opacity: 0.7;
  }

  66% {
    transform: translateY(-25px) rotate(120deg) scale(0.95);
    opacity: 0.8;
  }
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.3;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.6;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(100px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-container {
  position: relative;
  z-index: 1;
  padding: 40px 20px 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  animation: fadeInUp 0.8s ease-out;
}

.logo-section {
  text-align: center;
  margin-bottom: 50px;
  padding: 30px 20px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .logo-icon {
    width: 130px;
    height: 130px;
    background:
      radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 100%),
      linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 30px;
    backdrop-filter: blur(20px);
    border: 3px solid rgba(255, 255, 255, 0.5);
    box-shadow:
      0 8px 32px rgba(0, 150, 5, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.6),
      0 0 0 1px rgba(255, 255, 255, 0.1);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 1;

    &::before {
      content: '';
      position: absolute;
      top: -5px;
      left: -5px;
      right: -5px;
      bottom: -5px;
      background: linear-gradient(45deg, rgba(0, 150, 5, 0.3), rgba(3, 253, 2, 0.3));
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: -1;
    }

    &:hover {
      transform: translateY(-8px) scale(1.05);
      box-shadow:
        0 15px 45px rgba(0, 150, 5, 0.35),
        inset 0 1px 0 rgba(255, 255, 255, 0.8),
        0 0 0 1px rgba(255, 255, 255, 0.2);

      &::before {
        opacity: 1;
      }
    }

    .logo-image {
      width: 75px;
      height: 75px;
      filter: drop-shadow(0 3px 12px rgba(0, 150, 5, 0.4));
      transition: all 0.3s ease;
    }

    &:hover .logo-image {
      filter: drop-shadow(0 5px 15px rgba(0, 150, 5, 0.6));
      transform: scale(1.1);
    }
  }

  .app-title {
    font-size: 36px;
    font-weight: 900;
    color: white;
    margin: 0 0 15px 0;
    text-shadow:
      0 2px 4px rgba(0, 0, 0, 0.3),
      0 4px 8px rgba(0, 150, 5, 0.2);
    letter-spacing: 2px;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
      transform: translateX(-50%);
    }
  }

  .app-subtitle {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.95);
    margin: 0;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    font-weight: 400;
    line-height: 1.4;
  }
}

.tab-section {
  flex: 1;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
  border-radius: 30px 30px 0 0;
  overflow: hidden;
  box-shadow:
    0 -12px 40px rgba(0, 150, 5, 0.2),
    0 -4px 20px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  animation: slideInFromBottom 0.6s ease-out 0.3s both;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 150, 5, 0.3), transparent);
  }

  .auth-tabs {
    :deep(.van-tabs__nav) {
      background: linear-gradient(135deg, #ffffff 0%, #f8fffe 100%);
      padding: 0 25px;
      border-bottom: 1px solid rgba(0, 150, 5, 0.1);
    }

    :deep(.van-tab) {
      font-size: 17px;
      font-weight: 700;
      color: #666;
      margin-top: 15px;
      padding-bottom: 18px;
      transition: all 0.3s ease;

      &.van-tab--active {
        color: rgba(0, 150, 5, 0.8);
      }
    }

    :deep(.van-tabs__line) {
      background: linear-gradient(135deg, rgba(0, 150, 5, 0.8) 0%, rgba(3, 253, 2, 0.8) 100%);
      height: 4px;
      border-radius: 2px;
      box-shadow: 0 2px 8px rgba(0, 150, 5, 0.3);
      bottom: 8px;
    }
  }
}

.form-container {
  padding: 35px 25px;
  background: linear-gradient(135deg, #ffffff 0%, #fafffe 100%);

  :deep(.van-field) {
    margin-bottom: 18px;
    border-radius: 15px;
    background: linear-gradient(135deg, #f8fffe 0%, #f0fff0 100%);
    border: 2px solid rgba(0, 150, 5, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 150, 5, 0.05);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(0, 150, 5, 0.1), transparent);
      transition: left 0.6s ease;
    }

    &:focus-within {
      border-color: rgba(0, 150, 5, 0.4);
      box-shadow: 0 0 0 3px rgba(0, 150, 5, 0.1), 0 4px 12px rgba(0, 150, 5, 0.1);
      transform: translateY(-2px);

      &::before {
        left: 100%;
      }
    }

    &:hover:not(:focus-within) {
      border-color: rgba(0, 150, 5, 0.2);
      transform: translateY(-1px);
    }

    .van-field__label {
      font-weight: 600;
      color: rgba(0, 150, 5, 0.7);
      transition: color 0.3s ease;
    }

    .van-field__control {
      font-size: 16px;
      color: #2c3e50;
      transition: color 0.3s ease;

      &::placeholder {
        color: rgba(0, 150, 5, 0.4);
      }
    }

    .van-field__left-icon {
      color: rgba(0, 150, 5, 0.6);
      transition: all 0.3s ease;
    }

    &:focus-within .van-field__left-icon {
      color: rgba(0, 150, 5, 0.8);
      transform: scale(1.1);
    }
  }

  .password-strength {
    margin: 10px 0 15px 0;
    padding: 12px 15px;
    background: linear-gradient(135deg, #f8fffe 0%, #f0fff0 100%);
    border-radius: 12px;
    border: 1px solid rgba(0, 150, 5, 0.1);

    .strength-bar {
      width: 100%;
      height: 6px;
      background: #e5e5e5;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;

      .strength-fill {
        height: 100%;
        border-radius: 3px;
        transition: all 0.3s ease;
      }
    }

    .strength-text {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .strength-suggestions {
      font-size: 12px;
      color: #666;

      .suggestion-item {
        margin: 2px 0;
        line-height: 1.4;
      }
    }
  }

  .form-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 25px 0 35px;
    font-size: 14px;

    :deep(.van-checkbox) {
      .van-checkbox__icon--checked {
        background-color: rgba(0, 150, 5, 0.8);
        border-color: rgba(0, 150, 5, 0.8);
      }
    }

    .forgot-password,
    .terms-link {
      color: rgba(0, 150, 5, 0.8);
      cursor: pointer;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        color: rgba(0, 150, 5, 1);
        text-decoration: underline;
      }
    }
  }

  .remember-me-section {
    margin: 15px 0 25px;
    padding: 12px 15px;
    background: linear-gradient(135deg, #f8fffe 0%, #f0fff0 100%);
    border-radius: 12px;
    border: 1px solid rgba(0, 150, 5, 0.1);

    :deep(.van-checkbox) {
      .van-checkbox__icon--checked {
        background-color: rgba(0, 150, 5, 0.8);
        border-color: rgba(0, 150, 5, 0.8);
      }

      .van-checkbox__label {
        color: rgba(0, 150, 5, 0.7);
        font-weight: 500;
        font-size: 14px;
      }
    }
  }

  .submit-btn {
    height: 55px;
    font-size: 17px;
    font-weight: 700;
    background: linear-gradient(135deg, rgba(0, 150, 5, 0.9) 0%, rgba(3, 253, 2, 0.8) 100%);
    border: none;
    box-shadow: 0 6px 20px rgba(0, 150, 5, 0.3);
    transition: all 0.3s ease;
    letter-spacing: 0.5px;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0, 150, 5, 0.4);
    }

    &:active {
      transform: translateY(-1px);
    }

    &:disabled {
      background: linear-gradient(135deg, #dee2e6 0%, #c6c6c6 100%);
      box-shadow: none;
      transform: none;
    }
  }
}

.social-login {
  padding: 25px;
  background: linear-gradient(135deg, #ffffff 0%, #fafffe 100%);
  border-top: 1px solid rgba(0, 150, 5, 0.1);

  .divider {
    text-align: center;
    margin-bottom: 25px;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(0, 150, 5, 0.2), transparent);
    }

    span {
      background: linear-gradient(135deg, #ffffff 0%, #fafffe 100%);
      padding: 0 20px;
      color: rgba(0, 150, 5, 0.6);
      font-size: 14px;
      position: relative;
      z-index: 1;
      font-weight: 500;
    }
  }

  .social-buttons {
    display: flex;
    justify-content: center;
    gap: 40px;

    .social-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 20px 15px;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 90px;
      background: linear-gradient(135deg, #f8fffe 0%, #f0fff0 100%);
      border: 1px solid rgba(0, 150, 5, 0.1);

      &:hover {
        background: linear-gradient(135deg, #f0fff0 0%, #e8ffe8 100%);
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(0, 150, 5, 0.15);
      }

      span {
        font-size: 13px;
        color: rgba(0, 150, 5, 0.7);
        font-weight: 500;
      }
    }
  }
}

// 弹窗样式
.forgot-password-dialog,
.terms-dialog {
  padding: 25px;
  max-width: 420px;
  background: linear-gradient(135deg, #ffffff 0%, #fafffe 100%);
  border-radius: 20px;

  h3 {
    margin: 0 0 25px 0;
    text-align: center;
    color: rgba(0, 150, 5, 0.8);
    font-weight: 700;
    font-size: 20px;
  }

  :deep(.van-field) {
    border-radius: 12px;
    background: linear-gradient(135deg, #f8fffe 0%, #f0fff0 100%);
    border: 2px solid rgba(0, 150, 5, 0.1);

    &:focus-within {
      border-color: rgba(0, 150, 5, 0.4);
      box-shadow: 0 0 0 3px rgba(0, 150, 5, 0.1);
    }
  }

  .dialog-buttons {
    display: flex;
    gap: 12px;
    margin-top: 25px;

    .van-button {
      flex: 1;
      height: 45px;
      border-radius: 12px;
      font-weight: 600;

      &[type="primary"] {
        background: linear-gradient(135deg, rgba(0, 150, 5, 0.9) 0%, rgba(3, 253, 2, 0.8) 100%);
        border: none;
      }
    }
  }
}

.terms-dialog {
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .terms-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    padding-bottom: 20px;
    border-bottom: 2px solid rgba(0, 150, 5, 0.1);

    .van-icon {
      cursor: pointer;
      padding: 8px;
      color: rgba(0, 150, 5, 0.6);
      border-radius: 50%;
      transition: all 0.3s ease;

      &:hover {
        color: rgba(0, 150, 5, 0.8);
        background: rgba(0, 150, 5, 0.1);
      }
    }
  }

  .terms-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 15px;

    h4 {
      color: rgba(0, 150, 5, 0.8);
      margin: 25px 0 12px 0;
      font-size: 17px;
      font-weight: 600;

      &:first-child {
        margin-top: 0;
      }
    }

    p {
      color: #555;
      line-height: 1.7;
      margin: 0 0 18px 0;
      font-size: 14px;
    }
  }

  .terms-footer {
    padding-top: 20px;
    border-top: 2px solid rgba(0, 150, 5, 0.1);
    text-align: center;

    .van-button {
      background: linear-gradient(135deg, rgba(0, 150, 5, 0.9) 0%, rgba(3, 253, 2, 0.8) 100%);
      border: none;
      height: 45px;
      border-radius: 12px;
      font-weight: 600;
    }
  }
}

// 响应式设计
@media (max-width: 480px) {
  .auth-container {
    padding: 25px 18px 18px;
  }

  .logo-section {
    margin-bottom: 35px;
    padding: 15px;

    .logo-icon {
      width: 100px;
      height: 100px;

      .logo-image {
        width: 60px;
        height: 60px;
      }
    }

    .app-title {
      font-size: 26px;
    }

    .app-subtitle {
      font-size: 15px;
    }
  }

  .form-container {
    padding: 25px 18px;
  }

  .social-login {
    padding: 20px 18px;

    .social-buttons {
      gap: 25px;

      .social-btn {
        min-width: 75px;
        padding: 15px 10px;
      }
    }
  }
}

@media (max-width: 375px) {
  .logo-section {
    .logo-icon {
      width: 90px;
      height: 90px;

      .logo-image {
        width: 50px;
        height: 50px;
      }
    }

    .app-title {
      font-size: 24px;
    }
  }

  .form-container {
    padding: 20px 15px;

    .submit-btn {
      height: 50px;
      font-size: 16px;
    }
  }
}
</style>