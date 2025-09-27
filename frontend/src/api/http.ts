import axios from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 10000
});

http.interceptors.request.use(config => {
  // 可在此附加 token
  return config;
});

http.interceptors.response.use(
  resp => resp,
  error => {
    // 全局错误处理
    return Promise.reject(error);
  }
);

export const customerApi = {
  list: () => http.get('/customers').then(r => r.data),
  create: (data: { name: string; email: string; phone?: string }) => http.post('/customers', data).then(r => r.data),
  remove: (id: number) => http.delete(`/customers/${id}`).then(r => r.data)
};

export default http;
