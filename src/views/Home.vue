<template>
  <div class="home-layout">
    <aside class="home-sidebar">
      <div class="sidebar-header">
        <div class="logo">Jinza</div>
      </div>
      <nav class="sidebar-nav">
        <el-menu :default-active="activePage" class="el-menu-vertical">
          <el-menu-item index="users" @click="activePage='users'">用户管理</el-menu-item>
          <el-menu-item index="customers" @click="activePage='customers'">客户管理</el-menu-item>
          <el-menu-item index="banks" @click="activePage='banks'">银行列表</el-menu-item>
          <el-menu-item index="accounts" @click="activePage='accounts'">收款账户</el-menu-item>
          <el-menu-item index="settings" @click="activePage='settings'">系统设置</el-menu-item>
        </el-menu>
      </nav>
    </aside>
    <main class="home-main">
      <div class="main-content">
        <component :is="pageComponent" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import UserManagement from './UserManagement.vue'
import Customers from './Customers.vue'
import Banks from './Banks.vue'
import Accounts from './Accounts.vue'
import Settings from './Settings.vue'

const activePage = ref('users')
const pageComponent = computed(() => {
  switch (activePage.value) {
    case 'users': return UserManagement
    case 'customers': return Customers
    case 'banks': return Banks
    case 'accounts': return Accounts
    case 'settings': return Settings
    default: return UserManagement
  }
})
</script>

<style scoped>
.home-layout {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(120deg, #e3f0ff 0%, #f8fbff 100%);
  box-sizing: border-box;
  overflow: hidden;
}
.home-sidebar {
  width: 160px;
  width: 10vw;
  min-width: 120px;
  max-width: 220px;
  background: #fff;
  box-shadow: 2px 0 16px 0 rgba(79,140,255,0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  padding: 0;
  position: sticky;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 10;
  .home-layout {
    display: flex;
    height: 100vh;
    width: 100vw;
    background: linear-gradient(120deg, #e3f0ff 0%, #f8fbff 100%);
    box-sizing: border-box;
  }
  .home-sidebar {
    width: 220px;
    min-width: 220px;
    max-width: 220px;
    background: #fff;
    box-shadow: 2px 0 16px 0 rgba(79,140,255,0.08);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    padding: 0;
    position: sticky;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 10;
  }
  .home-main {
    flex: 1;
    min-width: 0;
    padding: 0 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    height: 100vh;
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
  font-weight: 700;
  color: #4f8cff;
  letter-spacing: .2px;
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
