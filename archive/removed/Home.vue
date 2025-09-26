<template>
  <div class="dashboard-home">
    <el-row :gutter="20" class="welcome-section">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="welcome-header">
              <h2>{{ greeting }}，{{ userInfo.nickname || '管理员' }}</h2>
              <div class="date-time">
                <div>{{ currentDate }}</div>
                <div>{{ currentTime }}</div>
              </div>
            </div>
          </template>
          <div class="welcome-content">
            <div class="welcome-stats">
              <el-row :gutter="20">
                <el-col :span="6" v-for="(stat, index) in quickStats" :key="index">
                  <div class="stat-card" :class="`stat-card-${index+1}`">
                    <div class="stat-icon">
                      <el-icon :size="32"><component :is="stat.icon" /></el-icon>
                    </div>
                    <div class="stat-content">
                      <div class="stat-value">{{ stat.value }}</div>
                      <div class="stat-title">{{ stat.title }}</div>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="data-charts">
      <el-col :span="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <h3>业务数据趋势</h3>
              <el-radio-group v-model="chartPeriod" size="small">
                <el-radio-button label="day">日</el-radio-button>
                <el-radio-button label="week">周</el-radio-button>
                <el-radio-button label="month">月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container" ref="businessChart" id="businessChart"></div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <h3>项目完成度</h3>
            </div>
          </template>
          <div class="pie-chart-container" ref="projectChart" id="projectChart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="quick-actions">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>快捷操作</h3>
            </div>
          </template>
          <div class="quick-buttons">
            <el-button type="primary" v-for="(action, index) in quickActions" :key="index" @click="handleQuickAction(action)">
              <el-icon><component :is="action.icon" /></el-icon>
              {{ action.label }}
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="recent-section">
      <el-col :span="12">
        <el-card shadow="hover" class="recent-card">
          <template #header>
            <div class="card-header">
              <h3>待办任务</h3>
              <el-button type="primary" size="small" @click="handleMoreTasks">查看更多</el-button>
            </div>
          </template>
          <el-table :data="recentTasks" style="width: 100%" size="small">
            <el-table-column prop="title" label="任务名称" width="180" />
            <el-table-column prop="priority" label="优先级">
              <template #default="scope">
                <el-tag :type="getPriorityType(scope.row.priority)">
                  {{ scope.row.priority }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deadline" label="截止日期" />
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card shadow="hover" class="recent-card">
          <template #header>
            <div class="card-header">
              <h3>系统公告</h3>
              <el-button type="primary" size="small" @click="handleMoreAnnouncements">查看更多</el-button>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in recentActivities"
              :key="index"
              :timestamp="activity.timestamp"
              :type="activity.type"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { 
  User, 
  Coin, 
  Briefcase, 
  Document, 
  RefreshRight, 
  Search, 
  Setting
} from '@element-plus/icons-vue';

const router = useRouter();
const userInfo = ref({
  nickname: '管理员',
  lastLoginTime: new Date().toLocaleString()
});

// 时间相关
const currentDate = ref(new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long'
}));
const currentTime = ref(new Date().toLocaleTimeString('zh-CN'));
const timeInterval = ref<number | null>(null);

// 获取问候语
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

// 快捷统计数据
const quickStats = ref([
  { title: '员工总数', value: '128', icon: 'User' },
  { title: '本月营收', value: '¥89,532', icon: 'Coin' },
  { title: '进行中项目', value: '12', icon: 'Briefcase' },
  { title: '未处理工单', value: '5', icon: 'Document' }
]);

// 图表周期
const chartPeriod = ref('week');

// 快捷操作
const quickActions = ref([
  { label: '刷新页面', icon: 'RefreshRight', action: 'refresh' },
  { label: '查看信息', icon: 'Search', action: 'viewInfo' },
  { label: '主题切换', icon: 'Setting', action: 'toggleTheme' }
]);

// 近期任务
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
let projectChartInstance: echarts.ECharts | null = null;

