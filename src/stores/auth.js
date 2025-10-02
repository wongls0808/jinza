import { reactive } from 'vue';

const state = reactive({
  user: null,
  initialized: false,
});

export function useAuth() {
  async function init() {
    if (state.initialized) return;
    try {
      const resp = await fetch('/api/me', { credentials: 'include' });
      if (resp.ok) {
        const data = await resp.json();
        state.user = data.user;
      }
    } catch (e) { /* ignore */ }
    finally { state.initialized = true; }
  }

  async function login(username, password) {
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) throw new Error(data.error || '登录失败');
    state.user = data.user;
  }

  async function logout() {
    try { await fetch('/api/logout', { method: 'POST', credentials: 'include' }); } catch(e) {}
    state.user = null;
  }

  return { ...state, init, login, logout };
}
