import { query } from './db.js'

// 基于菜单的权限树（清晰分组，仅保留当前系统实际使用/校验的权限码）
export const PERMISSION_TREE = [
  { module: 'workbench', name: '工作台', items: [
    { code: 'view_dashboard', name: '查看' },
  ]},
  { module: 'customers', name: '客户管理', items: [
    { code: 'view_customers', name: '查看' },
    { code: 'customers:create', name: '新增' },
    { code: 'customers:update', name: '编辑' },
    { code: 'customers:delete', name: '删除' },
    { code: 'customers:import', name: '导入' },
    { code: 'customers:export', name: '导出' },
  ]},
  { module: 'banks', name: '银行列表', items: [
    { code: 'view_banks', name: '查看' },
    { code: 'banks:create', name: '新增' },
    { code: 'banks:update', name: '编辑' },
    { code: 'banks:delete', name: '删除' },
  ]},
  { module: 'accounts', name: '收款账户', items: [
    { code: 'view_accounts', name: '查看' },
    { code: 'accounts:create', name: '新增' },
    { code: 'accounts:update', name: '编辑' },
    { code: 'accounts:delete', name: '删除' },
    { code: 'currencies:manage', name: '币种维护' },
  ]},
  { module: 'transactions', name: '交易管理', items: [
    { code: 'view_transactions', name: '查看' },
    { code: 'view_transactions_stats', name: '图表/统计' },
    { code: 'transactions:import', name: '导入' },
    { code: 'transactions:export', name: '导出' },
    { code: 'transactions:match', name: '匹配' },
    { code: 'transactions:delete', name: '删除' },
  ]},
  { module: 'fx', name: '结汇管理', items: [
    { code: 'view_fx', name: '查看' },
    { code: 'manage_fx', name: '编辑' },
    { code: 'delete_fx', name: '删除' },
    { code: 'fx:export', name: '导出' },
    { code: 'fx:pdf', name: '导出PDF' },
  ]},
  { module: 'buyfx', name: '购汇管理', items: [
    // 仍沿用 FX 查看权限；后续如拆分接口可替换为 buyfx:view
    { code: 'view_fx', name: '查看' },
  ]},
  { module: 'expenses', name: '费用管理', items: [
    { code: 'expenses:list', name: '查看' },
    { code: 'expenses:create', name: '新增' },
    { code: 'expenses:update', name: '编辑' },
    { code: 'expenses:delete', name: '删除' },
    { code: 'expenses:export', name: '导出报表' },
  ]},
  { module: 'users', name: '用户管理', items: [
    { code: 'manage_users', name: '管理用户与权限' },
  ]},
]

export function flattenPermissionCodes(tree = PERMISSION_TREE) {
  const out = []
  for (const mod of tree) {
    for (const it of (mod.items || [])) out.push({ code: it.code, name: `${mod.name}-${it.name}` })
  }
  return out
}

// 计算每个模块的“查看”主权限编码
export function getModuleViewCode(module) {
  if (module === 'expenses') return 'expenses:list'
  if (module === 'buyfx') return 'view_fx'
  return `view_${module}`
}

export function buildPermissionIndex(tree = PERMISSION_TREE) {
  const modToCodes = new Map()
  const codeToModule = new Map()
  for (const m of tree) {
    const codes = (m.items || []).map(i => i.code)
    modToCodes.set(m.module, codes)
    for (const c of codes) codeToModule.set(c, m.module)
  }
  return { modToCodes, codeToModule }
}

export async function reseedPermissions({ reset = false } = {}) {
  const newPerms = flattenPermissionCodes(PERMISSION_TREE)
  const codes = newPerms.map(p => p.code)
  for (const p of newPerms) {
    await query(
      `insert into permissions(code, name) values($1,$2)
       on conflict(code) do update set name=excluded.name`,
      [p.code, p.name]
    )
  }
  let removed = 0
  if (reset) {
    const del = await query(
      `delete from permissions where code <> all($1::text[])`,
      [codes]
    )
    removed = del.rowCount || 0
  }
  const count = (await query('select count(*) from permissions')).rows?.[0]?.count || 0
  return { total: Number(count), insertedOrUpdated: newPerms.length, removed }
}
