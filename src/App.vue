<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useIndexStore } from '@/store/index';
import { useAuthStore } from '@/store/auth';
import { aiApi } from '@/services/api'
import Head from './components/common/Head.vue'
import TabBar from './components/common/TabBar.vue'

const route = useRoute();
const store = useIndexStore();
const authStore = useAuthStore();

// 控制海报显示的状态
const showPoster = ref(true);

// 根据路由meta配置判断是否显示Header和TabBar
const shouldShowHeader = computed(() => {
  return !route.meta?.hideHeader;
});

const shouldShowTabBar = computed(() => {
  return !route.meta?.hideTabBar;
});

// 跳过海报的方法
const skipPoster = () => {
  showPoster.value = false;
};

// 组件挂载后设置一个定时器，5秒后自动跳过
onMounted(async () => {
  // 初始化认证状态
  if (authStore.token && !authStore.user) {
    try {
      await authStore.verifyToken();
    } catch (error) {
      console.log('Token验证失败，可能已过期');
    }
  }
  
  // 初始化已取出记录
  store.loadTakenOutFoods();
  
  // 设置定期清理过期记录（每小时清理一次）
  const cleanupInterval = setInterval(() => {
    store.cleanExpiredTakenOutFoods();
  }, 60 * 60 * 1000); // 1小时
  
  // 页面卸载时清理定时器
  window.addEventListener('beforeunload', () => {
    clearInterval(cleanupInterval);
  });
  
  setTimeout(() => {
    skipPoster();
  }, 5000);
});

// AI 悬浮聊天：可拖动的入口 + 弹窗消息流
const aiVisible = ref(false)
const aiDragging = ref(false)
const aiPos = ref({ x: window.innerWidth - 70, y: window.innerHeight - 140 })
const aiStart = ref({ x: 0, y: 0 })
const aiPointerId = ref(null)
const aiMessages = ref([
  { role: 'assistant', content: '你好，我是食材智能助手。请问有什么想了解的？' }
])
const aiInput = ref('')

const openAi = () => { aiVisible.value = true }
const closeAi = () => { aiVisible.value = false }

// 拖动逻辑：Pointer 事件，限定在视窗范围
const onAiPointerDown = (e) => {
  aiDragging.value = true
  aiPointerId.value = e.pointerId
  aiStart.value = { x: e.clientX - aiPos.value.x, y: e.clientY - aiPos.value.y }
  e.target.setPointerCapture?.(e.pointerId)
}
const onAiPointerMove = (e) => {
  if (!aiDragging.value) return
  let nx = e.clientX - aiStart.value.x
  let ny = e.clientY - aiStart.value.y
  const margin = 30
  const maxX = window.innerWidth - margin
  const maxY = window.innerHeight - margin
  if (nx < margin) nx = margin
  if (ny < margin) ny = margin
  if (nx > maxX) nx = maxX
  if (ny > maxY) ny = maxY
  aiPos.value = { x: nx, y: ny }
}
const onAiPointerUp = () => {
  aiDragging.value = false
  aiPointerId.value = null
}

const sending = ref(false)
// 构建最近会话：压缩为概览，参与后端上下文
const buildHistory = () => {
  const last = aiMessages.value.slice(-6)
  return last.map(m => {
    if (m.data && m.data.recipes) {
      const names = m.data.recipes.map(r => r.name).join('、')
      return { role: m.role, content: `菜谱：${names}` }
    }
    return { role: m.role, content: m.content || '' }
  })
}

