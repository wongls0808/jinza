import { defineStore } from 'pinia';

interface AppState {
  sidebarCollapsed: boolean;
  darkMode: boolean;
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    sidebarCollapsed: false,
    darkMode: false
  }),
  
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
    
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      // 在实际应用中，这里可以添加切换暗黑模式的逻辑
      if (this.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }
});