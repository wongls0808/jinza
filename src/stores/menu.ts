import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { MenuItem } from '@/types/menu';

/**
 * Simplified menu store: each module is an independent navigation card.
 * Only keep 用户管理 and 账套配置.
 */
export const useMenuStore = defineStore('menu', () => {
  const menuItems = ref<MenuItem[]>([
    { id: 'settings-users', title: '用户管理', path: '/settings/users', icon: 'User' },
    { id: 'settings-tenants', title: '账套配置', path: '/settings/tenants', icon: 'Office' }
  ]);

  const filteredMenuItems = computed(() => menuItems.value);

  return { menuItems, filteredMenuItems };
});