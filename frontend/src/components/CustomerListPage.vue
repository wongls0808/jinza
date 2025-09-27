<template>
  <section>
    <h2>客户管理</h2>
    <form class="create-form" @submit.prevent="handleCreate">
      <input v-model="form.name" placeholder="名称" required />
      <input v-model="form.email" placeholder="邮箱" type="email" required />
      <input v-model="form.phone" placeholder="电话" />
      <button :disabled="creating">新增</button>
    </form>

    <div v-if="store.loading">加载中...</div>
    <div v-else-if="store.error" class="error">{{ store.error }}</div>

    <table v-if="!store.loading && store.items.length" class="data-table">
      <thead>
        <tr>
          <th>ID</th><th>名称</th><th>邮箱</th><th>电话</th><th>创建时间</th><th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in store.items" :key="c.id">
          <td>{{ c.id }}</td>
          <td>{{ c.name }}</td>
            <td>{{ c.email }}</td>
            <td>{{ c.phone || '-' }}</td>
            <td>{{ formatDate(c.createdAt) }}</td>
            <td><button @click="remove(c.id)" class="danger">删除</button></td>
        </tr>
      </tbody>
    </table>
    <p v-else>暂无数据。</p>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useCustomerStore } from '../stores/customerStore';

const store = useCustomerStore();
const creating = ref(false);
const form = reactive({ name: '', email: '', phone: '' });

onMounted(() => {
  store.fetchAll();
});

function reset() {
  form.name = ''; form.email = ''; form.phone = '';
}

async function handleCreate() {
  creating.value = true;
  try {
    await store.create({ name: form.name, email: form.email, phone: form.phone || undefined });
    reset();
  } catch (e) {
    // 简单忽略
  } finally { creating.value = false; }
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleString();
}

function remove(id: number) {
  store.remove(id);
}
</script>

<style scoped>
.create-form { display:flex; gap:.5rem; margin-bottom:1rem; }
.create-form input { padding:.4rem .6rem; }
button { cursor:pointer; }
.data-table { border-collapse: collapse; width:100%; }
.data-table th, .data-table td { border:1px solid #ddd; padding:.5rem; }
.data-table thead { background:#f0f0f5; }
.error { color:#d00; }
.danger { background:#d9534f; color:#fff; border:none; padding:.3rem .6rem; }
</style>
