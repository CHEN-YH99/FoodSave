<template>
  <div class="computed-page">
    <!-- 导航栏 -->
    <van-nav-bar title="食材统计" fixed placeholder />

    <div class="stats-container">
      <!-- 时间筛选器 -->
      <div class="time-selector">
        <van-dropdown-menu>
          <van-dropdown-item v-model="selectedPeriod" :options="periodOptions" />
        </van-dropdown-menu>
      </div>

      <!-- 浪费指数卡片 -->
      <div class="waste-card">
        <div class="card-header">
          <van-icon name="warning" />
          <span title="浪费指数指过期食品未取出的总数">浪费指数卡片</span>
        </div>
        <div class="waste-content">
          <div class="waste-amount">{{ selectedPeriod }}浪费 {{ wasteData.amount }}kg</div>
          <div class="waste-trend" :class="wasteData.trend > 0 ? 'increase' : 'decrease'">
            <van-icon :name="wasteData.trend > 0 ? 'arrow-up' : 'arrow-down'" />
            {{ Math.abs(wasteData.trend) }}%
          </div>
        </div>
      </div>

      <!-- 环形图：食品分类占比 -->
      <div class="chart-card">
        <div class="card-header">
          <van-icon name="chart-trending-o" />
          <span>环形图：食品分类占比</span>
        </div>
        <div class="chart-container">
          <div v-if="echartsError" class="chart-error">
            <van-empty description="请先安装 ECharts">
              <template #description>
                <div class="error-text">
                  <p>运行命令: <code>npm install echarts</code></p>
                  <p>然后刷新页面</p>
                </div>
              </template>
            </van-empty>
          </div>
          <div v-else-if="store.loading || !echartsLoaded" class="chart-loading">
            <van-loading size="24px" vertical>{{ store.loading ? '加载数据中...' : '加载图表中...' }}</van-loading>
          </div>
          <div v-else-if="!categoryData.length" class="chart-empty">
            <van-empty description="暂无数据" />
          </div>
          <div v-else ref="pieChartRef" class="chart"></div>
        </div>
        <div v-if="categoryData.length" class="category-legend">
          <div v-for="item in categoryData" :key="item.name" class="legend-item">
            <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
            <span class="legend-text">{{ item.name }} {{ item.percentage }}%</span>
          </div>
        </div>
      </div>

      <!-- 柱状图：每周消费趋势 -->
      <div class="chart-card">
        <div class="card-header">
          <van-icon name="bar-chart-o" />
          <span>柱状图：每周消费趋势</span>
        </div>
        <div class="chart-subtitle">（显示4周柱状图）</div>
        <div class="chart-container">
          <div v-if="store.loading" class="chart-loading">
            <van-loading size="24px" vertical>加载中...</van-loading>
          </div>
          <div v-else-if="!weeklyData.length" class="chart-empty">
            <van-empty description="暂无数据" />
          </div>
          <div v-else ref="barChartRef" class="chart"></div>
        </div>
      </div>

      <!-- 营养分析卡片 -->
      <div class="nutrition-card">
        <div class="card-header">
          <van-icon name="medal" />
          <span>营养分析卡片</span>
        </div>
        <div class="nutrition-grid">
          <div v-for="item in nutritionData" :key="item.name" class="nutrition-item">
            <div class="nutrition-name">{{ item.name }}</div>
            <div class="nutrition-value">{{ item.value }}%</div>
            <van-progress :percentage="item.value" :color="item.color" :show-pivot="false" />
          </div>
        </div>
      </div>

      <!-- 生成月度报告按钮 -->
      <div class="report-section">
        <van-button type="primary" size="large" round block @click="generateReport" :loading="reportLoading">
          <van-icon name="description" />
          生成月度报告
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch, onUnmounted } from 'vue'
import { showToast, showDialog } from 'vant'
import { useComputedStore } from '../store/computed.js'

// 动态导入 ECharts
let echarts = null
const echartsLoaded = ref(false)
const echartsError = ref(false)

// 尝试加载 ECharts
const loadECharts = async () => {
  try {
    const echartsModule = await import('echarts')
    echarts = echartsModule.default || echartsModule
    echartsLoaded.value = true
  } catch (error) {
    echartsError.value = true
  }
}

// Store
const store = useComputedStore()

// 响应式数据
const selectedPeriod = ref('本月')
const reportLoading = ref(false)

// 图表引用
const pieChartRef = ref(null)
const barChartRef = ref(null)

// 时间选项
const periodOptions = [
  { text: '本月', value: '本月' },
  { text: '本周', value: '本周' },
  { text: '近3个月', value: '近3个月' },
  { text: '本年', value: '本年' }
]

