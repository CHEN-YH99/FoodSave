/**
 * 密码强度检测工具
 */

/**
 * 检测密码强度
 * @param {string} password - 密码
 * @returns {object} 包含强度等级和详细信息的对象
 */
export function checkPasswordStrength(password) {
  if (!password) {
    return {
      level: 0,
      text: '请输入密码',
      color: '#ddd',
      score: 0
    }
  }

  let score = 0
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }

  // 长度检查
  if (password.length >= 6) score += 1
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1

  // 字符类型检查
  if (checks.lowercase) score += 1
  if (checks.uppercase) score += 1
  if (checks.number) score += 1
  if (checks.special) score += 1

  // 连续字符检查（减分）
  if (/(.)\1{2,}/.test(password)) score -= 1
  if (/123|234|345|456|567|678|789|890/.test(password)) score -= 1
  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/.test(password.toLowerCase())) score -= 1

  // 确保分数在合理范围内
  score = Math.max(0, Math.min(score, 7))

  let level, text, color
  if (score <= 2) {
    level = 1
    text = '弱'
    color = '#ff4757'
  } else if (score <= 4) {
    level = 2
    text = '中'
    color = '#ffa502'
  } else if (score <= 6) {
    level = 3
    text = '强'
    color = '#2ed573'
  } else {
    level = 4
    text = '很强'
    color = '#1e90ff'
  }

  return {
    level,
    text,
    color,
    score,
    checks,
    suggestions: getPasswordSuggestions(checks, password.length)
  }
}

/**
 * 获取密码改进建议
 * @param {object} checks - 检查结果
 * @param {number} length - 密码长度
 * @returns {array} 建议列表
 */
function getPasswordSuggestions(checks, length) {
  const suggestions = []

  if (length < 8) {
    suggestions.push('密码长度至少8位')
  }
  if (!checks.lowercase) {
    suggestions.push('包含小写字母')
  }
  if (!checks.uppercase) {
    suggestions.push('包含大写字母')
  }
  if (!checks.number) {
    suggestions.push('包含数字')
  }
  if (!checks.special) {
    suggestions.push('包含特殊字符')
  }

  return suggestions
}