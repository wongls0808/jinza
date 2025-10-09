<template>
  <div class="home">
    <h2 class="title">欢迎回来</h2>
    <div class="grid">
      <div class="card" @click="go('/customers')">
        <div class="icon">👥</div>
        <div class="name">客户管理</div>
        <div class="desc">管理客户档案与往来</div>
      </div>
      <div class="card" @click="go('/products')">
        <div class="icon">📦</div>
        <div class="name">商品库</div>
        <div class="desc">维护商品与库存</div>
      </div>
      <div class="card" @click="go('/invoices')">
        <div class="icon">🧾</div>
        <div class="name">发票管理</div>
        <div class="desc">开票、预览与打印</div>
      </div>
      <div class="card" @click="go('/settings')">
        <div class="icon">⚙️</div>
        <div class="name">系统设置</div>
        <div class="desc">基础资料与偏好</div>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const go = (path) => router.push(path)
</script>

<style scoped>
.home { padding: 8px; }
.title { margin: 8px 8px 16px; font-size: 20px; color: #111827; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,.06);
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease;
}
.card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.08); }
.icon { font-size: 28px; }
.name { margin-top: 8px; font-weight: 600; color: #111827; }
.desc { margin-top: 4px; color: #6b7280; font-size: 13px; }
</style>
