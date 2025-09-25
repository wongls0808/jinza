<template>
  <el-aside :width="sidebarWidth" class="app-sidebar">
    <div class="logo-container">
      <span class="logo-text" v-if="!sidebarCollapsed">Jinza系统</span>
      <span class="logo-mini-text" v-else>J</span>
    </div>
    
    <el-scrollbar>
      <el-menu
        :default-active="activeMenu"
        :collapse="sidebarCollapsed"
        :collapse-transition="false"
        :unique-opened="true"
        class="sidebar-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <sidebar-menu-item v-for="menu in menuItems" :key="menu.id" :item="menu" />
      </el-menu>
    </el-scrollbar>
  </el-aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../../stores/app';
import { useMenuStore } from '../../stores/menu';
import SidebarMenuItem from './SidebarMenuItem.vue';

const route = useRoute();
const appStore = useAppStore();
const menuStore = useMenuStore();

const sidebarCollapsed = computed(() => appStore.sidebarCollapsed);
const menuItems = computed(() => menuStore.getMenuItems);

const sidebarWidth = computed(() => {
  return sidebarCollapsed.value ? '64px' : '220px';
});

const activeMenu = computed(() => {
  // 获取当前活动的菜单项
  const { meta, path } = route;
  // 如果当前路由设置了activeMenu，则优先使用
  return meta.activeMenu ? meta.activeMenu : path;
});
</script>

<style scoped>
.app-sidebar {
  height: 100%;
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.logo-container {
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #2b3649;
  overflow: hidden;
}

.logo-text {
  color: #ffffff;
  font-size: 18px;
  font-weight: bold;
}

.logo-mini-text {
  color: #ffffff;
  font-size: 22px;
  font-weight: bold;
}

.sidebar-menu {
  border-right: none;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 220px;
}
</style>