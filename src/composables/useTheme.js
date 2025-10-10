import { ref, watchEffect } from 'vue'

const isDark = ref(localStorage.getItem('theme') === 'dark')

watchEffect(() => {
  const cls = 'dark'
  const el = document.documentElement
  if (isDark.value) {
    el.classList.add(cls)
    localStorage.setItem('theme', 'dark')
  } else {
    el.classList.remove(cls)
    localStorage.setItem('theme', 'light')
  }
})

export function useTheme() {
  const toggle = () => (isDark.value = !isDark.value)
  const set = (v) => (isDark.value = !!v)
  return { isDark, toggle, set }
}
