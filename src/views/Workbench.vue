<template>
  <div class="workbench container">
    <div class="hero">
      <div class="welcome">{{ t('workbench.title') }}</div>
      <div class="meta">{{ username }} · {{ today }}</div>
    </div>

    <div class="quick" style="margin-top:8px; margin-bottom:8px;">
      <el-card shadow="never" class="card--plain">
        <div class="card-grid">
          <div
            v-for="it in quickActions" :key="it.key"
            class="feature-card"
            :class="`is-${it.color}`"
            role="button"
            :aria-label="it.label"
            tabindex="0"
            v-tilt="{ max: 8, scale: 1.02 }"
            @click="go({ name: it.route })"
            @keydown.enter.prevent="go({ name: it.route })"
            @keydown.space.prevent="go({ name: it.route })"
          >
            <div class="fc-icon">
              <component :is="it.icon" />
            </div>
            <div class="fc-texts">
              <div class="fc-title">{{ it.label }}</div>
              <div class="fc-desc">{{ it.desc }}</div>
            </div>
            <div class="fc-arrow">›</div>
          </div>
        </div>
      </el-card>
    </div>
    <!-- 待办模块图标区 -->
    <div class="modules">
      <div class="module" role="button" tabindex="0" aria-label="payments" @click="openPayments" @keydown.enter.prevent="openPayments" @keydown.space.prevent="openPayments">
        <el-badge :value="paymentsCount" :max="99" type="danger">
          <div class="module-card">
            <div class="m-icon"><CreditCard /></div>
            <div class="m-texts">
              <div class="m-title">{{ t('workbench.todos.payments') }}</div>
              <div class="m-desc">{{ t('workbench.todos.title') }}</div>
            </div>
          </div>
        </el-badge>
      </div>
    </div>

    <!-- 付款待审抽屉列表 -->
    <el-drawer v-model="paymentsDrawer" :title="t('workbench.todos.payments')" size="60%">
      <div style="margin-bottom:8px; display:flex; gap:8px; align-items:center;">
        <el-button size="small" type="primary" @click="loadPaymentsList">刷新</el-button>
        <el-button size="small" @click="goPaymentsManage">去处理</el-button>
      </div>
      <el-table :data="payments" size="small" border v-loading="paymentsLoading">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="pay_date" label="付款日期" width="120">
          <template #default="{ row }">{{ (row.pay_date || '').slice(0,10) }}</template>
        </el-table-column>
        <el-table-column prop="bill_no" label="单号" width="200" />
        <el-table-column prop="customer_name" label="客户" />
        <el-table-column prop="total_amount" label="金额" width="140" align="right">
          <template #default="{ row }">{{ Number(row.total_amount||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="goPaymentsManage">去处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import { computed, ref, onMounted } from 'vue'
import { api } from '@/api'

const router = useRouter()
const go = (path) => router.push(path)
const { has, state } = useAuth()
const { t } = useI18n()
const username = computed(() => state.user?.display_name || state.user?.username || '')
const today = new Date().toLocaleDateString()

// 工作台页面：为保证可见性，这里取消权限 gating，始终展示入口
const quickActions = computed(() => [
  { key: 'tx', label: t('home.qaTransactions'), desc: t('workbench.cards.tx'), route: 'transactions', color: 'blue', icon: 'Tickets' },
  { key: 'settleManage', label: t('home.qaSettlements'), desc: t('workbench.cards.settleManage'), route: 'fx-settlements', color: 'green', icon: 'Collection' },
  { key: 'settleHistory', label: t('home.qaSettlementsHistory'), desc: t('workbench.cards.settleHistory'), route: 'fx-settlements', color: 'teal', icon: 'FolderOpened' },
  { key: 'payHistory', label: t('home.qaPaymentsHistory'), desc: t('workbench.cards.payHistory'), route: 'fx-payments', color: 'orange', icon: 'CreditCard' },
  { key: 'buyHistory', label: t('home.qaBuyHistory'), desc: t('workbench.cards.buyHistory'), route: 'fx-buy-history', color: 'purple', icon: 'Coin' },
])

