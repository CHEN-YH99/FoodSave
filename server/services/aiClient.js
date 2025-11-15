import axios from 'axios'
/**
 * 调用 DeepSeek Chat 接口生成结构化菜谱回复（严格 JSON）
 * 仅基于当前应用食材上下文；支持会话历史与摘要增强相关性
 * 环境变量：DEEPSEEK_API_KEY、DEEPSEEK_MODEL、AI_TIMEOUT_MS
 */

export async function chatWithDeepSeek({ question, foods, summary, history }) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  if (!apiKey) return null

  const topFoods = (Array.isArray(foods) ? foods : []).slice(0, 10).map(f => ({
    name: f.name,
    category: f.category,
    storageLocation: f.storageLocation,
    expireDate: f.expireDate,
    expiryDays: f.expiryDays ?? f.daysLeft ?? 0
  }))

  const system = [
    '你是“鲜存”食材智能助手。',
    '严格按照以下 JSON 结构输出，且只返回 JSON：',
    '{"recipes":[{"name":"","ingredients":[{"name":"","amount":0,"unit":""}],"steps":[""],"timeMinutes":0,"storageAdvice":""}],"usedFoods":[""],"notes":""}',
    '要求：',
    '1) 严格基于提供的食材列表输出建议，优先使用即将过期的食材。',
    '2) 输出 2-3 道家常菜方案，每道包含【菜名】【所用食材（仅来自列表，可加少量常用调料）】【步骤】【耗时】【储存/剩菜建议】。',
    '3) 缺少关键食材时给出等价替代或删除方案，并在 notes 中说明影响。',
    '4) 所有字段均为中文，时间单位使用分钟。'
  ].join('\n')
  const userPayload = JSON.stringify({ question, summary, foods: topFoods })
  const historyMsgs = Array.isArray(history) ? history.slice(-6).map(m => ({ role: m.role, content: String(m.content || '')?.slice(0, 1000) })) : []

  const resp = await axios.post('https://api.deepseek.com/v1/chat/completions', {
    model,
    messages: [
      { role: 'system', content: system },
      ...historyMsgs,
      { role: 'user', content: userPayload }
    ],
    temperature: 0.1,
    top_p: 0.3
  }, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: Number(process.env.AI_TIMEOUT_MS) || 15000
  })

  const content = resp?.data?.choices?.[0]?.message?.content
  if (!content) return null
  try {
    const json = JSON.parse(content)
    return json
  } catch {
    return content
  }
}