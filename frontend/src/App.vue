<template>
  <div class="app-wrapper">
    <nav class="top-nav">
      <h1>Jinza 管理系统</h1>
      <RouterLink to="/">首页</RouterLink>
      <RouterLink to="/about">关于</RouterLink>
      <RouterLink to="/customers">客户</RouterLink>
    </nav>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app-wrapper { font-family: system-ui, Arial, sans-serif; }
.top-nav { display:flex; gap:1rem; align-items:center; padding: 0.75rem 1rem; background:#1e1e2f; color:#fff; }
.top-nav a { color:#90e0ef; text-decoration:none; }
.top-nav a.router-link-active { text-decoration:underline; }
main { padding:1rem; }
</style>
