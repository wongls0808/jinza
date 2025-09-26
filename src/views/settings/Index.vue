<template>
  <div class="settings-page">
    <div class="settings-container">
        <section class="settings-main">
          <router-view />
        </section>
      </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
const go = (path: string) => router.push(path);
</script>

<style scoped>
.settings-page { padding: 20px; }
.settings-container { display: flex; gap: 20px; }
.settings-aside { width: 220px; }
.settings-main { flex: 1; }
.settings-content { margin-top: 12px; }
</style>
