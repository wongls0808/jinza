<template>
  <div class="dashboard-container">
    <div class="dashboard-welcome">
      <h1>企业管理系统</h1>
      <p>选择一个功能模块开始操作</p>
    </div>
    
    <div class="dashboard-grid">
      <!-- 所有用户可见的模块 -->
      <div 
        v-for="(module, index) in availableModules" 
        :key="index" 
        class="dashboard-card"
        @click="navigateTo(module.route)"
      >
        <div class="module-icon" :class="module.color">
          <el-icon><component :is="module.icon" /></el-icon>
        </div>
        <h3 class="module-title">{{ module.title }}</h3>
        <p class="module-description">{{ module.description }}</p>
      </div>
    </div>
    
    <!-- 系统状态卡片 -->
    <div class="system-stats" v-if="showStats">
      <h2 class="stats-title">系统概况</h2>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card>
            <template #header>
              <span>客户数量</span>
            </template>
            <div class="number">{{ stats.customers }}</div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card>
            <template #header>
              <span>项目数量</span>
            </template>
            <div class="number">{{ stats.projects }}</div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card>
            <template #header>
              <span>进行中项目</span>
            </template>
            <div class="number">{{ stats.activeProjects }}</div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card>
          <template #header>
            <span>用户数量</span>
          </template>
          <div class="number">{{ stats.users }}</div>
        </el-card>
      </el-col>
    </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  User, 
  Shop, 
  ShoppingBag, 
  UserFilled, 
  Document,
  Folder,
  Setting,
  HomeFilled
} from '@element-plus/icons-vue';

// Props定义
const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

// 事件定义
const emit = defineEmits(['navigate']);

// 是否显示统计卡片
const showStats = ref(true);

// 导航方法
const navigateTo = (route) => {
  emit('navigate', route);
};

const stats = ref({
  customers: 0,
  projects: 0,
  activeProjects: 0,
  users: 0
});

// 计算可用模块
const availableModules = computed(() => {
  // 基础模块，所有用户都可访问
  const modules = [
    {
      title: '客户管理',
      description: '查看和管理客户信息',
      icon: User,
      route: 'customers',
      color: 'blue'
    },
    {
      title: '供应商管理',
      description: '管理供应商和采购渠道',
      icon: Shop,
      route: 'suppliers',
      color: 'green'
    },
    {
      title: '商品库',
      description: '产品和库存管理',
      icon: ShoppingBag,
      route: 'products',
      color: 'orange'
    },
    {
      title: '业务员管理',
      description: '销售团队管理',
      icon: UserFilled,
      route: 'salespeople',
      color: 'purple'
    },
    {
      title: '账套管理',
      description: '财务账套管理',
      icon: Folder,
      route: 'accountSets',
      color: 'teal'
    }
  ];
  
  // 管理员专属模块
  if (props.user && props.user.role === 'admin') {
    modules.push({
      title: '用户管理',
      description: '系统用户权限管理',
      icon: Document,
      route: 'users',
      color: 'red'
    },
    {
      title: '系统设置',
      description: '配置系统参数',
      icon: Setting,
      route: 'settings',
      color: 'grey'
    });
  }
  
  return modules;
});

onMounted(async () => {
  // 模拟加载数据
  setTimeout(() => {
    stats.value = {
      customers: 15,
      projects: 8,
      activeProjects: 3,
      users: 6
    };
  }, 500);
});
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

.dashboard-welcome {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 20px 10px;
  max-width: 1600px;
  margin-left: auto;
  margin-right: auto;
}

.dashboard-welcome h1 {
  font-size: 28px;
  margin-bottom: 10px;
  color: var(--color-primary, #3a6df0);
}

.dashboard-welcome p {
  font-size: 16px;
  color: var(--color-text-secondary, #909399);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
  max-width: 1600px;
  margin-left: auto;
  margin-right: auto;
}

.dashboard-card {
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 24px;
  transition: all 0.3s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.dashboard-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

.dashboard-card:active {
  transform: translateY(0) scale(0.98);
}

.module-icon {
  height: 50px;
  width: 50px;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  margin-bottom: 16px;
  color: white;
}

.module-icon.blue { background: linear-gradient(135deg, #4b7bec 0%, #3867d6 100%); }
.module-icon.green { background: linear-gradient(135deg, #26de81 0%, #20bf6b 100%); }
.module-icon.orange { background: linear-gradient(135deg, #fa8231 0%, #fd9644 100%); }
.module-icon.purple { background: linear-gradient(135deg, #a55eea 0%, #8854d0 100%); }
.module-icon.red { background: linear-gradient(135deg, #eb3b5a 0%, #fc5c65 100%); }
.module-icon.teal { background: linear-gradient(135deg, #2bcbba 0%, #0fb9b1 100%); }
.module-icon.grey { background: linear-gradient(135deg, #778ca3 0%, #4b6584 100%); }

.module-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--color-text-primary, #303133);
}

.module-description {
  margin: 0;
  color: var(--color-text-secondary, #909399);
  font-size: 14px;
  line-height: 1.5;
}

.system-stats {
  margin-top: 20px;
  max-width: 1600px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 20px;
}

.stats-title {
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--color-text-primary, #303133);
}

.number {
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  color: var(--color-primary, #3a6df0);
}
</style>