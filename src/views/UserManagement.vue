<template>
  <NavBar :activePage="'users'" @navigate="onNavigate" />
  <div class="users container">
    <div class="page-head">
  <div class="title">{{ $t('home.users') }}</div>
      <div class="spacer"></div>
      <div class="actions">
  <el-input v-model.trim="newUser.username" :placeholder="$t('user.username')" style="width:180px" size="small" />
  <el-input v-model.trim="newUser.password" type="password" :placeholder="$t('user.initPassword')" style="width:180px" size="small" />
  <el-input v-model.trim="newUser.display_name" :placeholder="$t('user.displayName')" style="width:180px" size="small" />
  <el-button type="primary" :loading="creating" size="small" @click="createUser">{{ $t('common.add') }}</el-button>
      </div>
    </div>

    <div class="grid cards">
      <el-card v-for="u in users" :key="u.id" class="user-card card">
        <template #header>
          <div class="row">
            <div>
              <div class="name">{{ u.display_name || u.username }}</div>
              <div class="username">@{{ u.username }}</div>
            </div>
            <div class="ops">
              <el-switch v-model="u.is_active" @change="toggleActive(u)" :active-text="$t('user.active')" />
              <el-button type="warning" size="small" @click="openReset(u)">{{ $t('common.reset') }}</el-button>
              <el-button type="danger" size="small" @click="confirmRemove(u)">{{ $t('common.delete') }}</el-button>
            </div>
          </div>
        </template>
        <div class="perms" v-if="perms.length">
          <el-tag
            v-for="p in perms"
            :key="p.code"
            :type="userHas(u, p.code) ? 'success' : 'info'"
            class="perm-tag"
            effect="light"
            size="small"
            @click="togglePerm(u, p.code)"
          >
            {{ p.name }}
          </el-tag>
        </div>
      </el-card>
    </div>

    <!-- 重置密码对话框 -->
  <el-dialog v-model="reset.visible" :title="$t('common.reset')" width="420px">
      <div style="display:grid;gap:12px;">
  <div>{{ $t('user.user') }}：<strong>{{ reset.user?.username }}</strong></div>
  <el-input v-model.trim="reset.password" type="password" :placeholder="$t('user.resetPasswordPlaceholder')" />
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
import NavBar from '@/components/NavBar.vue'
function onNavigate(page) {
  // 可根据需要实现页面跳转逻辑
}

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
  if (!newUser.value.username || !newUser.value.password) return alert($t('user.fillUsernamePassword'))
  creating.value = true
  try {
    await api.users.create(newUser.value)
    newUser.value = { username: '', password: '', display_name: '' }
    await load()
  ElMessage.success($t('user.createSuccess'))
  } catch (e) {
  ElMessage.error($t('user.createFail') + (e.message || ''))
  } finally {
    creating.value = false
  }
}

async function toggleActive(u) {
  try {
    await api.users.update(u.id, { is_active: u.is_active })
  ElMessage.success($t('user.statusUpdated'))
  } catch (e) {
  ElMessage.error($t('user.updateFail'))
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
.users {
  padding: 0;
  background: linear-gradient(120deg, #e3f0ff 0%, #f8fbff 100%);
  min-height: 100vh;
  width: 100vw;
  position: fixed;
  left: 0;
  top: 0;
  overflow-y: auto;
  box-sizing: border-box;
}
.page-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  justify-content: center;
}
.title {
  font-size: 22px;
  font-weight: 700;
  color: #4f8cff;
}
.spacer { flex: 1; }
.actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}
.cards {
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 28px;
  justify-content: center;
}
.user-card {
  padding: 0;
  border-radius: 22px;
  box-shadow: 0 8px 32px rgba(79,140,255,0.10), 0 1.5px 8px rgba(79,140,255,0.08);
  background: rgba(255,255,255,0.96);
  transition: transform .22s cubic-bezier(.4,0,.2,1), box-shadow .22s cubic-bezier(.4,0,.2,1);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.user-card:hover {
  transform: scale(1.04) rotateX(8deg) rotateY(-6deg);
  box-shadow: 0 16px 48px rgba(79,140,255,0.18), 0 2px 12px rgba(79,140,255,0.10);
}
.row {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: space-between;
  width: 100%;
}
.name {
  font-weight: 700;
  font-size: 18px;
  color: #4f8cff;
}
.username {
  color: #6b7b8c;
  font-size: 13px;
}
.perms {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  justify-content: center;
}
.perm-tag {
  cursor: pointer;
  user-select: none;
  border-radius: 8px;
  transition: box-shadow .18s, transform .18s;
}
.perm-tag:hover {
  box-shadow: 0 2px 8px #4f8cff33;
  transform: scale(1.08);
}
.ops {
  display: flex;
  gap: 10px;
  align-items: center;
}
.el-button[type="primary"], .el-button[type="danger"], .el-button[type="warning"] {
  border-radius: 8px;
  box-shadow: 0 2px 8px #4f8cff22;
.users {
  background: none;
  min-height: 0;
  width: 100%;
  position: static;
}
.users-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
}
  transition: background .18s, box-shadow .18s;
}
.el-button[type="primary"] {
  background: linear-gradient(90deg, #4f8cff 0%, #a1e3ff 100%);
  color: #fff;
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 32px;
  justify-content: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}
}
.el-button[type="primary"]:hover {
  background: linear-gradient(90deg, #3a6fd8 0%, #7fd8ff 100%);
}
@media (max-width: 600px) {
  .cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .user-card {
    border-radius: 14px;
  }
  .name { font-size: 16px; }
  .username { font-size: 12px; }
}
</style>
