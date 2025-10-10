<template>
  <div class="page container">
    <div class="head"><div class="title">银行列表</div></div>
    <el-card class="jelly">
      <template #header>
        <div class="toolbar">
          <div class="spacer"></div>
          <el-button type="primary" size="small" @click="reset">重置为默认</el-button>
        </div>
      </template>

      <div class="cards">
        <div v-for="(b,i) in banks" :key="b.code" class="bank-card">
          <div class="idx">{{ i + 1 }}</div>
          <img class="logo" :src="b.logo" :alt="b.en" />
          <div class="names">
            <div class="zh">{{ b.zh }}</div>
            <div class="en">{{ b.en }}</div>
          </div>
          <el-button type="danger" link @click="remove(b.code)">删除</el-button>
        </div>
      </div>
    </el-card>
  </div>
  </template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/api'

const banks = ref([])

async function load() {
  banks.value = await api.requestBanks()
}

async function remove(code) {
  try {
    const b = banks.value.find(x => x.code === code)
    if (!b) return
    await ElMessageBox.confirm(`确认删除【${b.zh}】?`, '提示', { type: 'warning' })
    await api.deleteBank(b.id)
    await load()
    ElMessage.success('已删除')
  } catch {}
}

async function reset() {
  await api.resetBanks()
  await load()
  ElMessage.success('已重置到默认列表')
}

onMounted(load)
</script>

<style scoped>
.page { padding: 8px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 8px 0 8px; }
.title { font-size: 18px; font-weight: 700; }
.toolbar { display: flex; align-items: center; gap: 8px; }
.spacer { flex: 1; }

.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.bank-card {
  display: grid; grid-template-columns: 40px 56px 1fr auto; align-items: center; gap: 12px;
  padding: 10px 12px; border: 1px solid var(--el-border-color); border-radius: 12px; background: var(--el-bg-color);
}
.idx { color: var(--el-text-color-secondary); font-weight: 600; }
.logo { width: 56px; height: 56px; object-fit: contain; }
.names { display: grid; gap: 2px; }
.zh { font-weight: 600; }
.en { color: var(--el-text-color-secondary); font-size: 12px; }
</style>