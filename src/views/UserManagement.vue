<template>
  <div class="users">
    <h2>用户管理</h2>
    <div class="actions">
      <input v-model.trim="newUser.username" placeholder="用户名" />
      <input v-model.trim="newUser.password" placeholder="初始密码" type="password" />
      <input v-model.trim="newUser.display_name" placeholder="显示名" />
      <button @click="createUser" :disabled="creating">新增用户</button>
    </div>

    <div class="grid">
      <div class="card" v-for="u in users" :key="u.id">
        <div class="row">
          <div class="name">{{ u.display_name || u.username }}</div>
          <div class="username">@{{ u.username }}</div>
          <label>
            <input type="checkbox" v-model="u.is_active" @change="toggleActive(u)" /> 启用
          </label>
        </div>
        <div class="perms" v-if="perms.length">
          <div class="perm" v-for="p in perms" :key="p.code">
            <label>
              <input type="checkbox" :checked="userHas(u, p.code)" @change="setUserPerm(u, p.code, $event.target.checked)" />
              {{ p.name }}
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/api'

const users = ref([])
const perms = ref([])
const creating = ref(false)
const newUser = ref({ username: '', password: '', display_name: '' })

function userHas(u, code) {
  return (u._perms || []).includes(code)
}

async function load() {
  const [us, ps] = await Promise.all([api.users.list(), api.perms.list()])
  // attach perms to each user
  const withPerms = await Promise.all(us.map(async (u) => {
    const up = await api.users.getPerms(u.id)
    return { ...u, _perms: up }
  }))
  users.value = withPerms
  perms.value = ps
}

async function createUser() {
  if (!newUser.value.username || !newUser.value.password) return alert('请填写用户名与密码')
  creating.value = true
  try {
    await api.users.create(newUser.value)
    newUser.value = { username: '', password: '', display_name: '' }
    await load()
  } catch (e) {
    alert('创建失败：' + (e.message || ''))
  } finally {
    creating.value = false
  }
}

async function toggleActive(u) {
  try {
    await api.users.update(u.id, { is_active: u.is_active })
  } catch (e) {
    alert('更新失败');
  }
}

async function setUserPerm(u, code, on) {
  try {
    const next = on ? Array.from(new Set([...(u._perms || []), code])) : (u._perms || []).filter(x => x !== code)
    await api.users.setPerms(u.id, next)
    u._perms = next
  } catch (e) {
    alert('权限更新失败')
  }
}

onMounted(load)
</script>

<style scoped>
.users { padding: 8px; }
.actions { display: flex; gap: 8px; margin-bottom: 12px; }
.actions input { height: 32px; padding: 0 8px; border: 1px solid #e5e7eb; border-radius: 6px; }
.actions button { height: 34px; padding: 0 12px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.card { background: #fff; border: 1px solid #eee; border-radius: 10px; padding: 12px; box-shadow: 0 4px 16px rgba(0,0,0,.05); }
.row { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
.name { font-weight: 600; }
.username { color: #6b7280; }
.perms { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px; margin-top: 10px; }
.perm { font-size: 13px; color: #374151; }
</style>
