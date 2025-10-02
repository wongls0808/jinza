// 统一 API 客户端封装
// 提供 get/post/put/delete 基础方法，集中处理：
// - JSON 序列化
// - 错误处理与 401 登出逻辑回调
// - 可拓展重试、节流、缓存

const defaultHeaders = { 'Content-Type': 'application/json' };

function buildUrl(path, params) {
  if (!params) return path;
  const usp = new URLSearchParams(params);
  return `${path}?${usp.toString()}`;
}

async function request(method, path, { params, body, headers, onUnauthorized } = {}) {
  const url = buildUrl(path, params);
  const opts = { method, headers: { ...defaultHeaders, ...(headers || {}) }, credentials: 'include' };
  if (body !== undefined) opts.body = typeof body === 'string' ? body : JSON.stringify(body);

  let resp;
  try {
    resp = await fetch(url, opts);
  } catch (networkErr) {
    return Promise.reject({ type: 'network', error: networkErr });
  }

  if (resp.status === 401) {
    if (typeof onUnauthorized === 'function') onUnauthorized();
    return Promise.reject({ type: 'unauthorized', status: 401 });
  }

  let data;
  try {
    data = await resp.json();
  } catch (parseErr) {
    return Promise.reject({ type: 'parse', status: resp.status, error: parseErr });
  }

  if (!resp.ok) {
    return Promise.reject({ type: 'api', status: resp.status, data });
  }
  return data;
}

export const api = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options = {}) => request('POST', path, { ...options, body }),
  put: (path, body, options = {}) => request('PUT', path, { ...options, body }),
  delete: (path, body, options = {}) => request('DELETE', path, { ...options, body })
};

// 业务快捷方法示例
export const userApi = {
  list: () => api.get('/api/users'),
  create: (payload) => api.post('/api/users', payload),
  me: () => api.get('/api/me'),
  login: (credentials) => api.post('/api/login', credentials),
  logout: () => api.post('/api/logout')
};

export const customerApi = {
  list: (query) => api.get('/api/customers', { params: query })
};

export const projectApi = {
  list: (query) => api.get('/api/projects', { params: query })
};

export const accountSetApi = {
  list: () => api.get('/api/account-sets')
};
