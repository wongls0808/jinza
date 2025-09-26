<template>
  <div class="modern-dashboard">
    <!-- 欢迎区域 -->
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

    <!-- 快捷统计区域 -->
    <div class="stats-section">
      <div class="stats-container">
        <div 
          v-for="(stat, index) in quickStats" 
          :key="index" 
          class="stat-card" 
          :style="{ '--stat-color': statColors[index % statColors.length] }"
        >
          <div class="stat-icon">
            <el-icon :size="28"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-title">{{ stat.title }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 卡片式菜单 -->
    <div class="menu-section">
      <h2 class="section-title">功能菜单</h2>
      <card-menu :menus="menuItems" />
    </div>

    <!-- 数据图表区域 -->
    <div class="charts-section">
      <div class="chart-wrapper">
        <div class="chart-header">
          <h2>业务数据趋势</h2>
          <el-radio-group v-model="chartPeriod" size="small">
            <el-radio-button label="day">日</el-radio-button>
            <el-radio-button label="week">周</el-radio-button>
            <el-radio-button label="month">月</el-radio-button>
          </el-radio-group>
        </div>
        <div class="chart-container" ref="businessChart" id="businessChart"></div>
      </div>
    </div>

    <!-- 信息卡片区域 -->
    <div class="info-section">
      <div class="info-column">
        <div class="info-card">
          <div class="info-header">
            <h3>待办任务</h3>
            <el-button type="primary" text>查看更多</el-button>
          </div>
          <el-table :data="recentTasks" style="width: 100%" size="large">
            <el-table-column prop="title" label="任务名称" />
            <el-table-column prop="priority" label="优先级" width="100">
              <template #default="scope">
                <el-tag :type="getPriorityType(scope.row.priority)" effect="light">
                  {{ scope.row.priority }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deadline" label="截止日期" width="120" />
          </el-table>
        </div>
      </div>

      <div class="info-column">
        <div class="info-card">
          <div class="info-header">
            <h3>系统公告</h3>
            <el-button type="primary" text>查看更多</el-button>
          </div>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in recentActivities"
              :key="index"
              :timestamp="activity.timestamp"
              :type="activity.type"
              :color="activity.type === 'warning' ? '#E6A23C' : ''"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </div>
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
import * as echarts from 'echarts';
import type { MenuItem } from '@/types/menu';

const router = useRouter();
const userStore = useUserStore();
const menuStore = useMenuStore();

// 用户信息
const username = computed(() => userStore.user?.nickname || userStore.user?.username || '用户');

// 菜单项
const menuItems = ref<MenuItem[]>([]);

// 加载菜单数据
const loadMenuItems = () => {
  // 获取系统菜单并转换为卡片格式
  const sysMenus = menuStore.filteredMenuItems;
  
  // 添加额外信息到菜单项，使其适应卡片式展示
  menuItems.value = sysMenus.map(menu => {
    // 为菜单项添加描述、badge等信息
    const result: MenuItem = { 
      ...menu,
      description: getMenuDescription(menu.id),
    };
    
    // 添加角标信息（示例）
    if (menu.id === 'system') {
      result.badge = 'NEW';
      result.badgeType = 'success';
    }
    
    return result;
  });
};

// 菜单描述 - 实际应用中这些描述可能来自配置或API
const getMenuDescription = (menuId: string): string => {
  const descriptions: Record<string, string> = {
    '1': '查看系统概览和重要指标',
    'system': '管理系统配置和用户权限',
    'system-user': '管理系统用户账号',
    'system-role': '管理用户角色和权限',
    'system-menu': '配置系统菜单结构',
    'system-tenant': '管理多账套信息'
  };
  
  return descriptions[menuId] || '';
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

// 统计卡片颜色
const statColors = [
  '#1890ff',
  '#f5a623',
  '#52c41a',
  '#f5222d',
  '#722ed1'
];

// 快捷统计数据
const quickStats = ref([
  { title: '员工总数', value: '128', icon: 'User' },
  { title: '本月营收', value: '¥89,532', icon: 'Coin' },
  { title: '进行中项目', value: '12', icon: 'Briefcase' },
  { title: '未处理工单', value: '5', icon: 'Document' }
]);

// 图表周期
const chartPeriod = ref('week');

// 待办任务
const recentTasks = ref([
  { title: '完成季度财务报表', priority: '高', deadline: '2025-09-30' },
  { title: '员工绩效评估', priority: '中', deadline: '2025-10-15' },
  { title: '产品开发会议', priority: '中', deadline: '2025-09-28' },
  { title: '更新公司手册', priority: '低', deadline: '2025-10-20' }
]);

// 系统活动
const recentActivities = ref([
  { content: '系统升级通知：将于本周六凌晨2点进行维护', timestamp: '2025-09-25 09:00', type: 'warning' },
  { content: '新员工培训将于下周一开始', timestamp: '2025-09-24 14:30', type: 'success' },
  { content: '请各部门提交10月工作计划', timestamp: '2025-09-23 11:15', type: 'info' }
]);

// 图表实例
let businessChartInstance: echarts.ECharts | null = null;

// 优先级标签类型
const getPriorityType = (priority: string) => {
  switch(priority) {
    case '高': return 'danger';
    case '中': return 'warning';
    case '低': return 'info';
    default: return '';
  }
};

// 初始化业务数据图表
const initBusinessChart = () => {
  const chartElement = document.getElementById('businessChart');
  if (!chartElement) return;
  
  businessChartInstance = echarts.init(chartElement);
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['营收', '订单量', '新客户']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '营收',
        type: 'line',
        data: [12000, 13200, 10100, 13400, 19000, 23000, 21000],
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#1890ff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
                offset: 0,
                color: 'rgba(24,144,255,0.2)'
            }, {
                offset: 1,
                color: 'rgba(24,144,255,0)'
            }]
          }
        }
      },
      {
        name: '订单量',
        type: 'line',
        data: [220, 182, 191, 234, 290, 330, 310],
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#52c41a'
        }
      },
      {
        name: '新客户',
        type: 'line',
        data: [35, 28, 32, 45, 51, 62, 48],
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#f5a623'
        }
      }
    ]
  };
  
  businessChartInstance.setOption(option);
};

// 处理窗口大小变化
const handleResize = () => {
  if (businessChartInstance) {
    businessChartInstance.resize();
  }
};

// 生命周期钩子
onMounted(() => {
  // 加载菜单
  loadMenuItems();
  
  // 更新时间
  timeInterval.value = window.setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString('zh-CN');
  }, 1000);
  
  // 初始化图表
  setTimeout(() => {
    initBusinessChart();
  }, 300);
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  // 清理定时器
  if (timeInterval.value) {
    window.clearInterval(timeInterval.value);
  }
  
  // 销毁图表实例
  if (businessChartInstance) {
    businessChartInstance.dispose();
  }
  
  // 移除事件监听
  window.removeEventListener('resize', handleResize);
});

// 监听周期变化，更新图表
watch(chartPeriod, () => {
  // 实际应用中可以在这里重新请求数据
  console.log('Chart period changed:', chartPeriod.value);
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