import { ref, reactive } from 'vue';

// 简单路由实现
export function useRouter() {
  const currentRoute = ref('/');
  
  const routes = {
    '/dashboard': () => import('../views/Dashboard.vue'),
    '/customers': () => import('../views/Customers.vue'),
    '/projects': () => import('../views/Projects.vue'),
    '/users': () => import('../views/Users.vue')
  };
  
  const currentComponent = ref(null);
  
  const navigate = (path) => {
    currentRoute.value = path;
    if (routes[path]) {
      routes[path]().then(module => {
        currentComponent.value = module.default;
      });
    }
  };
  
  // 初始路由
  if (routes[currentRoute.value]) {
    routes[currentRoute.value]().then(module => {
      currentComponent.value = module.default;
    });
  }
  
  return { currentRoute, currentComponent, navigate };
}