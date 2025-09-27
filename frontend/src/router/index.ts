import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import HomePage from '../components/HomePage.vue';
import AboutPage from '../components/AboutPage.vue';
import CustomerListPage from '../components/CustomerListPage.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/about', name: 'about', component: AboutPage },
  { path: '/customers', name: 'customers', component: CustomerListPage }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
