<template>
  <div>
    <template v-if="!hasChildren(item)">
      <el-menu-item :index="item.path">
        <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
        <template #title>{{ item.title }}</template>
      </el-menu-item>
    </template>
    
    <el-sub-menu v-else :index="item.id">
      <template #title>
        <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
        <span>{{ item.title }}</span>
      </template>
      
      <sidebar-menu-item 
        v-for="child in item.children" 
        :key="child.id"
        :item="child"
      />
    </el-sub-menu>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '@/types/menu';

defineProps<{
  item: MenuItem;
}>();

// 判断是否有子菜单
const hasChildren = (item: MenuItem) => {
  return item.children && item.children.length > 0;
};
</script>