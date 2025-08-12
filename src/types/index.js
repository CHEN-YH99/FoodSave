/**
 * 类型定义文件
 * 用于定义项目中使用的数据结构和类型
 */

/**
 * 食材数据结构
 * @typedef {Object} Food
 * @property {string} id - 食材ID
 * @property {string} _id - MongoDB ID
 * @property {string} name - 食材名称
 * @property {string} category - 食材分类
 * @property {string} expireDate - 过期日期
 * @property {string} storageLocation - 存储位置
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 * @property {Array<string>} synonyms - 同义词
 * @property {string} description - 描述
 * @property {Object} nutritionInfo - 营养信息
 * @property {string} image - 图片URL
 * @property {number} expiryDays - 距离过期天数
 */

/**
 * 菜谱数据结构
 * @typedef {Object} Recipe
 * @property {string} id - 菜谱ID
 * @property {string} name - 菜谱名称
 * @property {string} image - 菜谱图片
 * @property {Array<string>} ingredients - 所需食材
 * @property {string} cookingTime - 制作时间
 * @property {string} difficulty - 难度等级
 * @property {number} servings - 份量
 * @property {string} description - 描述
 * @property {Array<string>} steps - 制作步骤
 * @property {string} tips - 制作小贴士
 * @property {Object} nutrition - 营养信息
 */

/**
 * 食材分类数据结构
 * @typedef {Object} FoodCategory
 * @property {number} id - 分类ID
 * @property {string} name - 分类名称
 * @property {string} icon - 图标名称
 * @property {string} bgColor - 背景颜色
 * @property {string} iconColor - 图标颜色
 */

/**
 * API响应数据结构
 * @typedef {Object} ApiResponse
 * @property {boolean} success - 请求是否成功
 * @property {*} data - 响应数据
 * @property {string} message - 响应消息
 * @property {number} code - 状态码
 */

/**
 * 路由元信息
 * @typedef {Object} RouteMeta
 * @property {string} title - 页面标题
 * @property {boolean} hideHeader - 是否隐藏头部
 * @property {boolean} hideTabBar - 是否隐藏底部导航
 */

/**
 * 已取出食材记录
 * @typedef {Object} TakenOutFood
 * @property {string} id - 食材ID
 * @property {string} name - 食材名称
 * @property {string} category - 食材分类
 * @property {string} takenOutDate - 取出日期
 * @property {string} takenOutTime - 取出时间
 * @property {string} image - 图片URL
 */

export default {}