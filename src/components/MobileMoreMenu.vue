<!-- 移动端更多菜单组件 -->
<template>
  <div class="mobile-more-menu">
    <div class="page-header">
      <h2 class="more-title">更多功能</h2>
    </div>
    
    <div class="menu-grid">
      <div 
        v-for="(item, index) in menuItems" 
        :key="index" 
        class="menu-item"
        @click="navigate(item.route)"
        v-if="shouldShowItem(item)"
      >
        <div class="menu-icon">
          <el-icon><component :is="item.icon" /></el-icon>
        </div>
        <div class="menu-label">{{ item.label }}</div>
      </div>
    </div>
    
    <div class="logout-button" @click="logout">
      <div class="logout-icon">
        <el-icon><SwitchButton /></el-icon>
      </div>
      <div class="logout-text">退出登录</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { 
  Folder, 
  User, 
  UserFilled, 
  Setting, 
  SwitchButton 
} from '@element-plus/icons-vue';

const props = defineProps({
  userRole: {
    type: String,
    default: 'user'
  }
});

const emit = defineEmits(['navigate', 'logout']);

// 导航方法
const navigate = (route) => {
  emit('navigate', route);
};

// 登出方法
const logout = () => {
  emit('logout');
};

// 是否应该显示菜单项
const shouldShowItem = (item) => {
  if (item.adminOnly && props.userRole !== 'admin') {
    return false;
  }
  return true;
};

// 所有可用的菜单项
const menuItems = computed(() => [
  {
    route: 'accountSets',
    label: '账套管理',
    icon: Folder,
    adminOnly: false
  },
  {
    route: 'users',
    label: '用户管理',
    icon: User,
    adminOnly: true
  },
  {
    route: 'salespeople',
    label: '业务员',
    icon: UserFilled,
    adminOnly: false
  },
  {
    route: 'settings',
    label: '系统设置',
    icon: Setting,
    adminOnly: true
  }
]);
</script>

<style scoped>
.mobile-more-menu {
  padding: 15px;
  max-width: 100%;
}

.page-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.more-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 40px;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f5f7fa;
  border-radius: 12px;
  padding: 16px 10px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.menu-item:active {
  background-color: #e6f7ff;
  transform: scale(0.96);
}

.menu-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4b7bec 0%, #3867d6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  font-size: 24px;
}

.menu-label {
  font-size: 13px;
  color: #303133;
  text-align: center;
  font-weight: 500;
}

.logout-button {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px;
  background-color: #fff1f0;
  color: #f56c6c;
  border-radius: 12px;
  margin-top: 20px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.logout-button:active {
  transform: scale(0.98);
}

.logout-icon {
  font-size: 20px;
  margin-right: 10px;
  display: flex;
  align-items: center;
}

.logout-text {
  font-size: 15px;
  font-weight: 500;
}
</style>