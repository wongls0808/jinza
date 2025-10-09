import { reactive } from 'vue'

const state = reactive({
  token: null,
  user: null,
  perms: []
})

function load() {
  const raw = localStorage.getItem('auth_user')
  if (!raw) return
  try {
    const data = JSON.parse(raw)
    state.token = data.token
    state.user = data.user
    state.perms = data.perms || []
  } catch {}
}

function save(data) {
  localStorage.setItem('auth_user', JSON.stringify(data))
  load()
}

function logout() {
  localStorage.removeItem('auth_user')
  state.token = null
  state.user = null
  state.perms = []
}

function has(perm) {
  return state.perms.includes(perm)
}

load()

export function useAuth() {
  return { state, has, save, logout }
}
