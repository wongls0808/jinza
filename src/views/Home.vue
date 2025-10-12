<template>
  <div class="home-layout">
    <header class="home-header">
      <div class="logo">Jinza</div>
      <nav class="nav-bar">
        <el-menu :default-active="activePage" mode="horizontal" class="el-menu-horizontal">
          <el-menu-item index="users" @click="activePage='users'">用户管理</el-menu-item>
          <el-menu-item index="customers" @click="activePage='customers'">客户管理</el-menu-item>
          <el-menu-item index="banks" @click="activePage='banks'">银行列表</el-menu-item>
          <el-menu-item index="accounts" @click="activePage='accounts'">收款账户</el-menu-item>
          <el-menu-item index="settings" @click="activePage='settings'">系统设置</el-menu-item>
        </el-menu>
      </nav>
    </header>
    <router-view />
  </div>
</template>

<script setup>
// 首页已由路由自动渲染仪表盘，无需其它内容
import { ref } from 'vue'
const activePage = ref('users')
</script>

<style scoped>
/* 保留空样式，后续可扩展 */
.home-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(120deg, #e3f0ff 0%, #f8fbff 100%);
  box-sizing: border-box;
}
.home-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 64px;
  background: #fff;
  box-shadow: 0 2px 16px 0 rgba(79,140,255,0.08);
  padding: 0 32px;
  z-index: 20;
}
/* 移除旧 .logo 样式，保留新导航样式 */
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
.home-main {
  flex: 1;
  min-width: 0;
  padding: 0 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: calc(100vh - 64px);
  overflow-y: auto;
}
.main-content {
  width: 100%;
  max-width: 1400px;
  margin: 32px auto 0 auto;
  min-height: 70vh;
  box-sizing: border-box;
  background: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
.meta {
  margin-top: 6px;
  color: #6b7b8c;
  font-size: 14px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
  justify-content: flex-start;
  width: 100%;
  /* 移除 .hero 样式 */
  max-width: 1400px;
}
.home-card {
  cursor: pointer;
  transition: transform .22s cubic-bezier(.4,0,.2,1), box-shadow .22s cubic-bezier(.4,0,.2,1);
  border-radius: 22px;
  box-shadow: 0 8px 32px rgba(79,140,255,0.10), 0 1.5px 8px rgba(79,140,255,0.08);
  background: rgba(255,255,255,0.92);
}
.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
.users-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
.home-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 18px 22px 18px;
}
.home-card:hover {
  transform: scale(1.04) rotateX(8deg) rotateY(-6deg);
  box-shadow: 0 16px 48px rgba(79,140,255,0.18), 0 2px 12px rgba(79,140,255,0.10);
}
.icon {
  font-size: 38px;
  margin-bottom: 10px;
  color: #4f8cff;
  filter: drop-shadow(0 2px 8px #4f8cff33);
  transition: transform .3s cubic-bezier(.4,0,.2,1);
}
.home-card:hover .icon {
  transform: scale(1.12) rotateX(12deg) rotateY(-8deg);
}
.name {
  margin-top: 8px;
  font-weight: 700;
  color: #4f8cff;
  font-size: 18px;
  text-align: center;
}
.desc {
  margin-top: 6px;
  color: #6b7b8c;
  font-size: 14px;
  text-align: center;
}
@media (max-width: 600px) {
  .home-layout {
    flex-direction: column;
  }
  .home-sidebar {
    width: 100vw;
    min-height: 60px;
    flex-direction: row;
    align-items: center;
    box-shadow: none;
    padding: 0 8px;
  }
  .sidebar-header, .sidebar-footer {
    display: none;
  }
  .sidebar-nav {
    flex: 1;
    padding: 0;
  }
  .home-main {
    padding: 0 8px;
  }
  .grid {
    grid-template-columns: 1fr;
    gap: 16px;
    max-width: 100vw;
  }
  .home-card {
    padding: 18px 6px 12px 6px;
    border-radius: 14px;
  }
  .name { font-size: 16px; }
  .desc { font-size: 13px; }
}
.home-sidebar {
  position: sticky;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 10;
}
.main-content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 70vh;
  box-sizing: border-box;
  background: none;
}
</style>
