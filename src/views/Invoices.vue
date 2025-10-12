<template>
  <NavBar :activePage="'invoices'" :username="username" @navigate="onNavigate" />
  <div class="page container">
    <div class="head"><div class="title">发票管理</div></div>
    <el-card class="jelly">
      <template #header>
        <div class="toolbar">
          <el-input v-model.trim="q" placeholder="搜索 发票号/客户名" size="small" style="width:220px" />
          <el-button size="small" @click="noop">搜索</el-button>
          <div class="spacer"></div>
          <el-dropdown>
            <el-button size="small">导入</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item><span>CSV 导入（占位）</span></el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button size="small" @click="noop">导出</el-button>
          <el-button size="small" @click="noop">模板</el-button>
          <el-button type="primary" size="small" @click="noop">添加</el-button>
          <el-button type="danger" size="small" disabled>删除</el-button>
        </div>
      </template>
      <div class="placeholder">后续与后端接通后展示表格...</div>
    </el-card>
  </div>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
const q = ref('')
function noop() {}
function onNavigate(page) {
  // 可根据需要实现页面跳转逻辑
}
const { state } = useAuth()
const username = computed(() => state.user?.username || '用户')
</script>

<style scoped>
  .page {
    min-height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%);
    box-sizing: border-box;
    padding: 0;
    overflow-x: hidden;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 32px 0 8px;
    width: 100%;
    max-width: 1200px;
  }
  .title {
    font-size: 2.2rem;
    font-weight: 800;
    letter-spacing: 1px;
    color: #3b4890;
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .spacer {
    flex: 1;
  }
  .placeholder {
    color: var(--el-text-color-secondary);
    padding: 16px;
  }
</style>