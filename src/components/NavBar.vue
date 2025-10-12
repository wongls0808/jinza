<template>
  <div class="nav-layout">
    <aside :class="['sidebar', { collapsed }]">
      <div class="sidebar-header">
        <div class="logo"><i class="el-icon-s-home"></i> Jinza</div>
        <el-button class="collapse-btn" @click="collapsed = !collapsed" circle size="small"><i :class="collapsed ? 'el-icon-s-unfold' : 'el-icon-s-fold'"></i></el-button>
      </div>
      <el-menu :default-active="activePage" class="menu-vertical" :collapse="collapsed" background-color="#fff" text-color="#4f8cff" active-text-color="#2b3a55" unique-opened>
        <el-menu-item index="dashboard" @click="$emit('navigate', 'dashboard')"><i class="el-icon-data-analysis"></i> 仪表盘</el-menu-item>
        <el-menu-item index="users" @click="$emit('navigate', 'users')"><i class="el-icon-user"></i> 用户管理</el-menu-item>
        <el-menu-item index="customers" @click="$emit('navigate', 'customers')"><i class="el-icon-s-custom"></i> 客户管理</el-menu-item>
        <el-menu-item index="banks" @click="$emit('navigate', 'banks')"><i class="el-icon-bank-card"></i> 银行列表</el-menu-item>
        <el-menu-item index="accounts" @click="$emit('navigate', 'accounts')"><i class="el-icon-wallet"></i> 收款账户</el-menu-item>
        <el-menu-item index="transactions" @click="$emit('navigate', 'transactions')"><i class="el-icon-document"></i> 交易管理</el-menu-item>
        <el-submenu index="more">
          <template #title><i class="el-icon-more"></i> 更多</template>
          <el-menu-item index="invoices" @click="$emit('navigate', 'invoices')">发票管理</el-menu-item>
          <el-menu-item index="products" @click="$emit('navigate', 'products')">产品模块</el-menu-item>
        </el-submenu>
        <el-menu-item index="settings" @click="$emit('navigate', 'settings')"><i class="el-icon-setting"></i> 系统设置</el-menu-item>
      </el-menu>
    </aside>
    <header class="topbar">
      <div class="welcome">欢迎回来，{{ username }}</div>
      <div class="topbar-spacer"></div>
      <el-button type="text" icon="el-icon-user-solid" class="user-btn">{{ username }}</el-button>
    </header>
  </div>
</template>

<script setup>
import { defineProps, ref } from 'vue'
const props = defineProps({
  activePage: { type: String, default: 'dashboard' },
  username: { type: String, default: '用户' }
})
const collapsed = ref(false)
</script>

<style scoped>
  .nav-layout {
    display: flex;
    width: 100vw;
    height: 64px;
    position: relative;
  }
  .sidebar {
    width: 220px;
    min-width: 64px;
    background: #fff;
    box-shadow: 2px 0 16px 0 rgba(79,140,255,0.08);
    transition: width 0.2s;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 30;
    display: flex;
    flex-direction: column;
  }
  .sidebar.collapsed {
    width: 64px;
  }
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 16px;
  }
  .logo {
    font-size: 1.6rem;
    font-weight: 800;
    color: #4f8cff;
    letter-spacing: 2px;
    font-family: 'Montserrat', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .collapse-btn {
    margin-left: 8px;
  }
  .menu-vertical {
    border: none;
    background: transparent;
    font-size: 1.1rem;
    flex: 1;
    margin-top: 8px;
  }
  .topbar {
    margin-left: 220px;
    height: 64px;
    background: #fff;
    box-shadow: 0 2px 16px 0 rgba(79,140,255,0.08);
    display: flex;
    align-items: center;
    padding: 0 32px;
    width: calc(100vw - 220px);
    position: fixed;
    left: 220px;
    top: 0;
    z-index: 20;
  }
  .sidebar.collapsed + .topbar {
    margin-left: 64px;
    width: calc(100vw - 64px);
    left: 64px;
  }
  .welcome {
    font-size: 1.1rem;
    color: #2b3a55;
    font-weight: 500;
  }
  .topbar-spacer {
    flex: 1;
  }
  .user-btn {
    font-weight: 700;
    color: #4f8cff !important;
    background: none;
    border: none;
    font-size: 1rem;
  }
  @media (max-width: 900px) {
    .sidebar {
      width: 64px !important;
      min-width: 64px !important;
    }
    .topbar {
      margin-left: 64px !important;
      width: calc(100vw - 64px) !important;
      left: 64px !important;
    }
  }
</style>
