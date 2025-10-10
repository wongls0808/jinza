<template>
  <div class="users">
    <h2>用户管理</h2>
    <div class="actions">
      <input v-model.trim="newUser.username" placeholder="用户名" />
      <input v-model.trim="newUser.password" placeholder="初始密码" type="password" />
      <input v-model.trim="newUser.display_name" placeholder="显示名" />
      <button class="btn primary" @click="createUser" :disabled="creating">新增用户</button>
    </div>

    <div class="grid">
      <div class="card user-card" v-for="u in users" :key="u.id">
        <div class="row">
          <div class="name">{{ u.display_name || u.username }}</div>
          <div class="username">@{{ u.username }}</div>
          <div class="ops">
            <label class="toggle">
              <input type="checkbox" v-model="u.is_active" @change="toggleActive(u)" /> 启用
            </label>
            <button class="btn warn" @click="promptReset(u)">重置密码</button>
            <button class="btn danger" @click="removeUser(u)">删除</button>
          </div>
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

async function promptReset(u) {
  const pwd = prompt(`为用户 ${u.username} 设置新的初始密码：`)
  if (!pwd) return
  try {
    await api.users.resetPassword(u.id, pwd)
    alert('已重置。用户下次登录需强制修改新密码。')
  } catch (e) {
    alert('重置失败：' + (e.message || ''))
  }
}

async function removeUser(u) {
  if (!confirm(`确认删除用户 ${u.username} ？该操作不可恢复！`)) return
  try {
    await api.users.remove(u.id)
    users.value = users.value.filter(x => x.id !== u.id)
  } catch (e) {
    alert('删除失败：' + (e.message || ''))
  }
}

onMounted(load)
</script>

<style scoped>
.users { padding: 8px; }
.actions { display: flex; gap: 8px; margin-bottom: 12px; }
.actions input { height: 34px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.user-card { padding: 12px; }
.row { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
.name { font-weight: 600; }
.username { color: #6b7280; }
.perms { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px; margin-top: 10px; }
.perm { font-size: 13px; color: #374151; }
.ops { display: flex; gap: 8px; align-items: center; }
.toggle { display: inline-flex; align-items: center; gap: 6px; }
</style>
