import { ref } from 'vue'

// A reusable helper to render bank logos without flicker.
// Priority: DB logo_url (/api/banks/:id/logo) if provided on row -> static /banks/<code>.svg -> .png -> .jpg -> public.svg -> text fallback
export function useBankLogo() {
  const logoFail = ref({}) // { [key]: true }

  function logoKey(input) {
    if (typeof input === 'string') return String(input || '').toLowerCase()
    const c = input?.bank_code || input?.bankCode || input?.code || input?.bank?.code
    return String(c || '').toLowerCase()
  }

  function resolveLogo(input) {
    // if marked failed, stop providing src to avoid repeated retries
    const key = logoKey(input)
    if (key && logoFail.value[key]) return ''

    // prefer logo_url from backend when available
    const url = (input && (input.bank_logo || input.bank_logo_url || input.logo_url)) || ''
    if (url) return url

    // static by bank code
    if (key) return `/banks/${key}.svg`
    return '/banks/public.svg'
  }

  function onLogoError(evt, input) {
    const el = evt?.target
    if (!el) return
    const key = logoKey(input)
    const cur = el.getAttribute('src') || ''
    // If DB endpoint fails and code exists, fall back to static svg
    if (cur.startsWith('/api/banks/') && key) { el.setAttribute('src', `/banks/${key}.svg`); return }
    if (/\.svg$/i.test(cur)) { el.setAttribute('src', cur.replace(/\.svg$/i, '.png')); return }
    if (/\.png$/i.test(cur)) { el.setAttribute('src', cur.replace(/\.png$/i, '.jpg')); return }
    // final fallback: public.svg if not already
    if (!/\/banks\/public\.svg$/i.test(cur)) { el.setAttribute('src', '/banks/public.svg'); return }
    // mark failed to stop further attempts and allow text fallback
    if (key) logoFail.value[key] = true
  }

  return { logoFail, logoKey, resolveLogo, onLogoError }
}
