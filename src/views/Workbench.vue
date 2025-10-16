<template>
  <div class="workbench container">
    <div class="hero">
      <div class="welcome">{{ t('workbench.title') }}</div>
      <div class="meta">{{ username }} · {{ today }}</div>
    </div>

    <div class="quick" style="margin-top:8px; margin-bottom:8px;">
      <el-card shadow="never">
        <div class="quick-title" data-testid="qa-title">{{ t('home.quickActions') }}</div>
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
            <div class="fc-icon">{{ it.icon }}</div>
            <div class="fc-texts">
              <div class="fc-title">{{ it.label }}</div>
              <div class="fc-desc">{{ it.desc }}</div>
            </div>
            <div class="fc-arrow">›</div>
          </div>
        </div>
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

// 工作台页面：为保证可见性，这里取消权限 gating，始终展示入口
const quickActions = computed(() => [
  { key: 'tx', label: t('home.qaTransactions'), desc: t('workbench.cards.tx'), route: 'transactions', color: 'blue', icon: '📒' },
  { key: 'settleManage', label: t('home.qaSettlements'), desc: t('workbench.cards.settleManage'), route: 'fx-settlements', color: 'green', icon: '🧾' },
  { key: 'settleHistory', label: t('home.qaSettlementsHistory'), desc: t('workbench.cards.settleHistory'), route: 'fx-settlements', color: 'teal', icon: '🗂️' },
  { key: 'payHistory', label: t('home.qaPaymentsHistory'), desc: t('workbench.cards.payHistory'), route: 'fx-payments', color: 'orange', icon: '💳' },
  { key: 'buyHistory', label: t('home.qaBuyHistory'), desc: t('workbench.cards.buyHistory'), route: 'fx-buy-history', color: 'purple', icon: '💱' },
])
</script>

<style scoped>
.workbench { padding: 8px; }
.hero { margin: 8px 8px 16px; }
.welcome { font-size: 20px; font-weight: 700; color: var(--el-text-color-primary); }
.meta { margin-top: 2px; color: var(--el-text-color-secondary); font-size: 12px; }
.quick-title { font-weight: 800; margin-bottom: 10px; letter-spacing: .2px; }

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
  color: #fff;
  background: linear-gradient(145deg, var(--fc-bg1), var(--fc-bg2));
  box-shadow: 0 14px 30px rgba(0,0,0,.14);
  border: 1px solid color-mix(in oklab, #fff 12%, transparent);
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  transition: box-shadow .2s ease, filter .2s ease, transform .06s ease;
}
.feature-card::after {
  content: "";
  position: absolute;
  right: -20px; bottom: -20px;
  width: 140px; height: 140px;
  background: radial-gradient(closest-side, rgba(255,255,255,.22), transparent 70%);
  filter: blur(6px);
}
.feature-card:hover { box-shadow: 0 22px 46px rgba(0,0,0,.2); filter: saturate(1.06); }
.feature-card:focus { outline: 3px solid rgba(255,255,255,.5); outline-offset: 2px; }
.fc-icon { font-size: 26px; line-height: 1; text-shadow: 0 2px 8px rgba(0,0,0,.28); }
.fc-texts { display: grid; gap: 4px; }
.fc-title { font-weight: 800; letter-spacing: .2px; }
.fc-desc { opacity: .92; font-size: 12px; color: rgba(255,255,255,.95); text-shadow: 0 1px 2px rgba(0,0,0,.18); }
.fc-arrow { font-size: 20px; opacity: .9; }

/* 主题色系 */
.feature-card.is-blue { --fc-bg1: #5aa9ff; --fc-bg2: #3f7ef1; }
.feature-card.is-green { --fc-bg1: #43e97b; --fc-bg2: #38c172; }
.feature-card.is-teal { --fc-bg1: #2dd4bf; --fc-bg2: #14b8a6; }
.feature-card.is-orange { --fc-bg1: #f6ad55; --fc-bg2: #ed8936; }
.feature-card.is-purple { --fc-bg1: #a78bfa; --fc-bg2: #7c3aed; }
</style>