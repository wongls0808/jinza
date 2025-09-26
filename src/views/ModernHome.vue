<template>
  <div class="modern-dashboard">
    <div class="welcome-section">
      <div class="welcome-card">
        <div class="welcome-content">
          <div class="welcome-header">
            <h1>{{ greeting }}，{{ username }}</h1>
            <p class="welcome-subtitle">欢迎使用金蚱多账套管理系统</p>
          </div>
          <div class="date-info">
            <div class="date">{{ currentDate }}</div>
            <div class="time">{{ currentTime }}</div>
          </div>
        </div>
        <div class="welcome-bg"></div>
        </div>
      </div>
    </div>

  </template>

  <script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/stores/user';
  import { useMenuStore } from '@/stores/menu';
  import CardMenu from '@/components/CardMenu.vue';
  let echarts: typeof import('echarts') | null = null;
  import type { MenuItem } from '@/types/menu';

  const router = useRouter();
  const userStore = useUserStore();
  const menuStore = useMenuStore();

  // 用户名
  const username = computed(() => userStore.user?.nickname || userStore.user?.username || '用户');

  // 菜单项
  const menuItems = computed<MenuItem[]>(() => {
    const items = menuStore.filteredMenuItems || [];
    return items as MenuItem[];
  });

  // 菜单加载状态
  const isMenuLoading = ref(true);
  const fetchMenus = async () => {
    try {
      isMenuLoading.value = true;
      await menuStore.fetchMenuFromServer();
    } finally {
      isMenuLoading.value = false;
    }
  };

  // 时间相关
  const currentDate = ref(new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }));
  const currentTime = ref(new Date().toLocaleTimeString('zh-CN'));
  const timeInterval = ref<number | null>(null);

  // 问候语
  const greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 6) return '凌晨好';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 17) return '下午好';
    if (hour < 19) return '傍晚好';
    return '晚上好';
  });

  // 图表周期
  const chartPeriod = ref('week');

  // 图表实例
  let businessChartInstance: any = null;

  // 初始化业务数据图表（简化版）
  const initBusinessChart = async () => {
    const chartElement = document.getElementById('businessChart');
    if (!chartElement) return;
    if (!echarts) {
      echarts = await import('echarts');
    }
    businessChartInstance = (echarts as any).init(chartElement);
    businessChartInstance.setOption({
      xAxis: { type: 'category', data: ['周一','周二','周三','周四','周五','周六','周日'] },
      yAxis: { type: 'value' },
      series: [{ data: [12000,13200,10100,13400,19000,23000,21000], type: 'line', smooth: true }]
    });
  };

  const handleResize = () => {
    if (businessChartInstance) businessChartInstance.resize();
  };

  onMounted(() => {
    fetchMenus();
    timeInterval.value = window.setInterval(() => {
      currentTime.value = new Date().toLocaleTimeString('zh-CN');
    }, 1000);
    setTimeout(() => {
      initBusinessChart();
    }, 300);
    window.addEventListener('resize', handleResize);
  });

  onUnmounted(() => {
    if (timeInterval.value) window.clearInterval(timeInterval.value);
    if (businessChartInstance) businessChartInstance.dispose();
    window.removeEventListener('resize', handleResize);
  });

  watch(chartPeriod, () => {
    // placeholder for reloading chart data
  });
  </script>

<style scoped>
.modern-dashboard {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 60px);
}

/* 欢迎区域 */
.welcome-section {
  margin-bottom: 20px;
}

.welcome-card {
  position: relative;
  border-radius: 12px;
  padding: 30px;
  background-color: #fff;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.welcome-content {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.welcome-subtitle {
  margin: 10px 0 0;
  font-size: 16px;
  color: #666;
}

.date-info {
  text-align: right;
  color: #666;
}

.date {
  font-size: 16px;
  font-weight: 500;
}

.time {
  font-size: 24px;
  font-weight: 600;
  margin-top: 5px;
}

.welcome-bg {
  position: absolute;
  right: 0;
  top: 0;
  width: 300px;
  height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(24,144,255,0.1) 100%);
  z-index: 1;
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
}

/* 统计区域 */
.stats-section {
  margin-bottom: 30px;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  padding: 20px;
  border-radius: 12px;
  background-color: #fff;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-left: 4px solid var(--stat-color, #1890ff);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: rgba(var(--stat-color-rgb, 24, 144, 255), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  color: var(--stat-color, #1890ff);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

/* 菜单区域 */
.menu-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  position: relative;
  padding-left: 15px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background-color: var(--el-color-primary);
  border-radius: 2px;
}

/* 图表区域 */
.charts-section {
  margin-bottom: 30px;
}

.chart-wrapper {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h2 {
  font-size: 18px;
  margin: 0;
}

.chart-container {
  height: 350px;
}

/* 信息卡片区域 */
.info-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.info-column {
  display: flex;
  flex-direction: column;
}

.info-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  flex: 1;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.info-header h3 {
  font-size: 18px;
  margin: 0;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .info-section {
    grid-template-columns: 1fr;
  }
  
  .welcome-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .date-info {
    text-align: left;
    margin-top: 15px;
  }
}

@media (max-width: 768px) {
  .stats-container {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    margin-bottom: 15px;
  }
  
  .chart-wrapper,
  .info-card {
    margin-bottom: 15px;
  }
}

/* 每个统计卡片的CSS变量 */
.stats-container .stat-card:nth-child(1) {
  --stat-color: #1890ff;
  --stat-color-rgb: 24, 144, 255;
}

.stats-container .stat-card:nth-child(2) {
  --stat-color: #f5a623;
  --stat-color-rgb: 245, 166, 35;
}

.stats-container .stat-card:nth-child(3) {
  --stat-color: #52c41a;
  --stat-color-rgb: 82, 196, 26;
}

.stats-container .stat-card:nth-child(4) {
  --stat-color: #f5222d;
  --stat-color-rgb: 245, 34, 45;
}

/* 自定义el-table样式 */
:deep(.el-table) {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: #f7f9fc;
}

:deep(.el-table th) {
  background-color: #f7f9fc;
}

:deep(.el-table--border) {
  border: none;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background-color: #f0f7ff;
}
</style>