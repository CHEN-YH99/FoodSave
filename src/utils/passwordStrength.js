/**
 * 密码强度检测工具
 */

/**
 * 检测密码强度
 * @param {string} password - 密码
 * @returns {Object} 强度信息
 */
export function checkPasswordStrength(password) {
  if (!password) {
    return {
      level: 0,
      text: '请输入密码',
      color: '#c8c9cc',
      suggestions: []
    }
  }

  let score = 0
  const suggestions = []

  // 长度检查
  if (password.length >= 8) {
    score += 1
  } else {
    suggestions.push('密码长度至少8位')
  }

  // 包含小写字母
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    suggestions.push('包含小写字母')
  }

  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    suggestions.push('包含大写字母')
  }

  // 包含数字
  if (/\d/.test(password)) {
    score += 1
  } else {
    suggestions.push('包含数字')
  }

  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1
  } else {
    suggestions.push('包含特殊字符')
  }

  // 根据得分返回强度信息
  if (score <= 1) {
    return {
      level: 1,
      text: '弱',
      color: '#ee0a24',
      suggestions
    }
  } else if (score <= 2) {
    return {
      level: 2,
      text: '较弱',
      color: '#ff976a',
      suggestions
    }
  } else if (score <= 3) {
    return {
      level: 3,
      text: '中等',
      color: '#ffd21e',
      suggestions
    }
  } else if (score <= 4) {
    return {
      level: 4,
      text: '强',
      color: '#07c160',
      suggestions: []
    }
  } else {
    return {
      level: 5,
      text: '很强',
      color: '#07c160',
      suggestions: []
    }
  }
}