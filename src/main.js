import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import { createAppRouter } from './router';
import { useAuth } from './stores/auth';
import AppLayout from './layouts/AppLayout.vue';

const app = createApp(App);
app.component('AppLayout', AppLayout);
app.use(ElementPlus);

// 初始化 auth 并创建路由（依赖 auth）
const auth = useAuth();
const router = createAppRouter(auth);
app.use(router);

app.mount('#app');