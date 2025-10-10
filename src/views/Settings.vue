<template>
  <div class="page container">
    <h2 style="margin:8px 0 16px;">{{ t('settings.title') }}</h2>
    <el-card>
      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
        <div class="item">
          <div class="label">{{ t('settings.language') }}</div>
          <el-select v-model="lang" style="width:200px" @change="onLangChange">
            <el-option :label="t('settings.zh')" value="zh" />
            <el-option :label="t('settings.en')" value="en" />
          </el-select>
        </div>
        <div class="item">
          <div class="label">{{ t('settings.theme') }}</div>
          <el-segmented v-model="theme" :options="themeOptions" @change="onThemeChange" />
        </div>
        <div class="item">
          <div class="label">{{ t('settings.account') }}</div>
          <el-button type="danger" @click="onLogout">{{ t('settings.logout') || '退出登录' }}</el-button>
        </div>
      </div>
    </el-card>

    <el-card style="margin-top:16px;">
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <div style="font-weight:600;">币种设置</div>
          <div style="opacity:.6;font-size:12px;">共 {{ currencies.length }} 个</div>
        </div>
      </template>

      <div class="add-row">
        <el-input v-model="newCode" placeholder="币种代码，如 CNY / USD" style="width:150px" maxlength="8" @input="newCode = (newCode || '').toUpperCase().trim()" />
        <el-input v-model="newName" placeholder="显示名称，如 人民币 / 美元" style="width:240px" maxlength="32" />
        <el-button type="primary" :loading="adding" @click="onAddCurrency">添加</el-button>
      </div>

      <el-table :data="currencies" size="small" v-loading="loading" :border="true" style="width:100%;">
        <el-table-column prop="code" label="代码" width="120" />
        <el-table-column prop="name" label="名称" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="danger" text @click="onRemove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { api } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const { locale, t } = useI18n()
const { isDark, set } = useTheme()
const { logout } = useAuth()
const router = useRouter()

const lang = ref(locale.value)
const theme = ref(isDark.value ? 'dark' : 'light')

const themeOptions = [
  { label: '🌞 ' + t('settings.light'), value: 'light' },
  { label: '🌙 ' + t('settings.dark'), value: 'dark' },
]

function onLangChange(v) {
  locale.value = v
  localStorage.setItem('lang', v)
}

function onThemeChange(v) {
  set(v === 'dark')
}

function onLogout() {
  logout()
  router.replace('/login')
}

watch(locale, (v) => { lang.value = v })
watch(isDark, (v) => { theme.value = v ? 'dark' : 'light' })

// 币种设置
const currencies = ref([])
const loading = ref(false)
const adding = ref(false)
const newCode = ref('')
const newName = ref('')

async function loadCurrencies() {
  try {
    loading.value = true
    currencies.value = await api.currencies.list()
  } catch (err) {
    ElMessage.error(String(err.message || err))
  } finally {
    loading.value = false
  }
}

async function onAddCurrency() {
  const code = (newCode.value || '').toUpperCase().trim()
  const name = (newName.value || '').trim()
  if (!code) return ElMessage.warning('请输入币种代码')
  if (!name) return ElMessage.warning('请输入币种名称')
  try {
    adding.value = true
    await api.currencies.create(code, name)
    ElMessage.success('已添加')
    newCode.value = ''
    newName.value = ''
    await loadCurrencies()
  } catch (err) {
    ElMessage.error(String(err.message || err))
  } finally {
    adding.value = false
  }
}

async function onRemove(row) {
  try {
    await ElMessageBox.confirm(`确定删除币种 ${row.code}（${row.name}）吗？`, '提示', { type: 'warning' })
  } catch { return }
  try {
    await api.currencies.remove(row.code)
    ElMessage.success('已删除')
    await loadCurrencies()
  } catch (err) {
    ElMessage.error(String(err.message || err))
  }
}

onMounted(() => {
  loadCurrencies()
})
</script>

<style scoped>
.page { padding: 24px; }
.grid { display: grid; gap: 16px; }
.label { margin-bottom: 8px; color: var(--el-text-color-secondary); }
.add-row { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; flex-wrap: wrap; }
</style>
