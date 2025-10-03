import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import './styles/global.css'; // 引入全局样式，修复滚动条问题
import './styles/responsive.css'; // 引入响应式设计样式
import './styles/mobile-adaptations.css'; // 引入移动设备适配样式
import './styles/touch-interactions.css'; // 引入触控交互优化

const app = createApp(App);
app.use(ElementPlus);
app.mount('#app');