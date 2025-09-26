<template>
  <div class="card-menu-container">
    <transition-group 
      name="card-menu" 
      tag="div" 
      class="card-menu-grid"
      appear
    >
      <div 
        v-for="(menu, index) in menus" 
        :key="menu.id" 
        :data-index="index"
        class="menu-card" 
        :class="{ 'menu-card-active': currentPath === menu.path }"
        role="button"
        :tabindex="menu.path ? 0 : -1"
        :aria-label="`打开 ${menu.title}`"
        @click="navigateTo(menu)"
        @keydown.enter.prevent="navigateTo(menu)"
        @keydown.space.prevent="navigateTo(menu)"
      >
        <div class="menu-icon" :style="{ background: getMenuGradient(menu.id) }">
          <el-icon :size="24"><component :is="menu.icon || 'Menu'" /></el-icon>
        </div>
        <div class="menu-content">
          <h3 class="menu-title">{{ menu.title }}</h3>
          <p class="menu-description" v-if="menu.description">{{ menu.description }}</p>
        </div>
        <div class="menu-badge" v-if="menu.badge">
          <el-badge :value="menu.badge" :type="menu.badgeType || 'primary'" />
        </div>
        <div class="menu-hover-effect"></div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { MenuItem } from '@/types/menu';

const props = defineProps<{
  menus: MenuItem[];
}>();

const router = useRouter();
const route = useRoute();

const currentPath = computed(() => route.path);

// 预定义的渐变色组合
const gradientColors: string[] = [
  'linear-gradient(135deg, #1890ff 0%, #36cbcb 100%)',
  'linear-gradient(135deg, #ff9800 0%, #ffc107 100%)',
  'linear-gradient(135deg, #67c23a 0%, #8bc34a 100%)',
  'linear-gradient(135deg, #f56c6c 0%, #e91e63 100%)',
  'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)',
  'linear-gradient(135deg, #00bcd4 0%, #03a9f4 100%)',
  'linear-gradient(135deg, #795548 0%, #9e9e9e 100%)',
  'linear-gradient(135deg, #607d8b 0%, #455a64 100%)'
];

// 根据菜单ID获取渐变色
const getMenuGradient = (id: string): string => {
  const defaultGradient = 'linear-gradient(135deg, #1890ff 0%, #36cbcb 100%)';
  
  if (!id) return defaultGradient;
  
  // 提取ID中的数字
  const idNum = parseInt(id.replace(/\D/g, '')) || 0;
  const index = idNum % gradientColors.length;
  
  if (index >= 0 && index < gradientColors.length) {
    const gradient = gradientColors[index];
    return gradient ? gradient : defaultGradient;
  }
  
  return defaultGradient;
};

// 菜单导航
const navigateTo = (menu: MenuItem) => {
  if (!menu.path) return;
  
  if (menu.externalLink) {
    window.open(menu.path, '_blank');
  } else {
    router.push(menu.path);
  }
};
</script>

<style scoped>
.card-menu-container {
  width: 100%;
  padding: 10px;
}

.card-menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.menu-card {
  background-color: #fff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  overflow: hidden;
  min-height: 110px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.menu-card:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(24, 144, 255, 0.12);
  transform: translateY(-6px);
}

.menu-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 4px;
  background: var(--el-color-primary);
  transition: width 0.4s ease;
}

.menu-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
}

.menu-card:hover::before {
  width: 100%;
}

.menu-card-active {
  border-left: 4px solid var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.menu-hover-effect {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 70%);
  opacity: 0;
  transition: opacity 0.5s;
  pointer-events: none;
}

.menu-card:hover .menu-hover-effect {
  opacity: 1;
  height: 150%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.5;
  }
  50% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.5;
  }
}

.menu-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.menu-content {
  flex: 1;
}

.menu-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #333;
  letter-spacing: 0.3px;
}

.menu-description {
  margin: 8px 0 0;
  font-size: 13px;
  color: #888;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.menu-badge {
  position: absolute;
  top: 10px;
  right: 10px;
}

.card-menu-enter-active,
.card-menu-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card-menu-enter-from {
  opacity: 0;
  transform: translateY(40px);
}

.card-menu-leave-to {
  opacity: 0;
  transform: translateY(40px) scale(0.9);
}

.card-menu-move {
  transition: transform 0.5s ease;
}

@media (max-width: 992px) {
  .card-menu-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .card-menu-grid {
    grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
    gap: 16px;
  }
  
  .menu-card {
    padding: 20px;
  }
  
  .menu-icon {
    width: 46px;
    height: 46px;
  }
}
</style>