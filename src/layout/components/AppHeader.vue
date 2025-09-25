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
import { ElMessageBox } from 'element-plus';

const router = useRouter();
const appStore = useAppStore();
const userStore = useUserStore();

const sidebarCollapsed = computed(() => appStore.sidebarCollapsed);
const username = computed(() => userStore.userInfo?.username || '未登录');
const userAvatar = computed(() => userStore.userInfo?.avatar || '');

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

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout();
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