<template>
  <div class="page container container--fluid">
    <div class="head">
      <div class="title">{{ $t('accounts.title') }}</div>
      <div class="spacer"></div>
      <!-- 移除了返回首页按钮 -->
    </div>
  <el-card class="plain-card" shadow="never">
      <template #header>
        <div class="toolbar">
          <div class="spacer"></div>
          <el-button size="small" @click="openCurrencyDrawer">{{ $t('settings.currenciesTitle') }}</el-button>
          <el-button type="primary" size="small" @click="openAdd">{{ $t('common.add') }}</el-button>
        </div>
      </template>

      <el-table
        :data="rows"
        size="small"
        border
        style="width:100%"
        @header-dragend="onColResize"
        @sort-change="onSort"
        @row-dblclick="onRowDblClick"
      >
        <el-table-column type="index" column-key="__idx" :label="$t('accounts.fields.index')" :width="colW('__idx', 60)" />
        <el-table-column prop="account_name" :label="$t('accounts.fields.accountName')" sortable="custom" :width="colW('account_name', 160)" />
        <el-table-column column-key="bank" :label="$t('accounts.fields.bank')" :width="colW('bank', 260)">
          <template #default="{ row }">
            <div class="bankcell">
              <img class="logo" :src="bankImg(row)" alt="logo" @error="onBankImgErr($event)" />
              <span class="zh">{{ row.bank_zh }}</span>
              <span class="en">{{ row.bank_en }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="bank_account" :label="$t('accounts.fields.bankAccount')" sortable="custom" :width="colW('bank_account', 200)" />
        <el-table-column prop="currency_code" :label="$t('accounts.fields.currency')" sortable="custom" :width="colW('currency_code', 100)" />
        <el-table-column prop="opening_balance" :label="$t('accounts.fields.openingBalance')" sortable="custom" :width="colW('opening_balance', 140)">
          <template #default="{ row }">{{ formatMoney(row.opening_balance) }}</template>
        </el-table-column>
        <el-table-column prop="balance" :label="$t('accounts.fields.balance')" sortable="custom" :width="colW('balance', 140)">
          <template #default="{ row }">{{ formatMoney(row.balance) }}</template>
        </el-table-column>
        <el-table-column :label="$t('accounts.fields.ops')" :width="colW('ops', 100)">
          <template #default="{ row }">
            <el-popconfirm :title="$t('common.confirmDelete')" @confirm="remove(row)">
              <template #reference><el-button link type="danger">{{ $t('common.delete') }}</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10,20,50,100]"
          @size-change="onPageSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </el-card>

    <!-- 币种设置抽屉 -->
    <el-drawer v-model="currencyDrawer.visible" :title="$t('settings.currenciesTitle')" size="40%">
      <div class="add-row">
        <el-input
          v-model="currencyDrawer.newCode"
          :placeholder="$t('settings.currencies.addPlaceholderCode')"
          style="width:150px"
          maxlength="8"
          @input="currencyDrawer.newCode = (currencyDrawer.newCode || '').toUpperCase().trim()"
        />
        <el-input
          v-model="currencyDrawer.newName"
          :placeholder="$t('settings.currencies.addPlaceholderName')"
          style="width:240px"
          maxlength="32"
        />
        <el-button type="primary" :loading="currencyDrawer.adding" @click="onAddCurrency">{{ $t('common.add') }}</el-button>
      </div>

      <el-table :data="currencies" size="small" :border="true" style="width:100%;">
        <el-table-column prop="code" :label="$t('settings.currencies.code')" width="120" />
        <el-table-column prop="name" :label="$t('settings.currencies.name')" />
        <el-table-column :label="$t('customers.fields.ops')" width="120">
          <template #default="{ row }">
            <el-popconfirm :title="$t('common.confirmDelete')" @confirm="removeCurrency(row)">
              <template #reference><el-button size="small" type="danger" text>{{ $t('common.delete') }}</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>

  <el-drawer v-model="dlg.visible" :title="$t('accounts.addTitle')" :size="'min(720px, 92vw)'" :close-on-click-modal="false">
    <el-form :model="dlg.form" :label-width="$i18n.locale === 'zh' ? '120px' : '140px'" label-position="left" size="small" class="form">
        <el-form-item :label="$t('accounts.form.accountName')">
          <el-input v-model.trim="dlg.form.account_name" :placeholder="$t('accounts.form.accountName')" clearable />
        </el-form-item>
        <el-form-item :label="$t('accounts.form.bank')">
          <el-select v-model="dlg.form.bank_id" filterable clearable style="width:100%" :placeholder="$t('accounts.form.bank')">
            <el-option v-for="b in banks" :key="b.id" :value="b.id" :label="b.zh + ' · ' + b.en">
              <div class="bankopt">
                <img class="logo" :src="bankImg(b.code)" @error="onBankImgErr($event)" />
                <span class="zh">{{ b.zh }}</span>
                <span class="en">{{ b.en }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('accounts.form.bankAccount')">
          <el-input v-model.trim="dlg.form.bank_account" :placeholder="$t('accounts.form.bankAccount')" clearable />
        </el-form-item>
        <el-form-item :label="$t('accounts.form.currency')">
          <el-select v-model="dlg.form.currency_code" clearable style="width:100%" :placeholder="$t('accounts.form.currency')">
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
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <el-button @click="dlg.visible=false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="dlg.loading" @click="submit">{{ $t('common.ok') }}</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'
import { useTableMemory } from '@/composables/useTableMemory'

const { colW, onColResize } = useTableMemory('accounts')

const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const sort = ref('id')
const order = ref('desc')
const banks = ref([])
const currencies = ref([])
const dlg = ref({ visible: false, loading: false, form: { account_name: '', bank_id: null, bank_account: '', currency_code: 'CNY', opening_balance: 0 } })

// 币种抽屉状态
const currencyDrawer = ref({ visible: false, adding: false, newCode: '', newName: '' })

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
  const data = await api.accounts.list({ page: page.value, pageSize: pageSize.value, sort: sort.value, order: order.value })
  rows.value = data.items || []
  total.value = data.total || 0
  banks.value = await api.banks.all()
  currencies.value = await api.currencies.list()
}

function openAdd() { dlg.value = { visible: true, loading: false, form: { account_name: '', bank_id: banks.value[0]?.id || null, bank_account: '', currency_code: currencies.value[0]?.code || 'CNY', opening_balance: 0 } } }

// 打开币种抽屉并刷新币种列表
async function openCurrencyDrawer() {
  currencyDrawer.value.visible = true
  await reloadCurrencies()
}

async function reloadCurrencies() {
  currencies.value = await api.currencies.list()
}

async function onAddCurrency() {
  const code = (currencyDrawer.value.newCode || '').toUpperCase().trim()
  const name = (currencyDrawer.value.newName || '').trim()
  if (!code) return ElMessage.warning($t('settings.currencies.addPlaceholderCode'))
  if (!name) return ElMessage.warning($t('settings.currencies.addPlaceholderName'))
  try {
    currencyDrawer.value.adding = true
    await api.currencies.create(code, name)
  ElMessage.success($t('customers.messages.added'))
    currencyDrawer.value.newCode = ''
    currencyDrawer.value.newName = ''
    await reloadCurrencies()
  } catch (err) {
    ElMessage.error(String(err?.message || err))
  } finally {
    currencyDrawer.value.adding = false
  }
}

async function removeCurrency(row) {
  try {
    await api.currencies.remove(row.code)
  ElMessage.success($t('customers.messages.deleted'))
    await reloadCurrencies()
  } catch (err) {
    ElMessage.error(String(err?.message || err))
  }
}

async function submit() {
  dlg.value.loading = true
  try {
    const f = dlg.value.form
  if (!f.account_name || !f.bank_id || !f.bank_account || !f.currency_code) { ElMessage.warning($t('customers.messages.fillAllFields')); return }
    if (dlg.value.mode === 'edit' && dlg.value.id) {
      await api.accounts.update(dlg.value.id, f)
  ElMessage.success($t('customers.messages.saved'))
    } else {
      await api.accounts.create(f)
  ElMessage.success($t('customers.messages.added'))
    }
    dlg.value.visible = false
    await load()
  } finally {
    dlg.value.loading = false
  }
}

async function remove(row) {
  await api.accounts.remove(row.id)
  await load()
  ElMessage.success($t('customers.messages.deleted'))
}

onMounted(load)

function onSort({ prop, order: ord }) {
  if (!prop) return
  sort.value = prop
  order.value = ord === 'ascending' ? 'asc' : 'desc'
  load()
}

function onPageSizeChange(ps) {
  pageSize.value = ps
  page.value = 1
  load()
}
function onPageChange(p) {
  page.value = p
  load()
}

function onRowDblClick(row) {
  dlg.value = { visible: true, loading: false, mode: 'edit', id: row.id, form: {
    account_name: row.account_name,
    bank_id: row.bank_id,
    bank_account: row.bank_account,
    currency_code: row.currency_code,
    opening_balance: row.opening_balance
  } }
}

function bankImg(row) {
  if (row && row.bank_logo) return row.bank_logo
  const c = String(row?.bank_code||'public').toLowerCase()
  return `/banks/${c}.svg`
}
function onBankImgErr(e) {
  const el = e?.target
  if (el && el.tagName === 'IMG') {
    const current = el.getAttribute('src') || ''
    if (/\.svg$/i.test(current)) el.src = current.replace(/\.svg$/i, '.png')
    else if (/\.png$/i.test(current)) el.src = current.replace(/\.png$/i, '.jpg')
    else el.src = '/banks/public.svg'
  }
}
</script>

<style scoped>
.page { padding: 8px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 8px 0 8px; }
.title { font-size: 18px; font-weight: 700; }
.toolbar { display: flex; align-items: center; gap: 8px; }
.spacer { flex: 1; }
.form { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.add-row { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; flex-wrap: wrap; }
.bankcell, .bankopt { display: inline-flex; align-items: center; gap: 10px; }
.bankcell .logo, .bankopt .logo { height: 16px; width: auto; object-fit: contain; }
.bankcell .zh, .bankopt .zh { font-weight: 600; }
.bankcell .en, .bankopt .en { color: var(--el-text-color-secondary); font-size: 12px; }
.plain-card { background: transparent; border: none; box-shadow: none; }
</style>