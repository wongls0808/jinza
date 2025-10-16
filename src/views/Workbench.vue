<template>
  <div class="workbench container">
    <div class="hero">
      <div class="welcome">{{ t('workbench.title') }}</div>
      <div class="meta">{{ username }} · {{ today }}</div>
    </div>

    <div class="quick" style="margin-top:8px; margin-bottom:8px;">
      <el-card shadow="never">
        <div class="quick-title">{{ t('home.quickActions') }}</div>
        <template v-if="quickActions.some(i => i.show)">
          <div class="app-buttons">
            <div 
              v-for="it in quickActions" :key="it.key"
              v-if="it.show"
              class="app-btn"
              :class="`is-${it.color}`"
              v-tilt="{ max: 10, scale: 1.03 }"
              @click="go({ name: it.route })"
            >
              <div class="app-btn__icon">{{ it.icon }}</div>
              <div class="app-btn__label">{{ it.label }}</div>
            </div>
          </div>
        </template>
        <template v-else>
          <el-empty description="暂无可用快捷操作" />
        </template>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const router = useRouter()
const go = (path) => router.push(path)
const { has, state } = useAuth()
const { t } = useI18n()
const username = computed(() => state.user?.display_name || state.user?.username || '')
const today = new Date().toLocaleDateString()

const quickActions = computed(() => [
  { key: 'tx', label: t('home.qaTransactions'), route: 'transactions', perm: 'view_transactions', color: 'blue', icon: '📒', show: has('view_transactions') },
  { key: 'settleManage', label: t('home.qaSettlements'), route: 'fx-settlements', perm: 'view_fx', color: 'green', icon: '🧾', show: has('view_fx') },
  { key: 'settleHistory', label: t('home.qaSettlementsHistory'), route: 'fx-settlements', perm: 'view_fx', color: 'teal', icon: '🗂️', show: has('view_fx') },
  { key: 'payHistory', label: t('home.qaPaymentsHistory'), route: 'fx-payments', perm: 'view_fx', color: 'orange', icon: '💳', show: has('view_fx') },
  { key: 'buyHistory', label: t('home.qaBuyHistory'), route: 'fx-buy-history', perm: 'view_fx', color: 'purple', icon: '💱', show: has('view_fx') },
])
</script>

<style scoped>
.workbench { padding: 8px; }
.hero { margin: 8px 8px 16px; }
.welcome { font-size: 20px; font-weight: 700; color: var(--el-text-color-primary); }
.meta { margin-top: 2px; color: var(--el-text-color-secondary); font-size: 12px; }
.quick-title { font-weight: 700; margin-bottom: 8px; }
.app-buttons { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.app-btn { 
  position: relative;
  border-radius: 16px; 
  padding: 18px 14px; 
  background: linear-gradient(145deg, var(--app-btn-bg1), var(--app-btn-bg2));
  color: #fff;
  box-shadow: 0 12px 24px rgba(0,0,0,.12);
  cursor: pointer;
  user-select: none;
  transform-style: preserve-3d;
  transition: box-shadow .2s ease, filter .2s ease;
}
.app-btn:hover { box-shadow: 0 18px 36px rgba(0,0,0,.18); filter: saturate(1.05); }
.app-btn__icon { font-size: 26px; line-height: 1; margin-bottom: 8px; }
.app-btn__label { font-weight: 700; letter-spacing: .3px; }
.app-btn.is-blue { --app-btn-bg1: #5aa9ff; --app-btn-bg2: #3f7ef1; }
.app-btn.is-green { --app-btn-bg1: #43e97b; --app-btn-bg2: #38c172; }
.app-btn.is-teal { --app-btn-bg1: #2dd4bf; --app-btn-bg2: #14b8a6; }
.app-btn.is-orange { --app-btn-bg1: #f6ad55; --app-btn-bg2: #ed8936; }
.app-btn.is-purple { --app-btn-bg1: #a78bfa; --app-btn-bg2: #7c3aed; }
</style>