<template>
  <div class="app-container">
    <el-container class="layout-container">
      <app-sidebar />
      
      <el-container direction="vertical">
        <app-header />
        
        <el-main>
          <router-view />
        </el-main>
        
        <app-footer />
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import AppHeader from './components/AppHeader.vue';
import AppSidebar from './components/AppSidebar.vue';
import AppFooter from './components/AppFooter.vue';
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.layout-container {
  height: 100%;
}

:deep(.el-main) {
  padding: 20px;
  background-color: #f5f7fa;
  overflow-y: auto;
}
</style>