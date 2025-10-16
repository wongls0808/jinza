import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { i18n } from './i18n'
import Tilt from './directives/tilt'

// 强制使用亮色主题
document.documentElement.classList.remove('dark')
localStorage.setItem('vueuse-color-scheme', 'light')
import { User, UserFilled, Box, Document, Setting, Lock, OfficeBuilding, Search, Plus, Delete, Edit, HomeFilled, ArrowLeft, Upload, Download, Refresh } from '@element-plus/icons-vue'

const app = createApp(App)
app.use(router)
app.use(i18n)
// 统一 Element Plus 全局尺寸与层级，确保视觉密度一致
app.use(ElementPlus, { size: 'small', zIndex: 3000 })
app.directive('tilt', Tilt)
// 按需注册用到的图标组件
app.component('User', User)
app.component('UserFilled', UserFilled)
app.component('Box', Box)
app.component('Document', Document)
app.component('Setting', Setting)
app.component('Lock', Lock)
app.component('OfficeBuilding', OfficeBuilding)
app.component('Search', Search)
app.component('Plus', Plus)
app.component('Delete', Delete)
app.component('Edit', Edit)
app.component('HomeFilled', HomeFilled)
app.component('ArrowLeft', ArrowLeft)
app.component('Upload', Upload)
app.component('Download', Download)
app.component('Refresh', Refresh)
app.mount('#app')