import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { i18n } from './i18n'
import Tilt from './directives/tilt'
import * as Icons from '@element-plus/icons-vue'

const app = createApp(App)
app.use(router)
app.use(i18n)
app.use(ElementPlus)
app.directive('tilt', Tilt)
// 全局注册 EL 图标
Object.entries(Icons).forEach(([name, comp]) => {
	app.component(name, comp)
})
app.mount('#app')