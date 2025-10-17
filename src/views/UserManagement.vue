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
          <div class="head">
            <div class="avatar" :class="{ admin: u.is_admin }">{{ initials(u) }}</div>
            <div class="info">
              <div class="name">
                {{ u.display_name || u.username }}
                <el-tag v-if="u.is_admin" type="danger" size="small">ADMIN</el-tag>
                <span class="status" :class="{ online: !!u.online }">
                  <span class="dot"></span>
                  {{ u.online ? 'Online' : 'Offline' }}
                </span>
              </div>
              <div class="username">@{{ u.username }}</div>
              <div class="meta">
                <span v-if="u.last_ip" class="kv"><span class="k">IP</span><span class="v">{{ u.last_ip }}</span></span>
                <span v-if="u.last_seen" class="kv"><span class="k">TIME</span><span class="v">{{ fmtMinute(u.last_seen) }}</span></span>
                <span v-if="Array.isArray(u._perms)" class="kv"><span class="k">PERMS</span><span class="v">{{ u._perms.length }}</span></span>
              </div>
            </div>
            <div class="controls">
              <div class="active-wrap">
                <el-switch
                  v-model="u.is_active"
                  @change="toggleActive(u)"
                  inline-prompt
                  :active-icon="Check"
                  :inactive-icon="Close"
                />
                <span class="muted">{{ t('users.active') }}</span>
              </div>
              <el-button type="primary" plain size="small" @click="openPermDrawer(u)">{{ t('users.assignPerms') || '分配权限' }}</el-button>
            </div>
          </div>
        </template>

        <div class="foot-actions">
          <el-button size="small" text :loading="logState.loading[u.id]" @click="openLogDrawer(u)">{{ t('users.activityLog') }}</el-button>
          <div class="spacer"></div>
          <el-button size="small" text type="warning" @click="openReset(u)">{{ $t('common.reset') }}</el-button>
          <el-button size="small" text type="danger" @click="confirmRemove(u)">{{ $t('common.delete') }}</el-button>
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

    <!-- 权限分配抽屉 -->
    <el-drawer v-model="permDrawer.visible" :title="(permDrawer.user?.display_name || permDrawer.user?.username || '') + ' · ' + (t('users.assignPerms') || '分配权限')" size="min(760px, 88vw)" :close-on-click-modal="false">
      <div v-if="permDrawer.user" class="drawer-body">
        <div class="drawer-toolbar">
          <el-tag v-if="permDrawer.user.is_admin" type="danger" size="small">管理员拥有全部权限（不可更改）</el-tag>
          <div class="spacer"></div>
          <el-button size="small" @click="expandAll(true)">{{ t('users.expandAll') || '展开全部' }}</el-button>
          <el-button size="small" @click="expandAll(false)">{{ t('users.collapseAll') || '收起全部' }}</el-button>
        </div>
        <div class="drawer-perms" v-if="permTree && permTree.length">
          <div class="perm-group" v-for="group in permTree" :key="group.module">
            <div class="perm-group-title">{{ group.name }}</div>
            <div class="perm-group-items">
              <el-button size="small" plain @click.stop="toggleDrawerGroup(group.module)">
                {{ group.name }} {{ isDrawerOpen(group.module) ? '▼' : '▶' }}
              </el-button>
              <div class="inline-perms" v-show="isDrawerOpen(group.module)">
                <div class="group-batch">
                  <el-button size="small" type="success" plain :disabled="permDrawer.user.is_admin" @click="selectGroup(group)">{{ t('users.selectAllInGroup') || '本组全选' }}</el-button>
                  <el-button size="small" type="warning" plain :disabled="permDrawer.user.is_admin" @click="unselectGroup(group)">{{ t('users.unselectAllInGroup') || '本组全不选' }}</el-button>
                </div>
                <el-tag
                  v-for="p in group.items"
                  :key="p.code"
                  :type="drawerHas(p.code) ? 'success' : 'info'"
                  class="perm-tag"
                  effect="light"
                  size="small"
                  :disable-transitions="true"
                  :class="{ 'is-disabled': permDrawer.user.is_admin }"
                  @click="drawerToggle(p.code)"
                >
                  {{ p.name }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <el-button @click="permDrawer.visible=false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :disabled="permDrawer.user?.is_admin" :loading="permDrawer.saving" @click="savePerms">{{ t('users.savePerms') || t('common.save') }}</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 活动日志抽屉 -->
    <el-drawer v-model="logDrawer.visible" :title="(logDrawer.user?.display_name || logDrawer.user?.username || '') + ' · ' + (t('users.activityLog') || '活动日志')" size="min(720px, 92vw)" :close-on-click-modal="true">
      <div v-if="logDrawer.user">
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
          <el-button size="small" :loading="logState.loading[logDrawer.user.id]" @click="refreshLogs(logDrawer.user)">{{ t('common.refresh') }}</el-button>
        </div>
        <ul class="log-list">
          <li v-if="(logs[logDrawer.user.id]||[]).length===0" class="log-empty">{{ t('common.noData') }}</li>
          <li v-for="(it,idx) in (logs[logDrawer.user.id]||[])" :key="idx" class="log-item">
            <span class="time">{{ fmtMinute(it.ts) }}</span>
            <span class="ip">{{ it.ip }}</span>
            <span class="action">{{ it.action || '' }}</span>
          </li>
        </ul>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/api'
import { ElMessage } from 'element-plus'
import { Check, Close } from '@element-plus/icons-vue'

const { t } = useI18n()

const users = ref([])
const perms = ref([]) // 后端完整清单（直接用于校验去重或显示 meta）
const permTree = ref(null) // 新的权限树（分组展示）
const popVisible = ref({}) // 兼容旧逻辑（不再使用）
const openGroups = ref({}) // { `${userId}-${module}`: boolean }
const extraPerms = ref([]) // 兼容逻辑已移除，保留变量但不使用
const creating = ref(false)
const newUser = ref({ username: '', password: '', display_name: '' })
const reset = ref({ visible: false, user: null, password: '', loading: false })
const removeDlg = ref({ visible: false, user: null, loading: false })
const reseed = ref({ loading: false })
const permDrawer = ref({ visible: false, user: null, localPerms: [], saving: false, open: {} })
// 日志数据与展开状态
const logs = ref({}) // { [userId]: Array<{ ts, ip, action, meta }> }
const logState = ref({ loading: {} })
const logDrawer = ref({ visible: false, user: null })

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

  // 默认展开非管理员用户的所有权限分组，避免“无法展开/点击”导致看不到可点标签
  try {
    const tree = Array.isArray(permTree.value) ? permTree.value : []
    for (const u of users.value) {
      if (u && !u.is_admin) {
        for (const g of tree) {
          if (g && g.module) {
            openGroups.value[keyFor(u.id, g.module)] = true
          }
        }
      }
    }
  } catch {}
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

// 下弹式选择后收回：切换权限并收起弹层
function onPickPerm(u, code) {
  if (u.is_admin) return
  const has = userHas(u, code)
  setUserPerm(u, code, !has)
}

function keyFor(uid, mod) { return `${uid}-${mod}` }
function isOpen(uid, mod) { return !!openGroups.value[keyFor(uid, mod)] }
function toggleGroup(uid, mod) { const k = keyFor(uid, mod); openGroups.value[k] = !openGroups.value[k] }

// 抽屉：打开/关闭与本地编辑
function openPermDrawer(u) {
  permDrawer.value.visible = true
  permDrawer.value.user = u
  permDrawer.value.localPerms = Array.isArray(u._perms) ? [...u._perms] : []
  // 默认展开所有分组（非管理员更友好）
  const map = {}
  ;(permTree.value || []).forEach(g => { if (g?.module) map[g.module] = true })
  permDrawer.value.open = map
}
function drawerHas(code) {
  return permDrawer.value.localPerms.includes(code)
}
function drawerToggle(code) {
  if (!permDrawer.value.user || permDrawer.value.user.is_admin) return
  const arr = new Set(permDrawer.value.localPerms)
  if (arr.has(code)) arr.delete(code); else arr.add(code)
  permDrawer.value.localPerms = Array.from(arr)
}
function toggleDrawerGroup(mod) {
  const v = permDrawer.value.open || {}
  v[mod] = !v[mod]
  permDrawer.value.open = { ...v }
}
function isDrawerOpen(mod) { return !!(permDrawer.value.open || {})[mod] }
function expandAll(open=true) {
  const v = {}
  ;(permTree.value || []).forEach(g => { if (g?.module) v[g.module] = !!open })
  permDrawer.value.open = v
}
async function savePerms() {
  const u = permDrawer.value.user
  if (!u || u.is_admin) return
  permDrawer.value.saving = true
  try {
    await api.users.setPerms(u.id, permDrawer.value.localPerms)
    u._perms = [...permDrawer.value.localPerms]
    ElMessage.success(t('users.permsUpdated'))
    permDrawer.value.visible = false
  } catch (e) {
    ElMessage.error(t('users.permsUpdateFailed'))
  } finally {
    permDrawer.value.saving = false
  }
}

// 本组一键全选/全不选
function selectGroup(group) {
  if (!group || !Array.isArray(group.items)) return
  if (!permDrawer.value.user || permDrawer.value.user.is_admin) return
  const set = new Set(permDrawer.value.localPerms)
  for (const it of group.items) set.add(it.code)
  permDrawer.value.localPerms = Array.from(set)
}
function unselectGroup(group) {
  if (!group || !Array.isArray(group.items)) return
  if (!permDrawer.value.user || permDrawer.value.user.is_admin) return
  const del = new Set(group.items.map(it => it.code))
  permDrawer.value.localPerms = permDrawer.value.localPerms.filter(c => !del.has(c))
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

async function refreshLogs(u) {
  if (!u?.id) return
  logState.value.loading[u.id] = true
  try {
    const rows = await api.users.sessions(u.id)
    logs.value[u.id] = rows || []
  } catch (e) {
    ElMessage.error(t('users.loadLogFailed') || '加载日志失败')
  } finally {
    logState.value.loading[u.id] = false
  }
}
function openLogDrawer(u) {
  logDrawer.value = { visible: true, user: u }
  refreshLogs(u)
}

// 头像字母（显示名/用户名首字母缩写）
function initials(u) {
  const s = (u?.display_name || u?.username || '').trim()
  if (!s) return '?'
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return s.slice(0, 2).toUpperCase()
}

// 将时间格式化为 "YYYY-MM-DD HH:mm"（到分钟）
function fmtMinute(ts) {
  try {
    const d = ts ? new Date(ts) : new Date()
    if (isNaN(d.getTime())) return ''
    const pad = (n) => (n < 10 ? '0' + n : '' + n)
    const y = d.getFullYear()
    const m = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const hh = pad(d.getHours())
    const mm = pad(d.getMinutes())
    return `${y}-${m}-${day} ${hh}:${mm}`
  } catch { return '' }
}
</script>

<style scoped>
.users { padding: 0; }
.page-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.title { font-size: 18px; font-weight: 600; }
.spacer { flex: 1; }
.actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.cards { grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); }
.user-card { padding: 0; }
.head { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; }
.avatar { width: 40px; height: 40px; border-radius: 8px; display:flex; align-items:center; justify-content:center; font-weight:700; color:white; background: var(--el-color-primary); box-shadow: inset 0 0 0 1px color-mix(in oklab, #000 10%, transparent); }
.avatar.admin { background: var(--el-color-danger); }
.info { min-width: 0; }
.name { font-weight: 600; font-size: 15px; }
.username { color: var(--el-text-color-secondary); font-size: 12px; }
.meta { color: var(--el-text-color-secondary); font-size: 12px; display:flex; gap:12px; flex-wrap:wrap; margin-top:2px; }
.meta .kv { display:inline-flex; gap:6px; align-items:center; }
.meta .kv .k { font-weight:600; opacity:0.75; }
.meta .kv .v { font-variant-numeric: tabular-nums; }
.controls { display:flex; align-items:center; gap: 8px; }
.status { margin-left: 8px; font-size: 12px; color: var(--el-text-color-secondary); display: inline-flex; align-items: center; gap: 6px; }
.status .dot { width: 8px; height: 8px; border-radius: 50%; background: #d1d5db; display: inline-block; }
.status.online { color: var(--el-color-success); }
.status.online .dot { background: var(--el-color-success); box-shadow: 0 0 0 2px color-mix(in oklab, var(--el-color-success) 40%, transparent); }
.perms { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.perm-tag { cursor: pointer; user-select: none; }
.perm-tag.is-disabled { cursor: not-allowed; opacity: 0.7; }
.ops { display: flex; gap: 8px; align-items: center; }
.active-wrap { display:flex; align-items:center; gap:6px; white-space:nowrap; }
.active-wrap .muted { font-size:12px; color: var(--el-text-color-secondary); }
.perm-group { display: grid; gap: 6px; margin: 6px 0 10px; }
.perm-group-title { font-weight: 600; font-size: 13px; color: var(--el-text-color-primary); }
.perm-group-items { display: flex; flex-wrap: wrap; gap: 8px; }
.popover-perms { display: flex; flex-wrap: wrap; gap: 8px; max-width: 320px; }
.popover-perms { display: flex; flex-wrap: wrap; gap: 8px; max-width: 320px; }
.inline-perms { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.admin-tip { color: var(--el-color-danger); font-size: 12px; margin: 4px 0 8px; }
.group-batch { display:flex; gap:8px; margin: 0 0 8px; flex-wrap: wrap; }
/* 日志样式 */
.foot-actions { margin-top: 2px; display:flex; align-items:center; gap:8px; }
.log-list { list-style:none; padding:0; margin:6px 0 0; display:grid; gap:6px; }
.log-item { display:grid; grid-template-columns: 180px 150px 1fr; gap:8px; font-size:12px; color: var(--el-text-color-regular); }
.log-item .time { color: var(--el-text-color-secondary); }
.log-item .ip { font-variant-numeric: tabular-nums; }
.log-item .action { color: var(--el-text-color-secondary); }
.log-empty { font-size:12px; color: var(--el-text-color-secondary); padding:4px 0; }
</style>
