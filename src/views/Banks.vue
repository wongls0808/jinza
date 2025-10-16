<template>
  <div class="page container">
    <div class="head">
      <div class="title">{{ $t('banks.title') }}</div>
      <div class="spacer"></div>
      <!-- 移除了返回首页按钮 -->
    </div>
  <el-card class="plain-card" shadow="never">
      <template #header>
        <div class="toolbar">
          <el-button size="small" @click="openAdd">{{ $t('common.add') }}</el-button>
          <div class="spacer"></div>
          <el-button type="primary" size="small" @click="reset">{{ $t('banks.resetDefaults') }}</el-button>
        </div>
      </template>

      <div class="cards">
  <div class="bank-card" v-for="(b,i) in banks" :key="b.id" @dblclick="openEdit(b)" title="双击编辑/替换 Logo">
          <div class="idx">{{ i + 1 }}</div>
          <img class="logo" :src="imgSrc(b.code)" @error="onImgErr" />
          <div class="names">
            <span class="zh text-clip">{{ b.zh }}</span>
            <span class="en text-clip">{{ b.en }}</span>
          </div>
          <div class="ops" @dblclick.stop>
            <!-- 列表操作移除，改为双击整卡进入编辑；保留空容器保持布局 -->
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="dlg.visible" :title="dlg.mode==='add' ? $t('banks.addTitle') : $t('banks.replaceTitle')" width="520px">
      <el-form :model="dlg.form" label-width="140px" size="small" class="form">
        <el-form-item :label="$t('banks.labels.code')">
          <el-input v-model.trim="dlg.form.code" placeholder="例如：ICBC" @input="dlg.form.code = (dlg.form.code || '').toUpperCase()" :disabled="dlg.mode==='edit' && !!dlg.form.id" />
        </el-form-item>
        <el-form-item :label="$t('banks.labels.zh')">
          <el-input v-model.trim="dlg.form.zh" placeholder="中国工商银行" @input="dlg.form.zh = (dlg.form.zh || '').toUpperCase()" />
        </el-form-item>
        <el-form-item :label="$t('banks.labels.en')">
          <el-input v-model.trim="dlg.form.en" placeholder="Industrial and Commercial Bank of China" @input="dlg.form.en = (dlg.form.en || '').toUpperCase()" />
        </el-form-item>
        <!-- 取消 URL 输入，统一使用本地 /banks/<code>.(svg|png|jpg) -->
        <el-form-item :label="$t('banks.labels.uploadFile')">
          <input type="file" accept=".svg,.png,.jpg,.jpeg" @change="pickFile" />
          <div class="hint">{{ $t('banks.hintFile') }}</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlg.visible=false">{{ $t('common.cancel') }}</el-button>
        <el-button v-if="dlg.mode==='edit'" type="danger" :loading="dlg.loading" @click="removeInDialog">{{ $t('common.delete') }}</el-button>
        <el-button type="primary" :loading="dlg.loading" @click="submit">{{ $t('common.ok') }}</el-button>
      </template>
    </el-dialog>
  </div>
  </template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/api'

const banks = ref([])
const dlg = ref({ visible: false, mode: 'add', loading: false, form: { id: null, code: '', zh: '', en: '', logo_data_url: '' } })

async function load() {
  banks.value = await api.requestBanks()
}

async function remove(code) {
  try {
    const b = banks.value.find(x => x.code === code)
    if (!b) return
    await ElMessageBox.confirm(`确认删除【${b.zh}】?`, '提示', { type: 'warning' })
    await api.deleteBank(b.id)
    await load()
    ElMessage.success('已删除')
  } catch {}
}

async function reset() {
  await api.resetBanks()
  await load()
  ElMessage.success('已重置到默认列表')
}

function openAdd() {
  dlg.value = { visible: true, mode: 'add', loading: false, form: { id: null, code: '', zh: '', en: '', logo_data_url: '' } }
}
function openEdit(b) {
  dlg.value = { visible: true, mode: 'edit', loading: false, form: { id: b.id, code: b.code, zh: b.zh, en: b.en, logo_data_url: '' } }
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
}
async function pickFile(e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  dlg.value.form.logo_data_url = await fileToDataUrl(f)
}

async function submit() {
  dlg.value.loading = true
  try {
    const f = dlg.value.form
    if (dlg.value.mode === 'add') {
      if (!f.code || !f.zh || !f.en) { ElMessage.warning('请填写代码/中文名/英文名'); return }
      await api.createBank({
        code: (f.code || '').trim().toUpperCase(),
        zh: (f.zh || '').trim().toUpperCase(),
        en: (f.en || '').trim().toUpperCase(),
        logo_data_url: f.logo_data_url || undefined
      })
    } else {
  const body = {
    // 允许在编辑时更新名称、logo
    zh: (f.zh || '').trim().toUpperCase(),
    en: (f.en || '').trim().toUpperCase()
  }
  if (f.logo_data_url) body.logo_data_url = f.logo_data_url
  await api.updateBank(f.id, body)
    }
    dlg.value.visible = false
    await load()
    ElMessage.success('已保存')
  } catch (e) {
    let msg = e?.message || ''
    try { const j = JSON.parse(msg); msg = j.error || msg } catch {}
    ElMessage.error('保存失败：' + msg)
  } finally {
    dlg.value.loading = false
  }
}

async function removeInDialog() {
  try {
    const f = dlg.value.form
    const b = banks.value.find(x => x.id === f.id)
    if (!b) return
    await ElMessageBox.confirm(`确认删除【${b.zh}】?`, '提示', { type: 'warning' })
    dlg.value.loading = true
    await api.deleteBank(b.id)
    dlg.value.visible = false
    await load()
    ElMessage.success('已删除')
  } catch {} finally {
    dlg.value.loading = false
  }
}

onMounted(load)

function onImgErr(e) {
  const el = e?.target
  if (el && el.tagName === 'IMG') {
    const current = el.getAttribute('src') || ''
    // .svg -> .png -> .jpg -> 占位
    if (current.endsWith('.svg')) el.src = current.replace(/\.svg$/i, '.png')
    else if (current.endsWith('.png')) el.src = current.replace(/\.png$/i, '.jpg')
    else el.src = '/banks/public.svg'
  }
}

function imgSrc(code) {
  const c = String(code || 'public').toLowerCase()
  // 默认先 svg，失败时在 onImgErr 回退
  return `/banks/${c}.svg`
}
</script>

<style scoped>
.page { padding: 8px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 8px 0 8px; }
.title { font-size: 18px; font-weight: 700; }
.toolbar { display: flex; align-items: center; gap: 8px; }
.spacer { flex: 1; }

.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(620px, 1fr)); gap: 14px; }
.bank-card {
  display: grid; grid-template-columns: 40px auto 1fr auto; align-items: center; gap: 12px;
  padding: 10px 12px; border: 1px solid var(--el-border-color); border-radius: 12px; background: var(--el-bg-color);
}
.idx { color: var(--el-text-color-secondary); font-weight: 600; }
.logo { height: 36px; width: auto; max-width: 200px; object-fit: contain; }
.names { display: flex; gap: 12px; align-items: center; white-space: nowrap; overflow: hidden; }
.zh { font-weight: 600; }
.en { color: var(--el-text-color-secondary); font-size: 13px; }
.ops { display: flex; gap: 6px; }
.form { display: grid; gap: 12px; }
.hint { color: var(--el-text-color-secondary); font-size: 12px; margin-left: 8px; }
.text-clip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 页面主表卡片：透明无边框（对话框保留默认样式） */
.plain-card { background: transparent; border: none; box-shadow: none; }
</style>