<template>
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
import { ref } from 'vue'
const q = ref('')
function noop() {}
</script>

<style scoped>
.page { padding: 8px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 8px 0 8px; }
.title { font-size: 18px; font-weight: 700; }
.toolbar { display: flex; align-items: center; gap: 8px; }
.spacer { flex: 1; }
.placeholder { color: var(--el-text-color-secondary); padding: 16px; }
</style>