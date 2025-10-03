<!-- 移动端底部导航栏组件 -->
<template>
  <div class="mobile-tabbar" v-if="isVisible">
    <div 
      v-for="(item, index) in navItems" 
      :key="index" 
      class="tabbar-item" 
      :class="{ active: activeMenu === item.route }"
      @click="navigate(item.route)"
    >
      <div class="tabbar-icon">
        <component :is="item.icon" v-if="typeof item.icon !== 'string'" />
        <i v-else :class="item.icon"></i>
      </div>
      <div class="tabbar-text">{{ item.label }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { 
  User, 
  Shop, 
  Shopping, 
  UserFilled, 
  More
} from '@element-plus/icons-vue';

// 属性定义
const props = defineProps({
  activeMenu: {
    type: String,
    default: 'customers'
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  userRole: {
    type: String,
    default: 'user'
  }
});

// 事件
const emit = defineEmits(['navigate']);

// 导航方法
const navigate = (route) => {
  emit('navigate', route);
};

// 计算是否显示底部导航栏（仅在移动设备上显示）
const isVisible = computed(() => props.isMobile);

// 导航项根据用户角色动态生成
const navItems = computed(() => {
  const items = [
    { 
      route: 'customers',
      label: '客户', 
      icon: User
    },
    { 
      route: 'suppliers', 
      label: '供应商', 
      icon: Shop
    },
    { 
      route: 'products',
      label: '商品',
      icon: Shopping
    },
    {
      route: 'salespeople',
      label: '业务员',
      icon: UserFilled
    },
    {
      route: 'more',
      label: '更多',
      icon: More
    }
  ];
  
  return items;
});
</script>

<style scoped>
.mobile-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #fff;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 99;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
  padding-bottom: env(safe-area-inset-bottom); /* 支持iPhone X及以上的底部安全区域 */
}

.tabbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  color: #909399;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.tabbar-item.active {
  color: var(--primary-color, #3a6df0);
}

.tabbar-item:active {
  transform: scale(0.9);
}

.tabbar-icon {
  font-size: 22px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 3px;
}

.tabbar-icon .el-icon {
  font-size: inherit;
}

.tabbar-text {
  font-size: 10px;
  margin-top: 1px;
  line-height: 1;
  font-weight: 500;
}
</style>