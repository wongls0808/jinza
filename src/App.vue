<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore } from './stores/user';

const userStore = useUserStore();

onMounted(async () => {
  // 初始化时检查用户登录状态
  if (userStore.token) {
    try {
      await userStore.getUserInfoAction();
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  }
});
</script>

<template>
  <router-view />
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

#app {
  height: 100%;
}
</style>
