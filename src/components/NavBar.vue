<template>
  <header class="nav-header">
    <div class="logo">Jinza</div>
    <nav class="nav-bar">
      <el-menu :default-active="activePage" mode="horizontal" class="el-menu-horizontal">
        <el-menu-item index="users" @click="$emit('navigate', 'users')">用户管理</el-menu-item>
        <el-menu-item index="customers" @click="$emit('navigate', 'customers')">客户管理</el-menu-item>
        <el-menu-item index="banks" @click="$emit('navigate', 'banks')">银行列表</el-menu-item>
        <el-menu-item index="accounts" @click="$emit('navigate', 'accounts')">收款账户</el-menu-item>
        <el-menu-item index="settings" @click="$emit('navigate', 'settings')">系统设置</el-menu-item>
      </el-menu>
    </nav>
  </header>
</template>

<script setup>
import { defineProps } from 'vue'
const props = defineProps({
  activePage: { type: String, default: 'users' }
})
</script>

<style scoped>
.nav-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 64px;
  background: #fff;
  box-shadow: 0 2px 16px 0 rgba(79,140,255,0.08);
  padding: 0 32px;
  z-index: 20;
}
.logo {
  font-size: 2rem;
  font-weight: 800;
  color: #4f8cff;
  letter-spacing: 2px;
  margin-right: 32px;
  font-family: 'Montserrat', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.nav-bar {
  flex: 1;
  display: flex;
  align-items: center;
  height: 100%;
}
.el-menu-horizontal {
  border: none;
  background: transparent;
  font-size: 1.1rem;
  height: 64px;
  line-height: 64px;
}
</style>
