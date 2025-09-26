<template>
  <el-header class="app-header">
    <div class="header-left">
      <el-icon class="toggle-sidebar" @click="toggleSidebar"><Fold v-if="!sidebarCollapsed" /><Expand v-else /></el-icon>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>{{ currentRoute }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="header-right">
      <!-- 账套选择器 -->
      <div class="tenant-selector" v-if="tenants.length > 0">
        <el-dropdown trigger="click" @command="switchTenant">
          <div class="tenant-info">
            <el-tag type="success">{{ currentTenantName }}</el-tag>
            <el-icon><CaretBottom /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item 
                v-for="tenant in tenants" 
                :key="tenant.id" 
                :command="tenant.id"
                :class="{ 'active-tenant': tenant.id === currentTenant }"
              >
                {{ tenant.name }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      
      <el-tooltip content="全屏" placement="bottom">
        <el-icon class="header-icon" @click="toggleFullscreen"><FullScreen /></el-icon>
      </el-tooltip>
      
      <el-dropdown trigger="click">
        <div class="avatar-container">
          <el-avatar :size="32" :src="userAvatar" />
          <span class="username">{{ username }}</span>
          <el-icon><CaretBottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="goToProfile">
              <el-icon><User /></el-icon>个人中心
            </el-dropdown-item>
            <el-dropdown-item @click="goToSettings">
              <el-icon><Setting /></el-icon>系统设置
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import { ElMessageBox, ElMessage } from 'element-plus';
import type { Tenant } from '@/types/system';

const router = useRouter();
const appStore = useAppStore();
const userStore = useUserStore();

const sidebarCollapsed = computed(() => appStore.sidebarCollapsed);
const username = computed(() => userStore.user?.username || userStore.user?.nickname || '未登录');
const userAvatar = computed(() => userStore.user?.avatar || '');

// 租户相关
const tenants = computed(() => userStore.tenants || []);
const currentTenant = computed(() => userStore.user?.currentTenant || null);
const currentTenantName = computed(() => {
  const tenant = userStore.getCurrentTenant();
  return tenant?.name || '未选择账套';
});

const currentRoute = computed(() => {
  const route = router.currentRoute.value;
  return route.meta.title || route.name || '未知页面';
});

const toggleSidebar = () => {
  appStore.toggleSidebar();
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

const goToProfile = () => {
  ElMessageBox.alert('系统已简化，只保留首页', '提示');
};

const goToSettings = () => {
  ElMessageBox.alert('系统已简化，只保留首页', '提示');
};

// 切换租户
const switchTenant = async (tenantId: number) => {
  try {
    await userStore.switchTenantAction(tenantId);
    ElMessage.success('切换账套成功');
    // 可选：刷新页面或重新加载数据
    router.go(0); // 简单处理：刷新页面
  } catch (error: any) {
    ElMessage.error(error.message || '切换账套失败');
  }
};

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logoutAction();
    router.push('/login');
  }).catch(() => {
    // 取消操作
  });
};
</script>

<style scoped>
.app-header {
  height: 60px;
  background-color: #fff;
  color: #333;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
}

.toggle-sidebar {
  font-size: 20px;
  margin-right: 20px;
  cursor: pointer;
  color: #606266;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-icon {
  font-size: 20px;
  margin-right: 20px;
  cursor: pointer;
  color: #606266;
}

.tenant-selector {
  margin-right: 20px;
}

.tenant-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.tenant-info .el-icon {
  margin-left: 5px;
}

.active-tenant {
  color: #409EFF;
  font-weight: bold;
}

.avatar-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin: 0 10px;
  color: #606266;
}
</style>