import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ElMessage } from 'element-plus';

// 创建axios实例
const rawBaseURL = (import.meta.env.VITE_API_BASE_URL as string) || '';
// 确保baseURL末尾没有/，以便后面可以正确拼接路径
const normalizedBaseURL = rawBaseURL ? (rawBaseURL.endsWith('/') ? rawBaseURL.slice(0, -1) : rawBaseURL) : '';

const service = axios.create({
  baseURL: normalizedBaseURL || undefined, // API的基础URL（为空时使用相对路径）
  timeout: 15000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 在发送请求之前做些什么
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    // 对请求错误做些什么
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 对响应数据做点什么
    const res = response.data;
    
    // 根据自定义错误码判断请求是否成功
    if (res.code && res.code !== 0 && res.code !== 200) {
      // 处理错误情况
      ElMessage.error(res.message || '服务器错误');
      
      // 根据错误码处理特殊情况
      if (res.code === 401) {
        // token 过期或未登录
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      return Promise.reject(new Error(res.message || '服务器错误'));
    } else {
      // 请求成功
      return res;
    }
  },
  (error: AxiosError) => {
    // 对响应错误做点什么
    console.error('响应错误:', error);
    
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 401:
          ElMessage.error('未授权，请重新登录');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          ElMessage.error('拒绝访问');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器错误');
          break;
        default:
          ElMessage.error(`连接错误${status}`);
      }
    } else {
      ElMessage.error('网络连接异常');
    }
    
    return Promise.reject(error);
  }
);

// 确保URL以/api开头
const ensureApiPrefix = (url: string): string => {
  // 如果配置了绝对 baseURL（例如 https://...），则不强制加 /api 前缀
  if (normalizedBaseURL) return url.startsWith('/') ? url : `/${url}`;
  return url.startsWith('/api') ? url : `/api${url}`;
};

// 封装GET请求
export function get<T>(url: string, params?: any): Promise<T> {
  return service.get(ensureApiPrefix(url), { params });
}

// 封装POST请求
export function post<T>(url: string, data?: any): Promise<T> {
  return service.post(ensureApiPrefix(url), data);
}

// 封装PUT请求
export function put<T>(url: string, data?: any): Promise<T> {
  return service.put(ensureApiPrefix(url), data);
}

// 封装DELETE请求
export function del<T>(url: string, params?: any): Promise<T> {
  return service.delete(ensureApiPrefix(url), { params });
}

export default service;