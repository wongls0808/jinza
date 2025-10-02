import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import './styles/global.css'; // 引入全局样式，修复滚动条问题

const app = createApp(App);
app.use(ElementPlus);
app.mount('#app');