import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';

const messages = {
  en,
  'zh-CN': zhCN
};

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'zh-CN', // 默认使用中文
  fallbackLocale: 'en',
  messages
});

export default i18n;