// 浪费数据
const wasteData = computed(() => {
  const currentWaste = store.getWasteDataByPeriod(selectedPeriod.value)
  return {
    amount: currentWaste.amount.toFixed(1),
    trend: currentWaste.trend
  }
})

// 分类数据 - 使用真实数据
const categoryData = computed(() => {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
  return store.getCategoryStatsByPeriod(selectedPeriod.value).map((item, index) => ({
    name: item.name,
    percentage: item.percentage,
    color: colors[index % colors.length]
  }))
})

// 营养数据 - 使用计算的营养分析
const nutritionData = computed(() => store.getNutritionAnalysisByPeriod(selectedPeriod.value))

// 每周消费数据 - 使用真实趋势数据
const weeklyData = computed(() =>
  store.getWeeklyTrendByPeriod(selectedPeriod.value).map(item => ({
    week: item.week,
    consumption: item.weight
  }))
)

// 图表实例
let pieChart = null
let barChart = null

// 初始化饼图
const initPieChart = () => {
  if (!pieChartRef.value || !echarts) return

  try {
    pieChart = echarts.init(pieChartRef.value)
    updatePieChart()

    // 响应式调整
    window.addEventListener('resize', () => {
      pieChart?.resize()
    })
  } catch (error) {
    // 初始化饼图失败
  }
}

// 更新饼图数据
const updatePieChart = () => {
  if (!pieChart || !categoryData.value.length) return

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}% ({d}%)'
    },
    series: [
      {
        name: '食品分类',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        data: categoryData.value.map(item => ({
          value: item.percentage,
          name: item.name,
          itemStyle: {
            color: item.color
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: false
        },
        labelLine: {
          show: false
        }
      }
    ]
  }

  pieChart.setOption(option)
}

// 初始化柱状图
const initBarChart = () => {
  if (!barChartRef.value || !echarts) return

  try {
    barChart = echarts.init(barChartRef.value)
    updateBarChart()

    // 响应式调整
    window.addEventListener('resize', () => {
      barChart?.resize()
    })
  } catch (error) {
    // 初始化柱状图失败
  }
}

// 更新柱状图数据
const updateBarChart = () => {
  if (!barChart || !weeklyData.value.length) return

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}<br/>{a}: {c}kg'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: weeklyData.value.map(item => item.week),
        axisTick: {
          alignWithLabel: true
        },
        axisLabel: {
          color: '#666'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          color: '#666',
          formatter: '{value}kg'
        }
      }
    ],
    series: [
      {
        name: '添加量',
        type: 'bar',
        barWidth: '60%',
        data: weeklyData.value.map(item => ({
          value: item.consumption,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#4ecdc4' },
              { offset: 1, color: '#44a08d' }
            ])
          }
        }))
      }
    ]
  }

  barChart.setOption(option)
}

// 监听数据变化，更新图表
watch(categoryData, updatePieChart, { deep: true })
watch(weeklyData, updateBarChart, { deep: true })

// 监听时间筛选器变化，重新渲染图表
watch(selectedPeriod, () => {
  if (pieChart && categoryData.value.length) {
    updatePieChart()
  }
  if (barChart && weeklyData.value.length) {
    updateBarChart()
  }
})

// 生成报告
const generateReport = async () => {
  try {
    // 生成报告数据
    const reportData = store.generateMonthlyReport()

    // 显示报告预览
    const reportPreview = formatReportPreview(reportData)

    const result = await showDialog({
      title: '月度报告预览',
      message: reportPreview,
      messageAlign: 'left',
      confirmButtonText: '下载报告',
      cancelButtonText: '取消',
      showCancelButton: true,
      className: 'report-preview-dialog'
    })

    if (result === 'confirm') {
      reportLoading.value = true

      // 模拟生成过程
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 创建完整报告内容
      const reportContent = formatReportContent(reportData)

      // 下载报告
      downloadReport(reportContent, reportData.title)

      showToast({
        type: 'success',
        message: '月度报告下载成功！'
      })

      reportLoading.value = false
    }
  } catch (error) {
    showToast({
      type: 'fail',
      message: '报告生成失败，请重试'
    })
    reportLoading.value = false
  }
}

// 格式化报告预览内容（简化版）
const formatReportPreview = (data) => {
  return `📊 ${data.title}

🔢 数据概览：
• 总食材：${data.summary.totalItems} 项
• 浪费：${data.summary.totalWaste} 项 (${data.summary.wasteRate}%)
• 平均每周添加：${data.summary.avgWeeklyAdd} 项

📈 主要分类：${data.categoryAnalysis.topCategory} (${data.categoryAnalysis.topCategoryCount}项)

🗑️ 浪费趋势：${data.wasteAnalysis.trendDescription} ${Math.abs(data.wasteAnalysis.trend)}%

💡 主要建议：
${data.recommendations.slice(0, 2).map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

点击"下载报告"获取完整详细报告`
}

