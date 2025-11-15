import express from 'express'
import Food from '../models/Food.js'
import { chatWithDeepSeek } from '../services/aiClient.js'

const router = express.Router()

// 基于当前应用数据的智能问答：
// 1) 构建高相关食材上下文（包含剩余天数、同义词匹配）
// 2) 调用 DeepSeek（严格 JSON 输出），失败则结构化兜底
router.post('/chat', async (req, res) => {
  try {
    const { question, context } = req.body || {}
    // 前端可传入部分食材上下文；缺省时从数据库取样 50 条
    let foods = Array.isArray(context?.foods) ? context.foods : null
    if (!foods) {
      foods = await Food.find().limit(50).lean()
    }

    const keyword = (question || '').trim()
    const normalized = (s) => String(s || '').toLowerCase()

    // 计算剩余天数：用于“即将过期优先”排序
    const parseDaysLeft = (expireDate) => {
      try {
        const d = new Date(expireDate)
        if (isNaN(d.getTime())) return 0
        const ms = d.getTime() - Date.now()
        return Math.floor(ms / (1000 * 60 * 60 * 24))
      } catch { return 0 }
    }

    // 丰富上下文：规范字段并补充 daysLeft
    const enriched = foods.map(f => ({
      name: f.name,
      category: f.category,
      storageLocation: f.storageLocation,
      expireDate: f.expireDate,
      daysLeft: typeof f.expiryDays === 'number' ? f.expiryDays : parseDaysLeft(f.expireDate)
    }))

    const pick = (arr, n) => arr.slice(0, n)
    const soon = enriched
      .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))

    // 常见同义词：提升关键词命中率（可扩展为语义向量）
    const synonyms = [
      ['青椒','辣椒'],
      ['番茄','西红柿'],
      ['土豆','马铃薯'],
      ['葱','青葱'],
      ['蒜','大蒜']
    ]
    const terms = []
    if (keyword) {
      terms.push(keyword)
      synonyms.forEach(([a,b]) => {
        if (keyword.includes(a)) terms.push(b)
        if (keyword.includes(b)) terms.push(a)
      })
    }
    let focus = soon
    if (terms.length) {
      focus = soon.filter(f => terms.some(t => normalized(f.name).includes(normalized(t)) || normalized(f.category).includes(normalized(t))))
      if (focus.length === 0) focus = soon
    }

    const top = pick(focus, 10)
    const categories = [...new Set(top.map(t => t.category))]
    const lines = top.map(t => `• ${t.name}（${t.category}，${t.storageLocation}，${t.daysLeft <= 0 ? '已过期' : `${t.daysLeft}天后过期`}）`)

    // 摘要：提供给模型的上下文总览
    const summary = [
      `当前食材总数：${enriched.length}`,
      `即将过期优先项（Top${top.length}）：`,
      ...lines
    ].join('\n')

    const recipes = []
    if (top.length >= 2) {
      recipes.push(`清炒${top[0].name}配${top[1].name}`)
    }
    if (categories.includes('蔬菜类') || categories.includes('果蔬类')) {
      recipes.push('蔬菜拼盘：少油快炒，保留口感')
    }
    if (categories.includes('肉类')) {
      recipes.push('肉菜搭配：荤素结合更均衡')
    }
    if (recipes.length === 0) {
      recipes.push('简单家常菜：根据现有食材搭配快手菜')
    }

    // 调用 DeepSeek：携带问题、摘要、上下文食材与最近会话
    const llm = await chatWithDeepSeek({ question, foods: enriched, summary, history: Array.isArray(context?.history) ? context.history : [] })
    if (llm) {
      if (typeof llm === 'string') {
        try {
          const parsed = JSON.parse(llm)
          return res.json({ success: true, reply: parsed })
        } catch {
          return res.json({ success: true, reply: llm })
        }
      }
      return res.json({ success: true, reply: llm })
    }

    // 结构化兜底：保证前端一定接收到规范 JSON
    const fallbackJson = {
      recipes: top.slice(0, 3).map(t => ({
        name: `家常${t.name}`,
        ingredients: [
          { name: t.name, amount: 1, unit: '份' }
        ],
        steps: [
          `准备食材：${t.name}`,
          '热锅少油，快速翻炒至熟',
          '加盐调味，出锅'
        ],
        timeMinutes: 15,
        storageAdvice: '现做现吃，剩菜冷藏不超过24小时'
      })),
      usedFoods: top.map(t => t.name),
      notes: '为保证新鲜度，优先处理即将过期的食材。'
    }

    res.json({ success: true, reply: fallbackJson })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router