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
        <div class="name">银行列表</div>
        <div class="desc">中国与马来西亚主流银行（中英名与 Logo）</div>
      </el-card>
  <el-card v-if="has('view_accounts')" class="home-card jelly" v-tilt @click="go('/accounts')">
  <div class="icon"><OfficeBuilding /></div>
        <div class="name">收款账户</div>
        <div class="desc">银行账户、币种与期初余额</div>
      </el-card>
  <el-card v-if="has('view_settings')" class="home-card jelly" v-tilt @click="go('/settings')">
  <div class="icon"><Setting /></div>
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
.home {
  padding: 16px;
  background: linear-gradient(120deg, #e3f0ff 0%, #f8fbff 100%);
  min-height: 100vh;
}
.hero {
  margin: 16px 16px 24px;
  text-align: center;
}
.welcome {
  font-size: 28px;
  font-weight: 700;
  color: #4f8cff;
  letter-spacing: .2px;
}
.meta {
  margin-top: 6px;
  color: #6b7b8c;
  font-size: 14px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
  justify-content: center;
}
.home-card {
  cursor: pointer;
  transition: transform .22s cubic-bezier(.4,0,.2,1), box-shadow .22s cubic-bezier(.4,0,.2,1);
  border-radius: 22px;
  box-shadow: 0 8px 32px rgba(79,140,255,0.10), 0 1.5px 8px rgba(79,140,255,0.08);
  background: rgba(255,255,255,0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 18px 22px 18px;
}
.home-card:hover {
  transform: scale(1.04) rotateX(8deg) rotateY(-6deg);
  box-shadow: 0 16px 48px rgba(79,140,255,0.18), 0 2px 12px rgba(79,140,255,0.10);
}
.icon {
  font-size: 38px;
  margin-bottom: 10px;
  color: #4f8cff;
  filter: drop-shadow(0 2px 8px #4f8cff33);
  transition: transform .3s cubic-bezier(.4,0,.2,1);
}
.home-card:hover .icon {
  transform: scale(1.12) rotateX(12deg) rotateY(-8deg);
}
.name {
  margin-top: 8px;
  font-weight: 700;
  color: #4f8cff;
  font-size: 18px;
  text-align: center;
}
.desc {
  margin-top: 6px;
  color: #6b7b8c;
  font-size: 14px;
  text-align: center;
}
@media (max-width: 600px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .home-card {
    padding: 18px 6px 12px 6px;
    border-radius: 14px;
  }
  .name { font-size: 16px; }
  .desc { font-size: 13px; }
}
</style>
