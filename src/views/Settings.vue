<template>
  <div class="page container">
    <h2 style="margin:8px 0 16px;">{{ t('settings.title') }}</h2>
    <el-card>
      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
        <div class="item">
          <div class="label">{{ t('settings.language') }}</div>
          <el-select v-model="lang" style="width:200px" @change="onLangChange">
            <el-option label="{{ t('settings.zh') }}" value="zh" />
            <el-option label="{{ t('settings.en') }}" value="en" />
          </el-select>
        </div>
        <div class="item">
          <div class="label">{{ t('settings.theme') }}</div>
          <el-segmented v-model="theme" :options="themeOptions" @change="onThemeChange" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'

const { locale, t } = useI18n()
const { isDark, set } = useTheme()

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

watch(locale, (v) => { lang.value = v })
watch(isDark, (v) => { theme.value = v ? 'dark' : 'light' })
</script>

<style scoped>
.page { padding: 24px; }
.grid { display: grid; gap: 16px; }
.label { margin-bottom: 8px; color: var(--el-text-color-secondary); }
</style>
