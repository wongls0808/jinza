<template>
  <div class="users container">
    <!-- 页面头部 -->
    <div class="page-head">
      <div class="title">{{ $t('home.users') }}</div>
      <div class="spacer"></div>
      <el-button type="warning" plain size="small" :loading="reseed.loading" @click="doReseed">
        {{ $t('users.reseedPermTree') }}
      </el-button>
    </div>

    <!-- 新增用户表单 -->
    <el-card class="add-user-card" shadow="never">
      <div class="add-user-form">
        <div class="form-label">{{ $t('common.add') }}</div>
        <el-input 
          v-model.trim="newUser.username" 
          :placeholder="$t('users.usernamePlaceholder')" 
          style="width: 200px;" 
          size="small" 
        />
        <el-input 
          v-model.trim="newUser.password" 
          type="password" 
          :placeholder="$t('users.passwordPlaceholder')" 
          style="width: 200px;" 
          size="small" 
        />
        <el-input 
          v-model.trim="newUser.display_name" 
          :placeholder="$t('users.displayNamePlaceholder')" 
          style="width: 200px;" 
          size="small" 
        />
        <el-button type="primary" :loading="creating" size="small" @click="createUser">
          {{ $t('common.add') }}
        </el-button>
      </div>
    </el-card>

    <!-- 用户卡片列表 -->
    <div class="grid cards">
      <el-card v-for="u in users" :key="u.id" class="user-card card">
        <template #header>
          <div class="card-header">
            <!-- 左侧：头像和信息 -->
            <div class="user-info-section">
              <div class="avatar" :class="{ admin: u.is_admin }">{{ initials(u) }}</div>
              <div class="info">
                <div class="name-row">
                  <span class="name">{{ u.display_name || u.username }}</span>
                  <el-tag v-if="u.is_admin" type="danger" size="small" class="admin-badge">ADMIN</el-tag>
                </div>
                <div class="username">@{{ u.username }}</div>
                <div class="meta">
                  <span v-if="u.last_ip" class="kv">
                    <span class="k">IP</span>
                    <span class="v">{{ u.last_ip }}</span>
                  </span>
                  <span v-if="u.last_seen" class="kv">
                    <span class="k">TIME</span>
                    <span class="v">{{ fmtMinute(u.last_seen) }}</span>
                  </span>
                  <span v-if="Array.isArray(u._perms)" class="kv">
                    <span class="k">PERMS</span>
                    <span class="v">{{ u._perms.length }}</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- 右侧：状态和操作 -->
            <div class="actions-section">
              <div class="status-row">
                <span class="status" :class="{ online: !!u.online }">
                  <span class="dot"></span>
                  <span class="status-text">{{ u.online ? 'Online' : 'Offline' }}</span>
                </span>
                <el-switch
                  v-model="u.is_active"
                  @change="toggleActive(u)"
                  inline-prompt
                  size="small"
                  :active-icon="Check"
                  :inactive-icon="Close"
                />
              </div>
              <el-button 
                type="primary" 
                plain 
                size="small" 
                @click="openPermDrawer(u)"
                style="width: 140px;"
              >
                {{ t('users.assignPerms') }}
              </el-button>
            </div>
          </div>
        </template>

        <!-- 卡片底部操作 -->
        <div class="card-footer">
          <el-button size="small" text :loading="logState.loading[u.id]" @click="openLogDrawer(u)">
            {{ t('users.activityLog') }}
          </el-button>
          <div class="spacer"></div>
          <el-button size="small" text type="warning" @click="openReset(u)">
            {{ $t('common.reset') }}
          </el-button>
          <el-button size="small" text type="danger" @click="confirmRemove(u)">
            {{ $t('common.delete') }}
          </el-button>
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
    <el-drawer v-model="permDrawer.visible" :title="(permDrawer.user?.display_name || permDrawer.user?.username || '') + ' · ' + t('users.assignPerms')" size="min(760px, 88vw)" :close-on-click-modal="false">
      <div v-if="permDrawer.user" class="drawer-body">
        <div class="drawer-toolbar">
          <el-tag v-if="permDrawer.user.is_admin" type="danger" size="small">{{ t('users.adminAllPermsNotice') || '管理员拥有全部权限（不可更改）' }}</el-tag>
          <div class="spacer"></div>
          <el-button size="small" @click="expandAll(true)">{{ t('users.expandAll') }}</el-button>
          <el-button size="small" @click="expandAll(false)">{{ t('users.collapseAll') }}</el-button>
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
                  <el-button size="small" type="success" plain :disabled="permDrawer.user.is_admin" @click="selectGroup(group)">{{ t('users.selectAllInGroup') }}</el-button>
                  <el-button size="small" type="warning" plain :disabled="permDrawer.user.is_admin" @click="unselectGroup(group)">{{ t('users.unselectAllInGroup') }}</el-button>
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
    <el-drawer 
      v-model="logDrawer.visible" 
      :title="(logDrawer.user?.display_name || logDrawer.user?.username || '') + ' · ' + t('users.activityLog')" 
      size="min(800px, 92vw)" 
      :close-on-click-modal="true"
    >
      <div v-if="logDrawer.user" class="activity-log-container">
        <!-- 工具栏 -->
        <div class="log-toolbar">
          <el-button 
            size="small" 
            :loading="logState.loading[logDrawer.user.id]" 
            @click="refreshLogs(logDrawer.user)"
          >
            {{ t('common.refresh') }}
          </el-button>
          <el-select 
            v-model="logFilter" 
            size="small" 
            placeholder="筛选类型" 
            clearable 
            style="width: 160px;"
          >
            <el-option label="全部" value="" />
            <el-option label="认证" value="auth" />
            <el-option label="用户管理" value="user" />
            <el-option label="客户管理" value="customer" />
            <el-option label="银行管理" value="bank" />
            <el-option label="交易管理" value="transaction" />
            <el-option label="外汇管理" value="fx" />
            <el-option label="费用管理" value="expense" />
            <el-option label="系统" value="system" />
          </el-select>
        </div>

        <!-- 时间线列表 -->
        <div class="activity-timeline">
          <div v-if="filteredLogs.length === 0" class="log-empty">
            {{ t('common.noData') }}
          </div>
          
          <div 
            v-for="(activity, idx) in filteredLogs" 
            :key="idx" 
            class="activity-item"
            :class="`activity-${getActivityCategory(activity)}`"
          >
            <!-- 时间线节点 -->
            <div class="activity-timeline-node">
              <div class="node-icon" :class="`icon-${getActivityCategory(activity)}`">
                <component :is="getActivityIcon(activity)" />
              </div>
              <div class="node-line" v-if="idx < filteredLogs.length - 1"></div>
            </div>

            <!-- 活动内容 -->
            <div class="activity-content">
              <div class="activity-header">
                <span class="activity-action">{{ getActivityText(activity) }}</span>
                <span class="activity-time">{{ formatRelativeTime(activity.ts) }}</span>
              </div>
              
              <div class="activity-meta" v-if="activity.meta || activity.ip">
                <div class="meta-item" v-if="activity.ip">
                  <el-icon><LocationInformation /></el-icon>
                  <span>{{ activity.ip }}</span>
                </div>
                <div class="meta-item" v-if="activity.meta && activity.meta.target">
                  <el-icon><Link /></el-icon>
                  <span>{{ t('users.activityDetails.target') }}: {{ activity.meta.target }}</span>
                </div>
                <div class="meta-item" v-if="activity.meta && activity.meta.count">
                  <el-icon><DataLine /></el-icon>
                  <span>{{ t('users.activityDetails.count') }}: {{ activity.meta.count }}</span>
                </div>
                <!-- Transactions details enrichment -->
                <template v-if="activity.action && activity.action.startsWith('transactions.') && activity.meta">
                  <div class="meta-item" v-if="activity.meta.id">
                    <el-icon><Link /></el-icon>
                    <span>ID: {{ activity.meta.id }}</span>
                  </div>
                  <div class="meta-item" v-if="activity.meta.account_number">
                    <el-icon><Link /></el-icon>
                    <span>A/C: {{ activity.meta.account_number }}</span>
                  </div>
                  <div class="meta-item" v-if="activity.meta.transaction_date || activity.meta.trn_date">
                    <el-icon><Link /></el-icon>
                    <span>{{ activity.meta.transaction_date || activity.meta.trn_date }}</span>
                  </div>
                  <div class="meta-item" v-if="activity.meta.debit != null">
                    <el-icon><DataLine /></el-icon>
                    <span>借: {{ Number(activity.meta.debit).toFixed(2) }}</span>
                  </div>
                  <div class="meta-item" v-if="activity.meta.credit != null">
                    <el-icon><DataLine /></el-icon>
                    <span>贷: {{ Number(activity.meta.credit).toFixed(2) }}</span>
                  </div>
                  <!-- Match/Unmatch details -->
                  <div class="meta-item" v-if="activity.action === 'transactions.match' && (activity.meta.type || activity.meta.target_id)">
                    <el-icon><Link /></el-icon>
                    <span>匹配: {{ activity.meta.type }} → {{ activity.meta.target_name || activity.meta.target_id }}</span>
                  </div>
                  <div class="meta-item" v-if="activity.action === 'transactions.unmatch' && (activity.meta.prev_type || activity.meta.prev_target_id)">
                    <el-icon><Link /></el-icon>
                    <span>原关联: {{ activity.meta.prev_type }} → {{ activity.meta.prev_target_id }}</span>
                  </div>
                  <!-- Import/Export summary -->
                  <div class="meta-item" v-if="activity.action === 'transactions.import'">
                    <el-icon><Upload /></el-icon>
                    <span>导入: {{ activity.meta.inserted || 0 }} / 跳过: {{ activity.meta.skipped || 0 }} / 失败: {{ activity.meta.failed || 0 }}</span>
                  </div>
                  <div class="meta-item" v-if="activity.action === 'transactions.export' && activity.meta.count != null">
                    <el-icon><Download /></el-icon>
                    <span>导出: {{ activity.meta.count }}</span>
                  </div>
                  <div class="meta-item" v-if="activity.action === 'transactions.delete' && Array.isArray(activity.meta.ids)">
                    <el-icon><Delete /></el-icon>
                    <span>批量删除: {{ activity.meta.ids.slice(0,5).join(', ') }}<span v-if="activity.meta.ids.length>5"> 等{{ activity.meta.ids.length }}条</span></span>
                  </div>
                </template>
              </div>

              <div class="activity-timestamp">{{ fmtMinute(activity.ts) }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/api'
import { ElMessage } from 'element-plus'

// 使用 shallowRef 避免深度响应式导致的循环依赖
import { 
  Check, 
  Close, 
  User, 
  UserFilled,
  Lock,
  Key,
  DocumentAdd,
  Edit,
  Delete,
  Upload,
  Download,
  Setting,
  LocationInformation,
  Link,
  DataLine,
  Connection,
  Wallet,
  Money,
  Coin,
  TrendCharts
} from '@element-plus/icons-vue'

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
    // 将后端 last_seen 规范化为 ts，避免渲染缺省为“当前时间”
    const mapped = Array.isArray(rows) ? rows.map(r => ({ ...r, ts: r?.last_seen ?? r?.ts ?? null })) : []
    logs.value[u.id] = mapped
  } catch (e) {
    ElMessage.error(t('users.loadLogFailed'))
  } finally {
    logState.value.loading[u.id] = false
  }
}
function openLogDrawer(u) {
  logDrawer.value = { visible: true, user: u }
  refreshLogs(u)
}