// 待办：付款待审数量徽标 + 抽屉列表
const paymentsCount = ref(0)
const paymentsDrawer = ref(false)
const payments = ref([])
const paymentsLoading = ref(false)

async function loadPaymentsCount(){
  try {
    const res = await api.fx.payments.list({ status: 'pending', view: 'head', page: 1, pageSize: 1 })
    if (res && typeof res.total === 'number') paymentsCount.value = res.total
    else if (Array.isArray(res?.items)) paymentsCount.value = res.items.length
    else if (Array.isArray(res)) paymentsCount.value = res.length
    else paymentsCount.value = 0
  } catch { paymentsCount.value = 0 }
}
async function loadPaymentsList(){
  paymentsLoading.value = true
  try {
    const res = await api.fx.payments.list({ status: 'pending', view: 'head', page: 1, pageSize: 50 })
    payments.value = Array.isArray(res) ? res : (res.items || [])
  } catch (e) {
    // 后端不可用（本地未配置数据库）时，静默为空以保证 UI 可用
    payments.value = []
  } finally {
    paymentsLoading.value = false
  }
}
function openPayments(){ paymentsDrawer.value = true; loadPaymentsList() }
function goPaymentsManage(){ router.push({ name: 'fx-payments' }) }

onMounted(() => { loadPaymentsCount() })
</script>

<style scoped>
.workbench { padding: 8px; }
.hero { margin: 8px 8px 16px; }
.welcome { font-size: 20px; font-weight: 700; color: var(--el-text-color-primary); }
.meta { margin-top: 2px; color: var(--el-text-color-secondary); font-size: 12px; }
.quick-title { display:none; }
.card--plain { background: transparent; border: none; box-shadow: none; }

/* 卡片网格 */
.card-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); 
  gap: 14px; 
}
.feature-card {
  position: relative;
  display: grid;
  grid-template-columns: 44px 1fr 16px;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-radius: 16px;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  box-shadow: 0 8px 20px rgba(0,0,0,.06);
  border: 1px solid var(--el-border-color);
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  transition: box-shadow .2s ease, filter .2s ease, transform .06s ease;
}
.feature-card::after { display: none; }
.feature-card:hover { box-shadow: 0 22px 46px rgba(0,0,0,.2); filter: saturate(1.06); }
.feature-card:focus { outline: 3px solid rgba(255,255,255,.5); outline-offset: 2px; }
.fc-icon { font-size: 26px; line-height: 1; text-shadow: none; display: flex; align-items: center; justify-content: center; }
.fc-icon :deep(svg) { width: 24px; height: 24px; }
.fc-texts { display: grid; gap: 4px; }
.fc-title { font-weight: 800; letter-spacing: .2px; }
.fc-desc { opacity: .92; font-size: 12px; color: var(--el-text-color-secondary); text-shadow: none; }
.fc-arrow { font-size: 20px; opacity: .65; color: var(--el-text-color-secondary); }

/* 主题色系 */
/* 主题占位已合并为统一白卡风格，无需额外色系 */

/* 待办模块样式 */
.modules { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; margin-top: 8px; }
.module { cursor: pointer; }
.module-card { display: grid; grid-template-columns: 40px 1fr; align-items: center; gap: 10px; padding: 12px 14px; border: 1px solid var(--el-border-color); border-radius: 12px; background: var(--el-bg-color); box-shadow: 0 6px 16px rgba(0,0,0,.05); }
.m-icon { display: flex; align-items: center; justify-content: center; color: var(--el-color-primary); }
.m-icon :deep(svg) { width: 22px; height: 22px; }
.m-title { font-weight: 700; }
.m-desc { font-size: 12px; color: var(--el-text-color-secondary); }
</style>