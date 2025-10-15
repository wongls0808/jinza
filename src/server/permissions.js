import { query } from './db.js'

// 系统权限树（模块-动作）
export const PERMISSION_TREE = [
  { module: 'dashboard', name: '首页', items: [
    { code: 'view_dashboard', name: '查看首页' }
  ]},
  { module: 'users', name: '用户管理', items: [
    { code: 'users:list', name: '查看用户' },
    { code: 'users:create', name: '创建用户' },
    { code: 'users:update', name: '编辑用户' },
    { code: 'users:delete', name: '删除用户' },
    { code: 'users:resetPassword', name: '重置密码' },
    { code: 'perms:list', name: '查看权限清单' },
    { code: 'perms:assign', name: '分配权限' },
  ]},
  { module: 'customers', name: '客户管理', items: [
    { code: 'customers:list', name: '查看' },
    { code: 'customers:create', name: '新增' },
    { code: 'customers:update', name: '编辑' },
    { code: 'customers:delete', name: '删除' },
    { code: 'customers:import', name: '导入' },
    { code: 'customers:export', name: '导出' },
  ]},
  { module: 'banks', name: '银行列表', items: [
    { code: 'banks:list', name: '查看' },
    { code: 'banks:create', name: '新增' },
    { code: 'banks:update', name: '编辑' },
    { code: 'banks:delete', name: '删除' },
    { code: 'banks:resetDefaults', name: '重置默认' },
  ]},
  { module: 'accounts', name: '收款账户', items: [
    { code: 'accounts:list', name: '查看' },
    { code: 'accounts:create', name: '新增' },
    { code: 'accounts:update', name: '编辑' },
    { code: 'accounts:delete', name: '删除' },
  ]},
  { module: 'transactions', name: '交易管理', items: [
    { code: 'transactions:list', name: '查看' },
    { code: 'transactions:create', name: '新增' },
    { code: 'transactions:update', name: '编辑' },
    { code: 'transactions:delete', name: '删除' },
    { code: 'transactions:import', name: '导入' },
    { code: 'transactions:export', name: '导出' },
    { code: 'transactions:match', name: '匹配' },
    { code: 'transactions:unmatch', name: '取消匹配' },
  ]},
  { module: 'fx', name: '结汇管理', items: [
    { code: 'fx:view', name: '查看' },
    { code: 'fx:manage', name: '编辑' },
    { code: 'fx:delete', name: '删除' },
    { code: 'fx:platforms:list', name: '平台查看' },
    { code: 'fx:platforms:save', name: '平台新增/编辑' },
    { code: 'fx:platforms:delete', name: '平台删除' },
    { code: 'fx:buy:list', name: '购汇记录' },
    { code: 'fx:buy:create', name: '购汇新增' },
    { code: 'fx:convert', name: '平台内互换' },
    { code: 'fx:settlements:list', name: '结汇列表' },
    { code: 'fx:settlements:detail', name: '结汇详情' },
    { code: 'fx:settlements:export', name: '结汇导出' },
    { code: 'fx:settlements:create', name: '生成结汇单' },
    { code: 'fx:payments:list', name: '付款列表' },
    { code: 'fx:payments:detail', name: '付款详情' },
    { code: 'fx:payments:export', name: '付款导出' },
    { code: 'fx:payments:create', name: '生成付款单' },
    { code: 'fx:payments:approve', name: '付款审核' },
    { code: 'fx:payments:unapprove', name: '付款撤销' },
    { code: 'fx:payments:batchApprove', name: '付款批量审核' },
  ]},
  { module: 'settings', name: '系统设置', items: [
    { code: 'settings:view', name: '查看' },
    { code: 'currencies:list', name: '币种查看' },
    { code: 'currencies:create', name: '币种新增' },
    { code: 'currencies:delete', name: '币种删除' },
  ]},
]

// 兼容旧权限代码（前端/后端现存引用）
export const LEGACY_PERMISSIONS = [
  { code: 'manage_users', name: '用户管理(旧)' },
  { code: 'view_customers', name: '客户管理(旧)' },
  { code: 'view_banks', name: '银行列表(旧)' },
  { code: 'view_accounts', name: '收款账户(旧)' },
  { code: 'view_transactions', name: '交易管理(旧)-查看' },
  { code: 'manage_transactions', name: '交易管理(旧)-编辑' },
  { code: 'delete_transactions', name: '交易管理(旧)-删除' },
  { code: 'view_settings', name: '系统设置(旧)' },
  { code: 'view_fx', name: '结汇管理(旧)-查看' },
  { code: 'manage_fx', name: '结汇管理(旧)-编辑' },
  { code: 'delete_fx', name: '结汇管理(旧)-删除' },
  { code: 'view_dashboard', name: '查看首页(旧)' },
  { code: 'view_account_management', name: '入账管理(旧)' },
]

export function flattenPermissionCodes(tree = PERMISSION_TREE) {
  const out = []
  for (const mod of tree) {
    for (const it of (mod.items || [])) out.push({ code: it.code, name: `${mod.name}-${it.name}` })
  }
  return out
}

export async function reseedPermissions({ reset = false } = {}) {
  // 确保 permissions 表存在（由 ensureSchema 负责，一般已存在）
  const newPerms = [...flattenPermissionCodes(PERMISSION_TREE), ...LEGACY_PERMISSIONS]
  const codes = newPerms.map(p => p.code)
  // upsert 所有新权限
  for (const p of newPerms) {
    await query(
      `insert into permissions(code, name) values($1,$2)
       on conflict(code) do update set name=excluded.name`,
      [p.code, p.name]
    )
  }
  // 可选：移除不在新清单中的旧权限（将级联删除 user_permissions）
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