// 活动日志过滤
const logFilter = ref('')
const filteredLogs = computed(() => {
  const userId = logDrawer.value.user?.id
  if (!userId) return []
  const allLogs = logs.value[userId] || []
  if (!logFilter.value) return allLogs
  return allLogs.filter(log => getActivityCategory(log) === logFilter.value)
})

// 获取活动类别
function getActivityCategory(activity) {
  const action = activity.action || activity.kind || ''
  if (action === 'session' || action === 'login' || action === 'logout') return 'auth'
  if (action.startsWith('users.') || action.startsWith('permissions.')) return 'user'
  if (action.startsWith('customers.')) return 'customer'
  if (action.startsWith('banks.') || action.startsWith('accounts.')) return 'bank'
  if (action.startsWith('transactions.')) return 'transaction'
  if (action.startsWith('fx.')) return 'fx'
  if (action.startsWith('expenses.')) return 'expense'
  return 'system'
}

// 获取活动图标
function getActivityIcon(activity) {
  const action = activity.action || ''
  if (action === 'login') return Connection
  if (action === 'logout') return Connection
  if (action === 'session') return User
  if (action.includes('create')) return DocumentAdd
  if (action.includes('update')) return Edit
  if (action.includes('delete')) return Delete
  if (action.includes('import')) return Upload
  if (action.includes('export')) return Download
  if (action.includes('password')) return Lock
  if (action.includes('permissions')) return Key
  if (action.startsWith('fx.')) return Money
  if (action.startsWith('transactions.')) return Wallet
  return Setting
}

