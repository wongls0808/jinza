<template>
  <div class="dashboard-container">
    <el-container>
      <el-aside width="220px" class="sidebar">
        <div class="logo-container">
          <h3>Jinza管理系统</h3>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          unique-opened
          router
        >
          <el-sub-menu index="1">
            <template #title>
              <el-icon><HomeFilled /></el-icon>
              <span>控制台</span>
            </template>
            <el-menu-item index="/dashboard">概览</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="2">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>内容管理</span>
            </template>
            <el-menu-item index="/dashboard/content">内容列表</el-menu-item>
            <el-menu-item index="/dashboard/categories">分类管理</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="3">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </template>
            <el-menu-item index="/dashboard/settings">基础设置</el-menu-item>
            <el-menu-item index="/dashboard/users">用户管理</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      
      <el-container>
        <el-header class="header">
          <div class="header-left">
            <el-icon class="collapse-btn" @click="toggleSidebar"><Fold /></el-icon>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item>控制台</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-dropdown trigger="click">
              <div class="user-info">
                <el-avatar :size="32" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
                <span class="username">Admin</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>个人中心</el-dropdown-item>
                  <el-dropdown-item>修改密码</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <el-main>
          <div class="dashboard-welcome">
            <h2>欢迎使用 Jinza管理系统</h2>
            <el-row :gutter="20" class="statistic-cards">
              <el-col :span="6">
                <el-card shadow="hover" class="statistic-card">
                  <div class="statistic-content">
                    <div class="statistic-icon visitors">
                      <el-icon><User /></el-icon>
                    </div>
                    <div class="statistic-info">
                      <div class="statistic-value">7,842</div>
                      <div class="statistic-title">访问量</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="statistic-card">
                  <div class="statistic-content">
                    <div class="statistic-icon orders">
                      <el-icon><ShoppingCart /></el-icon>
                    </div>
                    <div class="statistic-info">
                      <div class="statistic-value">1,257</div>
                      <div class="statistic-title">订单数</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="statistic-card">
                  <div class="statistic-content">
                    <div class="statistic-icon messages">
                      <el-icon><ChatLineRound /></el-icon>
                    </div>
                    <div class="statistic-info">
                      <div class="statistic-value">126</div>
                      <div class="statistic-title">未读消息</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="statistic-card">
                  <div class="statistic-content">
                    <div class="statistic-icon income">
                      <el-icon><Money /></el-icon>
                    </div>
                    <div class="statistic-info">
                      <div class="statistic-value">￥26,842</div>
                      <div class="statistic-title">总收入</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            
            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="16">
                <el-card shadow="hover" header="系统动态">
                  <el-table :data="dynamicTableData" style="width: 100%">
                    <el-table-column prop="time" label="时间" width="180" />
                    <el-table-column prop="user" label="操作人" width="120" />
                    <el-table-column prop="action" label="操作" />
                  </el-table>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover" header="快捷操作">
                  <div class="quick-actions">
                    <el-button type="primary">创建文章</el-button>
                    <el-button type="success">添加用户</el-button>
                    <el-button type="info">系统设置</el-button>
                    <el-button type="warning">查看报表</el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';

const router = useRouter();
const activeMenu = ref('/dashboard');
const isCollapse = ref(false);

const dynamicTableData = [
  {
    time: '2025-09-26 08:30:00',
    user: '管理员',
    action: '登录了系统'
  },
  {
    time: '2025-09-26 09:12:35',
    user: '管理员',
    action: '添加了新用户"张三"'
  },
  {
    time: '2025-09-26 10:05:18',
    user: '张三',
    action: '发布了新文章《如何高效使用管理系统》'
  },
  {
    time: '2025-09-26 11:45:22',
    user: '李四',
    action: '更新了系统设置'
  },
  {
    time: '2025-09-26 13:30:00',
    user: '王五',
    action: '删除了过期内容'
  }
];

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value;
};

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }).catch(() => {
    // 取消操作
  });
};

onMounted(() => {
  // 检查登录状态
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
  }
});
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
  background-color: #f5f7fa;
}

.sidebar {
  background-color: #304156;
  height: 100%;
  overflow-x: hidden;
  transition: width 0.3s;
}

.logo-container {
  height: 60px;
  line-height: 60px;
  text-align: center;
  background-color: #2b3649;
  color: #fff;
}

.header {
  background-color: #fff;
  color: #333;
  line-height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e6e6e6;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  font-size: 20px;
  margin-right: 20px;
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin-left: 8px;
  color: #333;
}

.statistic-cards {
  margin: 20px 0;
}

.statistic-card {
  border-radius: 4px;
}

.statistic-content {
  display: flex;
  align-items: center;
}

.statistic-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
}

.visitors {
  background-color: #409EFF;
  color: #fff;
}

.orders {
  background-color: #67C23A;
  color: #fff;
}

.messages {
  background-color: #E6A23C;
  color: #fff;
}

.income {
  background-color: #F56C6C;
  color: #fff;
}

.statistic-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.statistic-title {
  font-size: 14px;
  color: #999;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-actions .el-button {
  width: 100%;
}

.dashboard-welcome h2 {
  margin-bottom: 20px;
  color: #303133;
}
</style>