<template>
  <div class="home container">
    <div class="hero">
      <div class="welcome">{{ t('home.welcome') }}</div>
      <div class="meta">{{ username }} · {{ today }}</div>
    </div>
    <div class="grid">
      <el-card v-if="has('manage_users')" class="home-card" @click="go('/users')">
        <div class="icon">👤</div>
        <div class="name">{{ t('home.users') }}</div>
        <div class="desc">{{ t('home.usersDesc') }}</div>
      </el-card>
      <el-card v-if="has('view_customers')" class="home-card" @click="go('/customers')">
        <div class="icon">👥</div>
        <div class="name">{{ t('home.customers') }}</div>
        <div class="desc">{{ t('home.customersDesc') }}</div>
      </el-card>
      <el-card v-if="has('view_products')" class="home-card" @click="go('/products')">
        <div class="icon">📦</div>
        <div class="name">{{ t('home.products') }}</div>
        <div class="desc">{{ t('home.productsDesc') }}</div>
      </el-card>
      <el-card v-if="has('view_invoices')" class="home-card" @click="go('/invoices')">
        <div class="icon">🧾</div>
        <div class="name">{{ t('home.invoices') }}</div>
        <div class="desc">{{ t('home.invoicesDesc') }}</div>
      </el-card>
      <el-card v-if="has('view_settings')" class="home-card" @click="go('/settings')">
        <div class="icon">⚙️</div>
        <div class="name">{{ t('home.settings') }}</div>
        <div class="desc">{{ t('home.settingsDesc') }}</div>
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
</style>
