<template>
  <div class="home container">
    <div class="hero">
      <div class="welcome">{{ t('home.welcome') }}</div>
      <div class="meta">{{ username }} · {{ today }}</div>
    </div>
  <div class="grid">
  <el-card v-if="has('manage_users')" class="home-card jelly" v-tilt @click="go('/users')">
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
        <div class="name">{{ t('home.banks') }}</div>
        <div class="desc">{{ t('home.banksDesc') }}</div>
      </el-card>
  <el-card v-if="has('view_accounts')" class="home-card jelly" v-tilt @click="go('/accounts')">
  <div class="icon"><OfficeBuilding /></div>
        <div class="name">{{ t('home.accounts') }}</div>
        <div class="desc">{{ t('home.accountsDesc') }}</div>
      </el-card>
  <el-card v-if="has('view_transactions')" class="home-card jelly" v-tilt @click="go('/transactions')">
  <div class="icon"><Document /></div>
        <div class="name">{{ t('home.transactions') }}</div>
        <div class="desc">{{ t('home.transactionsDesc') }}</div>
      </el-card>
  <el-card v-if="has('view_settings')" class="home-card jelly" v-tilt @click="go('/settings')">
  <div class="icon"><Setting /></div>
        <div class="name">{{ t('home.settings') }}</div>
        <div class="desc">{{ t('home.settingsDesc') }}</div>
      </el-card>
    </div>
    <div class="todo" style="margin-top:16px;">
      <el-card>
        <div class="todo-title">待办事项</div>
        <el-table :data="todos" size="small" border>
          <el-table-column label="#" width="60">
            <template #default="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>
          <el-table-column prop="pay_date" label="付款日期" width="120">
            <template #default="{ row }">{{ fmtDate(row.pay_date) }}</template>
          </el-table-column>
          <el-table-column prop="bill_no" label="单号" width="200" />
          <el-table-column prop="customer_name" label="客户" />
          <el-table-column prop="total_amount" label="金额" width="140" align="right">
            <template #default="{ row }">{{ money(row.total_amount) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="go('/fx/payments')">去审批</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import { computed, ref, onMounted } from 'vue'
import { User, UserFilled, OfficeBuilding, Setting, Document } from '@element-plus/icons-vue'
const router = useRouter()
const go = (path) => router.push(path)
const { has, state } = useAuth()
const { t } = useI18n()
const username = computed(() => state.user?.display_name || state.user?.username || '')
const today = new Date().toLocaleDateString()

const todos = ref([])
function fmtDate(v){ try { if (!v) return ''; if (typeof v === 'string') return v.slice(0,10); if (v.toISOString) return v.toISOString().slice(0,10); return String(v).slice(0,10) } catch { return String(v).slice(0,10) } }
function money(v){ return Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }
async function loadTodos(){
  try {
    const res = await api.fx.payments.list({ status: 'pending', view: 'head', page: 1, pageSize: 10 })
    const items = Array.isArray(res) ? res : (res.items || [])
    todos.value = items
  } catch {}
}
onMounted(loadTodos)
</script>

<style scoped>
.home { padding: 8px; }
.hero { margin: 8px 8px 16px; }
.welcome { font-size: 20px; font-weight: 700; color: var(--el-text-color-primary); }
.meta { margin-top: 2px; color: var(--el-text-color-secondary); font-size: 12px; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.home-card { cursor: pointer; transition: transform .15s ease, box-shadow .15s ease; border-radius: 14px; }
.home-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,.1); }
.icon { font-size: 28px; }
.name { margin-top: 8px; font-weight: 600; color: var(--el-text-color-primary); }
.desc { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 13px; }
.todo-title { font-weight: 700; margin-bottom: 8px; }
</style>
