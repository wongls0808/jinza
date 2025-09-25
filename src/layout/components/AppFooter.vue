<template>
  <el-footer class="app-footer">
    <div class="footer-content">
      <span>© {{ currentYear }} Jinza管理系统 版权所有</span>
      <span>Powered by Vue3 + Element Plus</span>
    </div>
  </el-footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const currentYear = computed(() => new Date().getFullYear());
</script>

<style scoped>
.app-footer {
  background-color: #fff;
  color: #666;
  text-align: center;
  height: 50px;
  line-height: 50px;
  border-top: 1px solid #e6e6e6;
  font-size: 12px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
}
</style>