// 格式化报告内容
const formatReportContent = (data) => {
  return `
${data.title}
${'='.repeat(50)}

生成时间：${data.generateTime}

📊 数据概览
${'─'.repeat(30)}
• 总食材数量：${data.summary.totalItems} 项
• 浪费食材数量：${data.summary.totalWaste} 项
• 浪费率：${data.summary.wasteRate}%
• 平均每周添加：${data.summary.avgWeeklyAdd} 项

📈 分类分析
${'─'.repeat(30)}
• 最多分类：${data.categoryAnalysis.topCategory}（${data.categoryAnalysis.topCategoryCount} 项）
• 最少分类：${data.categoryAnalysis.leastCategory}（${data.categoryAnalysis.leastCategoryCount} 项）

详细分类统计：
${data.categoryAnalysis.categories.map(cat =>
    `  - ${cat.name}：${cat.count} 项 (${cat.percentage}%)`
  ).join('\n')}

🗑️ 浪费分析
${'─'.repeat(30)}
• 浪费数量：${data.wasteAnalysis.amount} 项
• 趋势：${data.wasteAnalysis.trendDescription} ${Math.abs(data.wasteAnalysis.trend)}%

📅 每周趋势
${'─'.repeat(30)}
${data.weeklyTrend.map(week =>
    `• ${week.week}：${week.weight} 项 (${week.count} 次添加)`
  ).join('\n')}

🥗 营养分析
${'─'.repeat(30)}
• 主要营养成分：${data.nutritionAnalysis.topNutrient} (${data.nutritionAnalysis.topNutrientValue}%)

营养成分详情：
${data.nutritionAnalysis.details.map(item =>
    `  - ${item.name}：${item.value}%`
  ).join('\n')}

💡 改进建议
${'─'.repeat(30)}
${data.recommendations.map((rec, index) =>
    `${index + 1}. ${rec}`
  ).join('\n')}

${'='.repeat(50)}
报告生成完成 - 食材管理系统
`
}

// 下载报告文件
const downloadReport = (content, filename) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// 组件挂载后初始化
onMounted(async () => {
  // 先加载 ECharts
  await loadECharts()

  // 获取数据
  await store.fetchFoodData()

  // 等待DOM更新后初始化图表
  await nextTick()

  if (echartsLoaded.value) {
    initPieChart()
    initBarChart()
  }
})

// 组件卸载时清理图表
onUnmounted(() => {
  pieChart?.dispose()
  barChart?.dispose()
  window.removeEventListener('resize', () => { })
})
</script>

<style scoped lang="scss">
.computed-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.stats-container {
  padding: 16px;
}

.time-selector {
  margin-bottom: 16px;

  :deep(.van-dropdown-menu) {
    box-shadow: none;
  }
}

.waste-card {
  background: linear-gradient(135deg, rgba(0, 150, 0, 0.2) 0%, #bff8ca 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  color: white;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 12px;
  }

  .waste-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .waste-amount {
      font-size: 18px;
      font-weight: 600;
    }

    .waste-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;

      &.increase {
        color: #ff6b6b;
      }

      &.decrease {
        color: #51cf66;
      }
    }
  }
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #323233;
    margin-bottom: 8px;
  }

  .chart-subtitle {
    font-size: 12px;
    color: #969799;
    margin-bottom: 16px;
  }

  .chart-container {
    .chart {
      width: 100%;
      height: 200px;
    }

    .chart-loading,
    .chart-empty {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .category-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 16px;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;

      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }

      .legend-text {
        font-size: 14px;
        color: #646566;
      }
    }
  }
}

.nutrition-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #323233;
    margin-bottom: 16px;
  }

  .nutrition-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    .nutrition-item {
      .nutrition-name {
        font-size: 14px;
        color: #646566;
        margin-bottom: 4px;
      }

      .nutrition-value {
        font-size: 18px;
        font-weight: 600;
        color: #323233;
        margin-bottom: 8px;
      }
    }
  }
}

.report-section {
  margin-top: 24px;

  :deep(.van-button) {
    height: 48px;
    font-size: 16px;

    .van-icon {
      margin-right: 8px;
    }
  }
}

// 报告预览对话框样式
:deep(.report-preview-dialog) {
  .van-dialog__message {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-line;
    max-height: 400px;
    overflow-y: auto;
    background-color: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
    margin: 16px 0;
  }

  .van-dialog__content {
    padding: 16px 24px;
  }
}

// 响应式设计
@media (max-width: 375px) {
  .stats-container {
    padding: 12px;
  }

  .nutrition-grid {
    grid-template-columns: 1fr;
  }

  :deep(.report-preview-dialog) {
    .van-dialog__message {
      font-size: 12px;
      max-height: 300px;
      padding: 12px;
    }
  }
}
</style>