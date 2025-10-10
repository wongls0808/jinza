import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { i18n } from './i18n'
import Tilt from './directives/tilt'
import { User, UserFilled, Box, Document, Setting, Lock, OfficeBuilding } from '@element-plus/icons-vue'

const app = createApp(App)
app.use(router)
app.use(i18n)
app.use(ElementPlus)
app.directive('tilt', Tilt)
// 按需注册用到的图标组件
app.component('User', User)
app.component('UserFilled', UserFilled)
app.component('Box', Box)
app.component('Document', Document)
app.component('Setting', Setting)
app.component('Lock', Lock)
app.component('OfficeBuilding', OfficeBuilding)
app.mount('#app')