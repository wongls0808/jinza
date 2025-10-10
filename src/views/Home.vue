<template>
  <div class="home container">
    <h2 class="title">{{ t('home.welcome') }}</h2>
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
const router = useRouter()
const go = (path) => router.push(path)
const { has } = useAuth()
const { t } = useI18n()
</script>

<style scoped>
.home { padding: 8px; }
.title { margin: 8px 8px 16px; font-size: 20px; color: var(--el-text-color-primary); }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.home-card { cursor: pointer; transition: transform .15s ease, box-shadow .15s ease; }
.home-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.08); }
.icon { font-size: 28px; }
.name { margin-top: 8px; font-weight: 600; color: var(--el-text-color-primary); }
.desc { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 13px; }
</style>
