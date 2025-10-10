<template>
  <div class="users container">
    <h2 style="margin:8px 0 16px;">用户管理</h2>
    <div class="actions">
      <el-input v-model.trim="newUser.username" placeholder="用户名" style="width:200px" />
      <el-input v-model.trim="newUser.password" type="password" placeholder="初始密码" style="width:200px" />
      <el-input v-model.trim="newUser.display_name" placeholder="显示名" style="width:200px" />
      <el-button type="primary" :loading="creating" @click="createUser">新增用户</el-button>
    </div>

    <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
      <el-card v-for="u in users" :key="u.id" class="user-card">
        <template #header>
          <div class="row">
            <div>
              <div class="name">{{ u.display_name || u.username }}</div>
              <div class="username">@{{ u.username }}</div>
            </div>
            <div class="ops">
              <el-switch v-model="u.is_active" @change="toggleActive(u)" active-text="启用" />
              <el-button type="warning" size="small" @click="openReset(u)">重置密码</el-button>
              <el-button type="danger" size="small" @click="confirmRemove(u)">删除</el-button>
            </div>
          </div>
        </template>
        <div class="perms" v-if="perms.length">
          <el-tag v-for="p in perms" :key="p.code" :type="userHas(u, p.code) ? 'success' : 'info'" class="perm-tag" @click="togglePerm(u, p.code)">
            {{ p.name }}
          </el-tag>
        </div>
      </el-card>
    </div>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="reset.visible" title="重置密码" width="420px">
      <div style="display:grid;gap:12px;">
        <div>用户：<strong>{{ reset.user?.username }}</strong></div>
        <el-input v-model.trim="reset.password" type="password" placeholder="输入新的初始密码" />
      </div>
      <template #footer>
        <el-button @click="reset.visible=false">取消</el-button>
        <el-button type="warning" :loading="reset.loading" @click="doReset">确定重置</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog v-model="removeDlg.visible" title="删除用户" width="420px">
      <div>确认删除用户 <strong>{{ removeDlg.user?.username }}</strong> ？该操作不可恢复！</div>
      <template #footer>
        <el-button @click="removeDlg.visible=false">取消</el-button>
        <el-button type="danger" :loading="removeDlg.loading" @click="doRemove">确定删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/api'
import { ElMessage } from 'element-plus'

const users = ref([])
const perms = ref([])
const creating = ref(false)
const newUser = ref({ username: '', password: '', display_name: '' })
const reset = ref({ visible: false, user: null, password: '', loading: false })
const removeDlg = ref({ visible: false, user: null, loading: false })

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
    ElMessage.success('用户已创建（首登需改密）')
  } catch (e) {
    ElMessage.error('创建失败：' + (e.message || ''))
  } finally {
    creating.value = false
  }
}

async function toggleActive(u) {
  try {
    await api.users.update(u.id, { is_active: u.is_active })
    ElMessage.success('状态已更新')
  } catch (e) {
    ElMessage.error('更新失败')
  }
}

async function setUserPerm(u, code, on) {
  try {
    const next = on ? Array.from(new Set([...(u._perms || []), code])) : (u._perms || []).filter(x => x !== code)
    await api.users.setPerms(u.id, next)
    u._perms = next
    ElMessage.success('权限已更新')
  } catch (e) {
    ElMessage.error('权限更新失败')
  }
}

function openReset(u) { reset.value = { visible: true, user: u, password: '', loading: false } }
async function doReset() {
  const { user, password } = reset.value
  if (!password) return ElMessage.warning('请输入新初始密码')
  reset.value.loading = true
  try {
    await api.users.resetPassword(user.id, password)
    reset.value.visible = false
    ElMessage.success('已重置，新密码将强制首登改密')
  } catch (e) {
    ElMessage.error('重置失败：' + (e.message || ''))
  } finally {
    reset.value.loading = false
  }
}

function confirmRemove(u) { removeDlg.value = { visible: true, user: u, loading: false } }
async function doRemove() {
  const { user } = removeDlg.value
  removeDlg.value.loading = true
  try {
    await api.users.remove(user.id)
    users.value = users.value.filter(x => x.id !== user.id)
    removeDlg.value.visible = false
    ElMessage.success('用户已删除')
  } catch (e) {
    ElMessage.error('删除失败：' + (e.message || ''))
  } finally {
    removeDlg.value.loading = false
  }
}

function togglePerm(u, code) {
  const has = userHas(u, code)
  setUserPerm(u, code, !has)
}

onMounted(load)
</script>

<style scoped>
.users { padding: 8px; }
.actions { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }
.actions input { height: 34px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.user-card { padding: 12px; }
.row { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
.name { font-weight: 600; }
.username { color: #6b7280; }
.perms { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.perm-tag { cursor: pointer; }
.ops { display: flex; gap: 8px; align-items: center; }
.toggle { display: inline-flex; align-items: center; gap: 6px; }
</style>
