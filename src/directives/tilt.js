export default {
  mounted(el, binding) {
    const max = binding.value?.max || 12 // 最大倾斜角度
    const scale = binding.value?.scale || 1.02
    const shadow = binding.value?.shadow !== false
    const rect = () => el.getBoundingClientRect()

    let frame = null
    function onMove(e) {
      const r = rect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      const rx = (py - 0.5) * -2 * max
      const ry = (px - 0.5) * 2 * max
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        el.style.transform = `perspective(800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${scale})`
        // 使用全局变量定义的“任务栏绿色”阴影，统一鼠标移动阴影色调
        if (shadow) el.style.boxShadow = `var(--app-mouse-shadow, 0 18px 45px rgba(34,197,94,.26))`
      })
    }
    function reset() {
      cancelAnimationFrame(frame)
      el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)'
      if (shadow) el.style.boxShadow = ''
    }
    el.__tiltHandlers = {
      enter: () => el.classList.add('jelly-pop'),
      move: onMove,
      leave: reset
    }
    el.classList.add('will-anim')
    el.addEventListener('mouseenter', el.__tiltHandlers.enter)
    el.addEventListener('mousemove', el.__tiltHandlers.move)
    el.addEventListener('mouseleave', el.__tiltHandlers.leave)
  },
  unmounted(el) {
    const h = el.__tiltHandlers
    if (!h) return
    el.removeEventListener('mouseenter', h.enter)
    el.removeEventListener('mousemove', h.move)
    el.removeEventListener('mouseleave', h.leave)
    delete el.__tiltHandlers
  }
}
