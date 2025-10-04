import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import './styles/global.css'; // 引入全局样式，修复滚动条问题
import './styles/unified-ui.css'; // 引入统一UI样式
import './styles/responsive.css'; // 引入响应式设计样式
import './styles/mobile-adaptations.css'; // 引入移动设备适配样式
import './styles/touch-interactions.css'; // 引入触控交互优化

// 导入所有Element Plus图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

// 在客户端运行时且符合条件时才加载测试工具
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // 检查是否在测试模式
  const isTestMode = window.location.search.includes('test=');
  
  if (isTestMode || import.meta.env.MODE === 'development') {
    // 异步加载测试工具，不影响主应用性能
    import('./utils/compatibility-test.js')
      .catch(err => console.error('无法加载兼容性测试工具:', err));
      
    import('./utils/responsive-test.js')
      .catch(err => console.error('无法加载响应式测试工具:', err));
      
    console.log('UI测试工具已加载，可通过 window.jinzaUITest 和 window.jinzaResponsiveTest 访问');
  }
}

const app = createApp(App);
app.use(ElementPlus);

// 全局注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount('#app');