// 发送问题：携带食材上下文与最近会话到后端
const sendAi = async () => {
  const text = aiInput.value.trim()
  if (!text || sending.value) return
  aiMessages.value.push({ role: 'user', content: text })
  aiInput.value = ''
  sending.value = true
  try {
    const store = useIndexStore()
    const contextFoods = store.foodData?.slice(0, 50) || []
    const res = await aiApi.chat({ question: text, context: { foods: contextFoods, history: buildHistory() } })
    const reply = res?.reply
    // 结构化 JSON：按卡片渲染
    if (reply && typeof reply === 'object' && Array.isArray(reply.recipes)) {
      aiMessages.value.push({ role: 'assistant', content: '', data: reply })
    } else if (typeof reply === 'string') {
      let parsed = null
      try { parsed = JSON.parse(reply) } catch {}
      if (parsed && Array.isArray(parsed.recipes)) {
        aiMessages.value.push({ role: 'assistant', content: '', data: parsed })
      } else {
        aiMessages.value.push({ role: 'assistant', content: reply })
      }
    } else {
      aiMessages.value.push({ role: 'assistant', content: '暂时无法回答，请稍后重试。' })
    }
  } catch (err) {
    aiMessages.value.push({ role: 'assistant', content: '服务繁忙或网络异常，请稍后再试。' })
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <!-- 海报 -->
  <div v-if="showPoster" class="poster-wrapper">
    <img src="./assets/images/GG.jpeg" alt="Poster" class="poster-img">
    <button @click="skipPoster" class="skip-btn">跳过</button>
  </div>

  <!-- 主内容 -->
  <div v-else class="main-content">
    <Head v-if="shouldShowHeader" />
    <div class="content-wrapper" :class="{ 'no-header': !shouldShowHeader, 'no-tabbar': !shouldShowTabBar }">
      <router-view />
    </div>
    <TabBar v-if="shouldShowTabBar" />
    <div class="ai-fab" :style="{ left: aiPos.x + 'px', top: aiPos.y + 'px' }" @click="openAi" @pointerdown="onAiPointerDown" @pointermove="onAiPointerMove" @pointerup="onAiPointerUp">
      <van-icon name="chat" color="#fff" size="20" />
    </div>
    <van-popup v-model:show="aiVisible" position="bottom" :style="{ height: '60%' }" round>
      <div class="ai-chat">
        <div class="ai-header">
          <div class="title">食材智能助手</div>
          <van-icon name="cross" @click="closeAi" />
        </div>
        <div class="ai-body">
          <div v-for="(m, idx) in aiMessages" :key="idx" :class="['msg', m.role]">
            <template v-if="m.data && m.data.recipes">
              <div class="structured">
                <div class="s-notes" v-if="m.data.notes">{{ m.data.notes }}</div>
                <div class="s-card" v-for="(r, i) in m.data.recipes" :key="i">
                  <div class="s-title">{{ r.name }}</div>
                  <div class="s-meta" v-if="r.timeMinutes">耗时约 {{ r.timeMinutes }} 分钟</div>
                  <div class="s-subtitle">所用食材</div>
                  <ul class="s-list">
                    <li v-for="(ing, j) in r.ingredients" :key="j">{{ ing.name }} · {{ ing.amount }}{{ ing.unit }}</li>
                  </ul>
                  <div class="s-subtitle">步骤</div>
                  <ol class="s-steps">
                    <li v-for="(st, k) in r.steps" :key="k">{{ st }}</li>
                  </ol>
                  <div class="s-tip" v-if="r.storageAdvice">{{ r.storageAdvice }}</div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="bubble">{{ m.content }}</div>
            </template>
          </div>
        </div>
        <div class="ai-input">
          <van-field v-model="aiInput" placeholder="输入问题，如：帮我用青椒做一道菜" />
          <van-button type="primary" :loading="sending" @click="sendAi">发送</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped lang="scss">
.poster-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;

  .poster-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .skip-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    padding: 8px 16px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    border-radius: 16px;
    cursor: pointer;
  }
}

.main-content {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  .content-wrapper {
    flex: 1;
    padding-top: 70px; // 为固定头部留出空间
    padding-bottom: 60px; // 为底部TabBar留出空间
    overflow-y: auto;

    // 当没有头部时，移除顶部padding
    &.no-header {
      padding-top: 0;
    }

    // 当没有TabBar时，移除底部padding
    &.no-tabbar {
      padding-bottom: 0;
    }
  }
}

.ai-fab {
  position: fixed;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1989fa 0%, #2f54eb 100%);
  box-shadow: 0 6px 20px rgba(24, 137, 250, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: pointer;
  user-select: none;
}

.ai-chat {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.ai-header .title { font-weight: 600; }
.ai-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  background: #fafafa;
}
.msg { display: flex; margin: 8px 0; }
.msg.user { justify-content: flex-end; }
.msg.assistant { justify-content: flex-start; }
.bubble {
  max-width: 78%;
  padding: 10px 12px;
  border-radius: 12px;
  line-height: 1.5;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
}
.msg.user .bubble { background: #e6f7ff; color: #1d39c4; }
.msg.assistant .bubble { background: #fff; color: #333; }
.structured { max-width: 92%; background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); padding: 12px; }
.s-notes { font-size: 13px; color: #666; margin-bottom: 8px; }
.s-card { border: 1px solid #f0f0f0; border-radius: 10px; padding: 10px; margin: 10px 0; background: #fcfcfc; }
.s-title { font-weight: 600; font-size: 15px; }
.s-meta { font-size: 12px; color: #999; margin: 4px 0 8px; }
.s-subtitle { font-weight: 600; margin-top: 6px; }
.s-list { margin: 6px 0 8px 16px; }
.s-steps { margin: 6px 0 8px 16px; }
.s-tip { background: #fffbe6; border: 1px solid #ffe58f; border-radius: 6px; padding: 8px; font-size: 12px; color: #7c5c00; }
.ai-input {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
