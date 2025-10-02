<template>
  <el-container class="layout-root" :class="{ dark: darkMode }">
    <el-aside width="240px" class="app-aside">
      <div class="brand">
        <div class="logo-icon">📊</div>
        <span class="logo-text">企业管理</span>
      </div>
      <el-menu :default-active="$route.name" class="nav" @select="onSelect" :collapse="collapsed">
        <el-menu-item index="dashboard">仪表盘</el-menu-item>
        <el-menu-item index="customers">客户管理</el-menu-item>
        <el-menu-item v-if="auth.user?.role==='admin'" index="users">用户管理</el-menu-item>
        <el-menu-item index="account-sets">账套管理</el-menu-item>
      </el-menu>
      <div class="aside-footer">
        <el-switch v-model="darkMode" size="small" inline-prompt active-text="🌙" inactive-text="☀" />
        <el-button text size="small" @click="collapsed=!collapsed">{{ collapsed? '展开' : '折叠' }}</el-button>
      </div>
    </el-aside>
    <el-container>
      <el-header class="app-header">
        <div class="left">{{$route.meta.title}}</div>
        <div class="right">
          <el-dropdown v-if="auth.user" @command="onCommand">
            <span class="user-btn">
              <el-avatar size="28">{{auth.user.name?.charAt(0)}}</el-avatar>
              <span class="name">{{auth.user.name}}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>
<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../stores/auth';

const auth = useAuth();
const router = useRouter();
const darkMode = ref(false);
const collapsed = ref(false);

function onSelect(name){ router.push({ name }); }
async function onCommand(cmd){ if(cmd==='logout'){ await auth.logout(); router.replace({ name:'login'}); }}

watch(darkMode,(val)=>{
  document.documentElement.classList.toggle('dark',val);
});
</script>
<style scoped>
.layout-root{height:100vh;}
.app-aside{display:flex;flex-direction:column;background:linear-gradient(135deg,#4c6ef5,#7950f2);color:#fff;}
.brand{display:flex;align-items:center;gap:8px;padding:16px 18px;font-weight:600;}
.nav{flex:1;--el-menu-bg-color:transparent;border:none;}
.aside-footer{padding:8px 12px;display:flex;flex-direction:column;gap:6px;}
.app-header{display:flex;justify-content:space-between;align-items:center;background:#fff;border-bottom:1px solid #e5e7eb;}
.app-main{background:#f5f7fa;padding:20px;}
.user-btn{display:flex;align-items:center;gap:6px;cursor:pointer;}
.dark .app-main{background:#1e1e23;color:#eee;}
.dark .app-header{background:#2a2a31;color:#eee;border-color:#444;}
.dark .app-aside{background:linear-gradient(135deg,#2f3b66,#3d2f58);} 
</style>