// 处理优先级标签颜色
const getPriorityType = (priority: string) => {
  switch(priority) {
    case '高': return 'danger';
    case '中': return 'warning';
    case '低': return 'info';
    default: return '';
  }
};

// 处理快捷操作
const handleQuickAction = (action: any) => {
  switch(action.action) {
    case 'refresh':
      window.location.reload();
      break;
    case 'viewInfo':
      ElMessage.info('这是一个简化后的系统，只保留了首页');
      break;
    case 'toggleTheme':
      ElMessage.success('主题切换功能即将上线');
      break;
  }
};

// 查看更多任务
const handleMoreTasks = () => {
  ElMessage.info('任务管理功能已被简化');
};

// 查看更多公告
const handleMoreAnnouncements = () => {
  ElMessage.info('公告管理功能已被简化');
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
          width: 3
        }
      },
      {
        name: '订单量',
        type: 'line',
        data: [220, 182, 191, 234, 290, 330, 310],
        smooth: true,
        lineStyle: {
          width: 3
        }
      },
      {
        name: '新客户',
        type: 'line',
        data: [35, 28, 32, 45, 51, 62, 48],
        smooth: true,
        lineStyle: {
          width: 3
        }
      }
    ]
  };
  
  businessChartInstance.setOption(option);
};

// 初始化项目完成度图表
const initProjectChart = () => {
  const chartElement = document.getElementById('projectChart');
  if (!chartElement) return;
  
  projectChartInstance = echarts.init(chartElement);
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '项目状态',
        type: 'pie',
        radius: '70%',
        data: [
          { value: 12, name: '进行中' },
          { value: 8, name: '已完成' },
          { value: 3, name: '延期' },
          { value: 5, name: '计划中' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
  
  projectChartInstance.setOption(option);
};

onMounted(() => {
  // 更新时间
  timeInterval.value = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString('zh-CN');
  }, 1000);
  
  // 获取用户信息
  // fetchUserInfo();
  
  // 初始化图表
  setTimeout(() => {
    initBusinessChart();
    initProjectChart();
  }, 100);
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (timeInterval.value) {
    clearInterval(timeInterval.value);
  }
  
  if (businessChartInstance) {
    businessChartInstance.dispose();
  }
  
  if (projectChartInstance) {
    projectChartInstance.dispose();
  }
  
  window.removeEventListener('resize', handleResize);
});

// 处理窗口大小变化
const handleResize = () => {
  if (businessChartInstance) {
    businessChartInstance.resize();
  }
  if (projectChartInstance) {
    projectChartInstance.resize();
  }
};

// 获取用户信息
// const fetchUserInfo = async () => {
//   try {
//     const response = await get('/api/user/info');
//     userInfo.value = response.data;
//   } catch (error) {
//     console.error('获取用户信息失败', error);
//   }
// };
</script>

<style scoped>
.dashboard-home {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 60px);
}

.welcome-section, .data-charts, .quick-actions, .recent-section {
  margin-bottom: 20px;
}

.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date-time {
  text-align: right;
  font-size: 14px;
  color: #606266;
}

.welcome-stats {
  margin-top: 10px;
}

.stat-card {
  display: flex;
  padding: 15px;
  border-radius: 8px;
  color: white;
  height: 80px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-card-1 {
  background: linear-gradient(to right, #1890ff, #36cbcb);
}

.stat-card-2 {
  background: linear-gradient(to right, #ff9800, #ffc107);
}

.stat-card-3 {
  background: linear-gradient(to right, #67c23a, #8bc34a);
}

.stat-card-4 {
  background: linear-gradient(to right, #f56c6c, #e91e63);
}

.stat-icon {
  margin-right: 15px;
  display: flex;
  align-items: center;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-title {
  font-size: 14px;
  opacity: 0.8;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
}

.chart-card {
  height: 350px;
}

.chart-container, .pie-chart-container {
  width: 100%;
  height: 280px;
}

.quick-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.recent-card {
  height: 350px;
}

/* 适配移动设备 */
@media (max-width: 768px) {
  .el-col {
    width: 100% !important;
    margin-bottom: 15px;
  }
}
</style>