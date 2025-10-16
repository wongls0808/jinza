<template>
  <div class="users container">
    <div class="page-head">
  <div class="title">{{ $t('home.users') }}</div>
      <div class="spacer"></div>
      <!-- 移除了返回首页按钮 -->
      <div class="actions">
        <el-input v-model.trim="newUser.username" :placeholder="$t('users.usernamePlaceholder')" style="width:180px" size="small" />
        <el-input v-model.trim="newUser.password" type="password" :placeholder="$t('users.passwordPlaceholder')" style="width:180px" size="small" />
        <el-input v-model.trim="newUser.display_name" :placeholder="$t('users.displayNamePlaceholder')" style="width:180px" size="small" />
  <el-button type="primary" :loading="creating" size="small" @click="createUser">{{ $t('common.add') }}</el-button>
        <el-button type="warning" plain size="small" :loading="reseed.loading" @click="doReseed">{{ $t('users.reseedPermTree') }}</el-button>
      </div>
    </div>

    <div class="grid cards">
      <el-card v-for="u in users" :key="u.id" class="user-card card">
        <template #header>
          <div class="row">
            <div>
              <div class="name">{{ u.display_name || u.username }} <el-tag v-if="u.is_admin" type="danger" size="small">ADMIN</el-tag></div>
              <div class="username">@{{ u.username }}</div>
            </div>
            <div class="ops">
              <el-switch v-model="u.is_active" @change="toggleActive(u)" :active-text="$t('users.active')" />
              <el-button type="warning" size="small" @click="openReset(u)">{{ $t('common.reset') }}</el-button>
              <el-button type="danger" size="small" @click="confirmRemove(u)">{{ $t('common.delete') }}</el-button>
            </div>
          </div>
        </template>
        <div class="perms" v-if="permTree && permTree.length">
          <div class="perm-group" v-for="group in permTree" :key="group.module">
            <div class="perm-group-title">{{ group.name }}</div>
            <div class="perm-group-items">
              <el-tag
                v-for="p in group.items"
                :key="p.code"
                :type="userHas(u, p.code) ? 'success' : 'info'"
                class="perm-tag"
                effect="light"
                size="small"
                :disable-transitions="true"
                :class="{ 'is-disabled': u.is_admin }"
                @click="!u.is_admin && togglePerm(u, p.code)"
              >
                {{ p.name }}
              </el-tag>
            </div>
          </div>
        </div>
        
      </el-card>
    </div>

    <!-- 重置密码对话框 -->
  <el-dialog v-model="reset.visible" :title="$t('common.reset')" width="420px">
      <div style="display:grid;gap:12px;">
        <div>{{ $t('users.userLabelWithValue', { username: reset.user?.username }) }}</div>
        <el-input v-model.trim="reset.password" type="password" :placeholder="$t('users.resetNewPasswordPlaceholder')" />
      </div>
      <template #footer>
  <el-button @click="reset.visible=false">{{ $t('common.cancel') }}</el-button>
  <el-button type="warning" :loading="reset.loading" @click="doReset">{{ $t('common.ok') }}</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog v-model="removeDlg.visible" :title="$t('common.delete')" width="420px">
      <div>{{ $t('common.confirmDelete') }} <strong>{{ removeDlg.user?.username }}</strong></div>
      <template #footer>
        <el-button @click="removeDlg.visible=false">{{ $t('common.cancel') }}</el-button>
        <el-button type="danger" :loading="removeDlg.loading" @click="doRemove">{{ $t('common.delete') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/api'
import { ElMessage } from 'element-plus'

const { t } = useI18n()

const users = ref([])
const perms = ref([]) // 后端完整清单（直接用于校验去重或显示 meta）
const permTree = ref(null) // 新的权限树（分组展示）
const extraPerms = ref([]) // 兼容逻辑已移除，保留变量但不使用
const creating = ref(false)
const newUser = ref({ username: '', password: '', display_name: '' })
const reset = ref({ visible: false, user: null, password: '', loading: false })
const removeDlg = ref({ visible: false, user: null, loading: false })
const reseed = ref({ loading: false })

function userHas(u, code) {
  return (u._perms || []).includes(code)
}

async function load() {
  const [us, ps, pt] = await Promise.all([
    api.users.list(),
    api.perms.list().catch(() => []),
    api.perms.tree().then(r => r?.tree).catch(() => null)
  ])
  // attach perms to each user
  const withPerms = await Promise.all(us.map(async (u) => {
    const up = await api.users.getPerms(u.id)
    return { ...u, _perms: up }
  }))
  users.value = withPerms
  perms.value = ps
  permTree.value = pt
  // 兼容逻辑移除：权限仅以权限树为准
  extraPerms.value = []
}

async function createUser() {
  if (!newUser.value.username || !newUser.value.password) return alert(t('users.fillUsernamePassword'))
  creating.value = true
  try {
    await api.users.create(newUser.value)
    newUser.value = { username: '', password: '', display_name: '' }
    await load()
    ElMessage.success(t('users.createdNeedChangePassword'))
  } catch (e) {
    ElMessage.error(t('users.createFailed') + '：' + (e.message || ''))
  } finally {
    creating.value = false
  }
}

async function toggleActive(u) {
  try {
    await api.users.update(u.id, { is_active: u.is_active })
    ElMessage.success(t('users.statusUpdated'))
  } catch (e) {
    ElMessage.error(t('users.updateFailed'))
  }
}

async function setUserPerm(u, code, on) {
  try {
    const next = on ? Array.from(new Set([...(u._perms || []), code])) : (u._perms || []).filter(x => x !== code)
    await api.users.setPerms(u.id, next)
    u._perms = next
    ElMessage.success(t('users.permsUpdated'))
  } catch (e) {
    ElMessage.error(t('users.permsUpdateFailed'))
  }
}

function openReset(u) { reset.value = { visible: true, user: u, password: '', loading: false } }
async function doReset() {
  const { user, password } = reset.value
  if (!password) return ElMessage.warning(t('users.enterNewInitialPassword'))
  reset.value.loading = true
  try {
    await api.users.resetPassword(user.id, password)
    reset.value.visible = false
    ElMessage.success(t('users.resetSuccessForceChangeOnFirstLogin'))
  } catch (e) {
    ElMessage.error(t('users.resetFailed') + '：' + (e.message || ''))
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
    ElMessage.success(t('users.userDeleted'))
  } catch (e) {
    ElMessage.error(t('users.deleteFailed') + '：' + (e.message || ''))
  } finally {
    removeDlg.value.loading = false
  }
}

function togglePerm(u, code) {
  const has = userHas(u, code)
  setUserPerm(u, code, !has)
}

async function doReseed() {
  reseed.value.loading = true
  try {
    const r = await api.perms.reseed(false)
    await load()
    ElMessage.success(t('users.reseedSuccess', { total: r.total }))
  } catch (e) {
    ElMessage.error(t('users.reseedFailed') + '：' + (e.message || ''))
  } finally {
    reseed.value.loading = false
  }
}

onMounted(load)
</script>

<style scoped>
.users { padding: 0; }
.page-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.title { font-size: 18px; font-weight: 600; }
.spacer { flex: 1; }
.actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.cards { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
.user-card { padding: 0; }
.row { display: flex; align-items: center; gap: 12px; justify-content: space-between; }
.name { font-weight: 600; font-size: 15px; }
.username { color: var(--el-text-color-secondary); font-size: 12px; }
.perms { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.perm-tag { cursor: pointer; user-select: none; }
.perm-tag.is-disabled { cursor: not-allowed; opacity: 0.7; }
.ops { display: flex; gap: 8px; align-items: center; }
.perm-group { display: grid; gap: 6px; margin: 6px 0 10px; }
.perm-group-title { font-weight: 600; font-size: 13px; color: var(--el-text-color-primary); }
.perm-group-items { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
