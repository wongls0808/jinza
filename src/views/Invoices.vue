<template>
  <div class="page container">
    <div class="head"><div class="title">{{$t('invoices.title')}}</div></div>
    <el-card class="jelly">
      <template #header>
        <div class="toolbar">
          <el-input v-model.trim="q" :placeholder="$t('invoices.searchPlaceholder')" size="small" style="width:220px" />
          <el-button size="small" @click="noop">{{$t('common.search')}}</el-button>
          <div class="spacer"></div>
          <el-dropdown>
            <el-button size="small">{{$t('common.import')}}</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item><span>{{$t('invoices.importCsvPlaceholder')}}</span></el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button size="small" @click="noop">{{$t('common.export')}}</el-button>
          <el-button size="small" @click="noop">{{$t('common.template')}}</el-button>
          <el-button type="primary" size="small" @click="noop">{{$t('common.add')}}</el-button>
          <el-button type="danger" size="small" disabled>{{$t('common.delete')}}</el-button>
        </div>
      </template>
      <div class="placeholder">{{$t('common.todoPlaceholder')}}</div>
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