// 获取活动文本
function getActivityText(activity) {
  const action = activity.action || activity.kind || ''
  if (action === 'session') return t('users.activityTypes.session')
  // 尝试获取翻译,如果没有则返回原文
  const translationKey = `users.activityTypes.${action}`
  const translated = t(translationKey)
  // 如果翻译和key相同,说明没有找到翻译,返回原action
  return translated === translationKey ? action : translated
}

// 格式化相对时间
function formatRelativeTime(timestamp) {
  if (!timestamp) return ''
  const now = new Date()
  const past = new Date(timestamp)
  const diffMs = now - past
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return fmtMinute(timestamp)
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
    if (!ts) return ''
    const d = new Date(ts)
    if (isNaN(d.getTime())) return ''
    const pad = (n) => (n < 10 ? '0' + n : '' + n)
    const y = d.getFullYear()
    const m = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const hh = pad(d.getHours())
    const mm = pad(d.getMinutes())
    const ss = pad(d.getSeconds())
    // 提升显示精度到秒
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`
  } catch { return '' }
}
</script>

<style scoped>
.users { padding: 0; }

/* 页面头部 */
.page-head { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  margin-bottom: 16px; 
}
.title { 
  font-size: 18px; 
  font-weight: 600; 
}
.spacer { 
  flex: 1; 
}

/* 新增用户表单卡片 */
.add-user-card {
  margin-bottom: 16px;
  background: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-border-color);
}
.add-user-form {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  min-width: 60px;
}

/* 用户卡片网格 */
.cards { 
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr)); 
  gap: 16px;
}
.user-card { 
  transition: all 0.2s;
}
.user-card:hover {
  box-shadow: var(--el-box-shadow-light);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 4px 0;
}

/* 左侧用户信息区域 */
.user-info-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.avatar { 
  width: 48px; 
  height: 48px; 
  border-radius: 10px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-weight: 700; 
  font-size: 16px;
  color: white; 
  background: var(--el-color-primary); 
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  flex-shrink: 0;
}
.avatar.admin { 
  background: var(--el-color-danger); 
}

.info { 
  flex: 1;
  min-width: 0; 
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name { 
  font-weight: 600; 
  font-size: 15px; 
  color: var(--el-text-color-primary);
}

.admin-badge {
  margin-left: 0;
}

.username { 
  color: var(--el-text-color-secondary); 
  font-size: 12px; 
  font-family: monospace;
}

.meta { 
  color: var(--el-text-color-secondary); 
  font-size: 11px; 
  display: flex; 
  gap: 12px; 
  flex-wrap: wrap; 
  margin-top: 4px; 
}
.meta .kv { 
  display: inline-flex; 
  gap: 4px; 
  align-items: center; 
}
.meta .kv .k { 
  font-weight: 600; 
  opacity: 0.7; 
  text-transform: uppercase;
}
.meta .kv .v { 
  font-variant-numeric: tabular-nums; 
  font-family: monospace;
}

/* 右侧操作区域 */
.actions-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status { 
  font-size: 12px; 
  color: var(--el-text-color-secondary); 
  display: inline-flex; 
  align-items: center; 
  gap: 6px; 
  min-width: 70px;
}
.status .dot { 
  width: 8px; 
  height: 8px; 
  border-radius: 50%; 
  background: #d1d5db; 
  display: inline-block; 
}
.status.online { 
  color: var(--el-color-success); 
}
.status.online .dot { 
  background: var(--el-color-success); 
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--el-color-success) 30%, transparent); 
}
.status-text {
  min-width: 50px;
  text-align: left;
}

/* 卡片底部 */
.card-footer { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* 权限抽屉和弹窗相关样式 */
.perm-group { 
  display: grid; 
  gap: 6px; 
  margin: 6px 0 10px; 
}
.perm-group-title { 
  font-weight: 600; 
  font-size: 13px; 
  color: var(--el-text-color-primary); 
}
.perm-group-items { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 8px; 
}
.perm-tag { 
  cursor: pointer; 
  user-select: none; 
}
.perm-tag.is-disabled { 
  cursor: not-allowed; 
  opacity: 0.7; 
}
.popover-perms { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 8px; 
  max-width: 320px; 
}
.inline-perms { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 8px; 
  margin-top: 8px; 
}
.admin-tip { 
  color: var(--el-color-danger); 
  font-size: 12px; 
  margin: 4px 0 8px; 
}
.group-batch { 
  display: flex; 
  gap: 8px; 
  margin: 0 0 8px; 
  flex-wrap: wrap; 
}

/* 抽屉样式 */
.drawer-body { 
  padding: 0; 
}
.drawer-toolbar { 
  display: flex; 
  gap: 8px; 
  align-items: center; 
  margin-bottom: 16px; 
}
.drawer-perms { 
  margin-top: 12px; 
}

/* 活动日志样式 */
.activity-log-container {
  padding: 0;
}

.log-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.activity-timeline {
  position: relative;
  padding-left: 0;
}

.activity-item {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
}

.activity-timeline-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.node-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.node-icon.icon-auth {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.node-icon.icon-user {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
.node-icon.icon-customer {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}
.node-icon.icon-transaction {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}
.node-icon.icon-fx {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}
.node-icon.icon-bank {
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
}
.node-icon.icon-expense {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}
.node-icon.icon-system {
  background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%);
}

.node-line {
  width: 2px;
  flex: 1;
  background: var(--el-border-color-light);
  margin-top: 4px;
  min-height: 24px;
}

.activity-content {
  flex: 1;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s;
}

.activity-content:hover {
  background: var(--el-fill-color-light);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.activity-action {
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.activity-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.activity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.meta-item .el-icon {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.activity-timestamp {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 8px;
  font-family: monospace;
}

.log-empty { 
  font-size: 14px; 
  color: var(--el-text-color-secondary); 
  padding: 40px 0;
  text-align: center;
}
</style>

