import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { i18n } from './i18n'
import Tilt from './directives/tilt'

const app = createApp(App)
app.use(router)
app.use(i18n)
app.use(ElementPlus)
app.directive('tilt', Tilt)
app.mount('#app')