import { ref, reactive } from 'vue';
import { post, get } from '@/utils/request';
import type { LoginParams, LoginResult, User, ApiResponse } from '@/types/api';
import { ElMessage } from 'element-plus';
import router from '@/router';

// 登录
export const useLogin = () => {
  const loading = ref(false);
  const error = ref('');
  
  const login = async (loginParams: LoginParams) => {
    loading.value = true;
    error.value = '';
    
    try {
  const response = await post<ApiResponse<LoginResult>>('/login', loginParams);
      
      if (response.code === 200) {
        // 保存token和用户信息
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userInfo', JSON.stringify(response.data.user));
        
        // 登录成功提示
        ElMessage.success('登录成功');
        
        // 跳转到首页或指定的重定向页面
        const redirect = router.currentRoute.value.query.redirect as string;
        router.push(redirect || '/dashboard');
        
        return true;
      } else {
        error.value = response.message || '登录失败';
        return false;
      }
    } catch (err: any) {
      error.value = err.message || '登录失败';
      return false;
    } finally {
      loading.value = false;
    }
  };
  
  return {
    loading,
    error,
    login
  };
};

// 获取用户信息
export const useUserInfo = () => {
  const userInfo = ref<User | null>(null);
  const loading = ref(false);
  
  const getUserInfo = async () => {
    loading.value = true;
    
    try {
  const response = await get<ApiResponse<User>>('/me');
      
      if (response.code === 200) {
        userInfo.value = response.data;
        return response.data;
      } else {
        ElMessage.error(response.message || '获取用户信息失败');
        return null;
      }
    } catch (err) {
      ElMessage.error('获取用户信息失败');
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  return {
    userInfo,
    loading,
    getUserInfo
  };
};

// 退出登录
export const useLogout = () => {
  const logout = () => {
    // 清除本地存储的token和用户信息
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    
    // 跳转到登录页
    router.push('/login');
    
    ElMessage.success('已退出登录');
  };
  
  return {
    logout
  };
};