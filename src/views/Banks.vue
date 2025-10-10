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
import { ref } from 'vue'

const defaults = [
  // 中国 Mainland China
  { code: 'ICBC', zh: '中国工商银行', en: 'Industrial and Commercial Bank of China', logo: '/banks/icbc.svg' },
  { code: 'ABC', zh: '中国农业银行', en: 'Agricultural Bank of China', logo: '/banks/abc.svg' },
  { code: 'BOC', zh: '中国银行', en: 'Bank of China', logo: '/banks/boc.svg' },
  { code: 'CCB', zh: '中国建设银行', en: 'China Construction Bank', logo: '/banks/ccb.svg' },
  { code: 'BCM', zh: '交通银行', en: 'Bank of Communications', logo: '/banks/bcm.svg' },
  // 马来西亚 Malaysia
  { code: 'MAYBANK', zh: '马银行', en: 'Maybank', logo: '/banks/maybank.svg' },
  { code: 'CIMB', zh: '联昌银行', en: 'CIMB Bank', logo: '/banks/cimb.svg' },
  { code: 'PUBLIC', zh: '大众银行', en: 'Public Bank', logo: '/banks/public.svg' },
  { code: 'RHB', zh: '兴业银行（马）', en: 'RHB Bank', logo: '/banks/rhb.svg' },
  { code: 'HONGLEONG', zh: '丰隆银行', en: 'Hong Leong Bank', logo: '/banks/hlb.svg' }
]

const banks = ref(load() || defaults)

function load() {
  try { return JSON.parse(localStorage.getItem('banks_list') || 'null') } catch { return null }
}
function save() { localStorage.setItem('banks_list', JSON.stringify(banks.value)) }
function remove(code) { banks.value = banks.value.filter(b => b.code !== code); save() }
function reset() { banks.value = [...defaults]; save() }
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