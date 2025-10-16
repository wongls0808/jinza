import { query } from './db.js'

// 基于菜单的权限树（清晰分组，仅保留当前系统实际使用/校验的权限码）
export const PERMISSION_TREE = [
  { module: 'workbench', name: '工作台', items: [
    { code: 'view_dashboard', name: '查看' },
  ]},
  { module: 'customers', name: '客户管理', items: [
    { code: 'view_customers', name: '访问' },
  ]},
  { module: 'banks', name: '银行列表', items: [
    { code: 'view_banks', name: '访问' },
  ]},
  { module: 'accounts', name: '收款账户', items: [
    { code: 'view_accounts', name: '访问' },
  ]},
  { module: 'transactions', name: '交易管理', items: [
    { code: 'view_transactions', name: '访问' },
  ]},
  { module: 'fx', name: '结汇管理', items: [
    { code: 'view_fx', name: '查看' },
    { code: 'manage_fx', name: '编辑' },
    { code: 'delete_fx', name: '删除' },
  ]},
  { module: 'buyfx', name: '购汇管理', items: [
    // 目前沿用 FX 权限做控制，后续若拆分接口再切换到 buyfx:view / buyfx:manage
    { code: 'view_fx', name: '访问' },
  ]},
  { module: 'expenses', name: '费用管理', items: [
    { code: 'expenses:list', name: '查看' },
    { code: 'expenses:create', name: '新增' },
    { code: 'expenses:update', name: '编辑' },
    { code: 'expenses:delete', name: '删除' },
  ]},
  { module: 'users', name: '用户管理', items: [
    { code: 'manage_users', name: '管理用户与权限' },
  ]},
  { module: 'settings', name: '系统设置', items: [
    { code: 'view_settings', name: '访问' },
  ]},
]

export function flattenPermissionCodes(tree = PERMISSION_TREE) {
  const out = []
  for (const mod of tree) {
    for (const it of (mod.items || [])) out.push({ code: it.code, name: `${mod.name}-${it.name}` })
  }
  return out
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
