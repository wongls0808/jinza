<template>
  <div class="home-layout">
          <aside class="home-sidebar">
            <div class="sidebar-header">
              <div class="logo">Jinza</div>
            </div>
            <nav class="sidebar-nav">
              <el-menu default-active="home" class="el-menu-vertical">
                <el-menu-item index="home" @click="go('/')">
                  <span>{{ t('home.dashboard') }}</span>
                </el-menu-item>
                <el-menu-item v-if="has('manage_users')" index="users" @click="activeModule='users'">
                  <span>{{ t('home.users') }}</span>
                </el-menu-item>
                <el-menu-item v-if="has('view_customers')" index="customers" @click="go('/customers')">
                  <span>{{ t('home.customers') }}</span>
                </el-menu-item>
                <el-menu-item v-if="has('view_banks')" index="banks" @click="go('/banks')">
                  <span>银行列表</span>
                </el-menu-item>
                <el-menu-item v-if="has('view_accounts')" index="accounts" @click="go('/accounts')">
                  <span>收款账户</span>
                </el-menu-item>
                <el-menu-item v-if="has('view_settings')" index="settings" @click="go('/settings')">
                  <span>{{ t('home.settings') }}</span>
                </el-menu-item>
              </el-menu>
            </nav>
            <div class="sidebar-footer">
              <div class="user-info">{{ username }}</div>
              <div class="today">{{ today }}</div>
            </div>
          </aside>
          <main class="home-main">
            <div class="hero">
                <!-- 移除欢迎词与 meta，仅保留主内容区 -->
            </div>
            <div class="main-content">
              <div class="grid" v-if="!activeModule">
                <el-card v-if="has('manage_users')" class="home-card jelly" v-tilt @click="activeModule='users'">
                  <div class="icon"><User /></div>
                  <div class="name">{{ t('home.users') }}</div>
                  <div class="desc">{{ t('home.usersDesc') }}</div>
                </el-card>
                <el-card v-if="has('view_customers')" class="home-card jelly" v-tilt @click="go('/customers')">
                  <div class="icon"><UserFilled /></div>
                  <div class="name">{{ t('home.customers') }}</div>
                  <div class="desc">{{ t('home.customersDesc') }}</div>
                </el-card>
                <el-card v-if="has('view_banks')" class="home-card jelly" v-tilt @click="go('/banks')">
                  <div class="icon"><OfficeBuilding /></div>
                  <div class="name">银行列表</div>
                  <div class="desc">中国与马来西亚主流银行（中英名与 Logo）</div>
                </el-card>
                <el-card v-if="has('view_accounts')" class="home-card jelly" v-tilt @click="go('/accounts')">
                  <div class="icon"><OfficeBuilding /></div>
                  <div class="name">收款账户</div>
                  <div class="desc">银行账户、币种与期初余额</div>
                </el-card>
                <el-card v-if="has('view_settings')" class="home-card jelly" v-tilt @click="go('/settings')">
                  <div class="icon"><Setting /></div>
                  <div class="name">{{ t('home.settings') }}</div>
                  <div class="desc">{{ t('home.settingsDesc') }}</div>
                </el-card>
              </div>
              <div v-if="activeModule==='users'" class="module-panel">
                <UserManagement />
              </div>
            </div>
          </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { ref } from 'vue'
import UserManagement from './UserManagement.vue'
const router = useRouter()
const go = (path) => router.push(path)
const { has, state } = useAuth()
const { t } = useI18n()
const username = computed(() => state.user?.display_name || state.user?.username || '')
const today = new Date().toLocaleDateString()
const activeModule = ref(null)
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
  font-size: 2rem;
  font-weight: 800;
  color: #4f8cff;
  letter-spacing: 2px;
}
.logo {
  font-family: 'Montserrat', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.sidebar-nav {
  flex: 1;
  padding: 0 0 0 0;
}
.el-menu-vertical {
  border: none;
  background: transparent;
}
.sidebar-footer {
  padding: 18px 0 32px 0;
  text-align: center;
  font-size: 15px;
  color: #6b7b8c;
}
.user-info {
  font-weight: 700;
  margin-bottom: 4px;
}
.today {
  font-size: 13px;
}
.home-main {
  width: 90vw;
  min-width: 0;
  max-width: calc(100vw - 120px);
  padding: 0 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
.hero {
  margin: 32px 0 24px 0;
  text-align: left;
  width: 100%;
  max-width: 1400px;
}
.welcome {
  font-size: 28px;
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
