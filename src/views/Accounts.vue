<template>
  <div class="page container">
    <div class="head">
      <div class="title">{{ $t('accounts.title') }}</div>
      <div class="spacer"></div>
      <el-button size="small" @click="$router.push('/')">{{ $t('common.backHome') }}</el-button>
    </div>
    <el-card class="jelly">
      <template #header>
        <div class="toolbar">
          <div class="spacer"></div>
          <el-button type="primary" size="small" @click="openAdd">{{ $t('common.add') }}</el-button>
        </div>
      </template>

      <el-table :data="rows" size="small" border style="width:100%" @header-dragend="onColResize">
        <el-table-column type="index" :label="$t('accounts.fields.index')" :width="colW('idx', 60)" />
        <el-table-column prop="account_name" :label="$t('accounts.fields.accountName')" :width="colW('account_name', 160)" />
        <el-table-column :label="$t('accounts.fields.bank')" :width="colW('bank', 260)">
          <template #default="{ row }">
            <div class="bankcell">
              <img class="logo" :src="row.bank_logo" alt="logo" />
              <span class="zh">{{ row.bank_zh }}</span>
              <span class="en">{{ row.bank_en }}</span>
            </div>
          </template>
        </el-table-column>
  <el-table-column prop="bank_account" :label="$t('accounts.fields.bankAccount')" :width="colW('bank_account', 200)" />
  <el-table-column prop="currency_code" :label="$t('accounts.fields.currency')" :width="colW('currency', 100)" />
  <el-table-column prop="opening_balance" :label="$t('accounts.fields.openingBalance')" :width="colW('opening_balance', 140)">
          <template #default="{ row }">{{ formatMoney(row.opening_balance) }}</template>
        </el-table-column>
        <el-table-column :label="$t('accounts.fields.ops')" :width="colW('ops', 100)">
          <template #default="{ row }">
            <el-popconfirm :title="$t('common.confirmDelete')" @confirm="remove(row)">
              <template #reference><el-button link type="danger">{{ $t('common.delete') }}</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dlg.visible" :title="$t('accounts.addTitle')" width="600px">
      <el-form :model="dlg.form" label-width="90px" class="form">
        <el-form-item :label="$t('accounts.form.accountName')"><el-input v-model.trim="dlg.form.account_name" /></el-form-item>
        <el-form-item :label="$t('accounts.form.bank')">
          <el-select v-model="dlg.form.bank_id" filterable style="width:100%">
            <el-option v-for="b in banks" :key="b.id" :value="b.id">
              <div class="bankopt">
                <img class="logo" :src="b.logo_url" />
                <span class="zh">{{ b.zh }}</span>
                <span class="en">{{ b.en }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('accounts.form.bankAccount')"><el-input v-model.trim="dlg.form.bank_account" /></el-form-item>
        <el-form-item :label="$t('accounts.form.currency')">
          <el-select v-model="dlg.form.currency_code" style="width:100%">
            <el-option v-for="c in currencies" :key="c.code" :label="c.code + ' · ' + c.name" :value="c.code" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('accounts.form.openingBalance')">
          <el-input-number
            v-model="dlg.form.opening_balance"
            :precision="2"
            :min="0"
            :step="100"
            controls-position="right"
            placeholder="0.00"
            :formatter="moneyFormatter"
            :parser="moneyParser"
            style="width:100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlg.visible=false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="dlg.loading" @click="submit">{{ $t('common.ok') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'
import { useTableMemory } from '@/composables/useTableMemory'

const { colW, onColResize } = useTableMemory('accounts')

const rows = ref([])
const banks = ref([])
const currencies = ref([])
const dlg = ref({ visible: false, loading: false, form: { account_name: '', bank_id: null, bank_account: '', currency_code: 'CNY', opening_balance: 0 } })

function formatMoney(v) { return Number(v||0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
// InputNumber 千分位展示与两位小数解析
function moneyFormatter(value) {
  if (value === undefined || value === null || value === '') return ''
  const n = Number(value)
  if (isNaN(n)) return ''
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function moneyParser(value) {
  if (value === undefined || value === null) return 0
  const s = String(value).replace(/,/g, '')
  const n = Number(s)
  return isNaN(n) ? 0 : n
}

async function load() {
  rows.value = await api.accounts.list()
  banks.value = await api.banks.all()
  currencies.value = await api.currencies.list()
}

function openAdd() { dlg.value = { visible: true, loading: false, form: { account_name: '', bank_id: banks.value[0]?.id || null, bank_account: '', currency_code: currencies.value[0]?.code || 'CNY', opening_balance: 0 } } }

async function submit() {
  dlg.value.loading = true
  try {
    const f = dlg.value.form
    if (!f.account_name || !f.bank_id || !f.bank_account || !f.currency_code) { ElMessage.warning('请填写完整'); return }
    await api.accounts.create(f)
    dlg.value.visible = false
    await load()
    ElMessage.success('已添加')
  } finally {
    dlg.value.loading = false
  }
}

async function remove(row) {
  await api.accounts.remove(row.id)
  await load()
  ElMessage.success('已删除')
}

onMounted(load)
</script>

<style scoped>
.page { padding: 8px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 8px 0 8px; }
.title { font-size: 18px; font-weight: 700; }
.toolbar { display: flex; align-items: center; gap: 8px; }
.spacer { flex: 1; }
.form { display: grid; gap: 12px; }
.bankcell, .bankopt { display: inline-flex; align-items: center; gap: 10px; }
.bankcell .logo, .bankopt .logo { height: 16px; width: auto; object-fit: contain; }
.bankcell .zh, .bankopt .zh { font-weight: 600; }
.bankcell .en, .bankopt .en { color: var(--el-text-color-secondary); font-size: 12px; }
</style>