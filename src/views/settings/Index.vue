<template>
  <div class="settings-page">
    <div class="settings-container">
        <aside class="settings-aside">
          <el-menu default-active="users" class="el-menu-vertical" router>
            <el-menu-item index="/settings/users" @click="go('/settings/users')">用户管理</el-menu-item>
            <el-menu-item index="/settings/tenants" @click="go('/settings/tenants')">账套配置</el-menu-item>
          </el-menu>
        </aside>

        <section class="settings-main">
          <router-view />
        </section>
      </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
const go = (path: string) => router.push(path);
</script>

<style scoped>
.settings-page { padding: 20px; }
.settings-container { display: flex; gap: 20px; }
.settings-aside { width: 220px; }
.settings-main { flex: 1; }
.settings-content { margin-top: 12px; }
</style>
