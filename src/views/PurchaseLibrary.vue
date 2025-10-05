<template>
  <div class="purchase-lib-container">
    <div class="header">
      <h2>采购库</h2>
      <div class="description">按账套隔离，记录来自已开具发票的商品明细汇总</div>
    </div>

    <el-card shadow="hover" class="main-card">
      <div class="toolbar">
        <div class="filters">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="fetchData"
          />
          <el-input v-model="search" placeholder="搜索商品编码/描述" style="max-width:240px" @input="debouncedFetch" clearable>
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <el-table
        :data="rows"
        stripe
        style="width: 100%"
        v-loading="loading"
        row-key="rowKey"
      >
        <el-table-column prop="date" label="日期" width="140" />
        <el-table-column prop="product_code" label="商品编码" width="160" />
        <el-table-column prop="product_description" label="商品描述" min-width="220" />
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column prop="quantity_total" label="数量合计" width="120">
          <template #default="{ row }">{{ formatNumber(row.quantity_total) }}</template>
        </el-table-column>
        <el-table-column prop="unit_price_avg" label="均价" width="140">
          <template #default="{ row }">{{ formatMoney(row.unit_price_avg) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { fetchWithCredentials } from '../utils/api'

const rows = ref([])
const loading = ref(false)
const dateRange = ref(null)
const search = ref('')

function rowKey(row){
  return `${row.date}-${row.product_code || row.product_description}`
}

function getCurrentAccountSetId(){
  try{
    const v = localStorage.getItem('currentAccountSet')
    if (!v) return null
    const obj = JSON.parse(v)
    return obj?.id || obj?.account_set_id || null
  }catch(e){
    return null
  }
}

function formatNumber(n){
  const num = parseFloat(n) || 0
  return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 }).format(num)
}
function formatMoney(n){
  const num = parseFloat(n) || 0
  // 马币显示 RM 前缀
  return `RM ${num.toFixed(2)}`
}

let debounceTimer = null
const debouncedFetch = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchData, 300)
}

async function fetchData(){
  const accountSetId = getCurrentAccountSetId()
  if (!accountSetId){
    ElMessage.warning('请先选择账套（在发票页面）')
    return
  }
  loading.value = true
  try{
    const params = new URLSearchParams({ account_set_id: accountSetId })
    if (dateRange.value && dateRange.value.length === 2){
      params.append('start_date', dateRange.value[0])
      params.append('end_date', dateRange.value[1])
    }
    if (search.value){
      params.append('search', search.value)
    }
    const res = await fetchWithCredentials(`/api/purchases?${params.toString()}`)
    if (!res.ok) throw new Error('获取失败')
    rows.value = await res.json()
  }catch(err){
    console.error(err)
    ElMessage.error('获取采购库失败')
  }finally{
    loading.value = false
  }
}

onMounted(()=>{
  fetchData()
  // 监听账套切换事件（发票页广播）
  window.addEventListener('account-set-changed', fetchData)
})
</script>

<style scoped>
.purchase-lib-container{ padding:20px; }
.header{ margin-bottom:14px; }
.description{ color:#909399; font-size:13px; }
.main-card{ }
.toolbar{ display:flex; align-items:center; gap:12px; margin-bottom:12px; }
.filters{ display:flex; align-items:center; gap:12px; }
</style>
