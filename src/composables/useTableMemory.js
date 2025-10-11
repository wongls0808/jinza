// Column width memory for el-table
// Usage:
// const { colW, onColResize } = useTableMemory('customers')
// <el-table @header-dragend="onColResize"> <el-table-column :width="colW('name', 200)" .../>

export function useTableMemory(key) {
  const storageKey = `table-mem:${key}`
  const load = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}') } catch { return {} }
  }
  const save = (obj) => {
    try { localStorage.setItem(storageKey, JSON.stringify(obj || {})) } catch {}
  }
  let mem = load()
  const colW = (col, def) => mem[col] ?? def
  const onColResize = (newWidth, oldWidth, column, event) => {
    if (!column) return
    const key = column.property || column.columnKey
    if (!key) return
    mem = { ...mem, [key]: newWidth }
    save(mem)
  }
  const reset = () => { mem = {}; save(mem) }
  return { colW, onColResize, reset }
}
