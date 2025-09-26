useUserStore 开发文档

概述

`useUserStore()` 是项目中管理身份、租户、角色与权限的 Pinia store。当前实现包含 mock 后端逻辑，用于前端开发和 UI 联调。

位置

- `src/stores/user.ts`

导出的状态/方法契约（简要）

状态（refs / reactive）

- token: string
- user: User | null
- tenants: Tenant[]
- permissions: string[]
- roles: string[]
- isLoggedIn: boolean
- usersList: User[]  // 用于 UI 开发的 mock 用户集合
- rolesList: Role[]  // mock 角色集合
- permissionsList: Permission[] // mock 权限集合

身份与租户相关方法

- loginAction(loginForm: LoginForm): Promise<LoginResponse>
  - 说明：登录方法，成功后会设置 token、user、tenants、permissions、roles
  - 错误：用户名/密码错误、无访问该账套权限等会抛出 Error

- getUserInfoAction(): Promise<LoginResponse>
  - 说明：根据当前 token 获取用户信息并同步 store
  - 错误：无 token 时抛出 Error

- logoutAction(): void
  - 说明：清理本地状态并跳转到 `/login`

- switchTenantAction(tenantId: number): Promise<boolean>
  - 说明：切换当前账套（mock），会更新 `user.currentTenant`
  - 错误：如果用户未登录或没有该账套权限会抛出 Error

权限/角色检查

- hasPermission(permission: string): boolean
  - 说明：当前实现将 `roles` 中包含 `admin` 的用户视为超级管理员，默认拥有所有权限

- hasRole(role: string): boolean
  - 说明：检查 `roles` 字符串数组中是否包含指定 role

用户管理（mock CRUD）

- usersList: ref<User[]>
- fetchUsers(query?): Promise<{ total: number; items: User[] }>
- getUserById(id: number): Promise<User | null>
- createUser(payload: Partial<User>): Promise<User>
- updateUser(id: number, payload: Partial<User>): Promise<User>
- deleteUser(id: number): Promise<boolean>

角色/权限管理（mock）

- rolesList: ref<Role[]>
- permissionsList: ref<Permission[]>
- fetchRoles(): Promise<Role[]>
- getRoleById(id: number): Promise<Role | null>
- createRole(payload: Partial<Role>): Promise<Role>
- updateRole(id: number, payload: Partial<Role>): Promise<Role>
- deleteRole(id: number): Promise<boolean>
- assignRolesToUser(userId: number, roleIds: number[]): Promise<User>
  - 说明：覆盖式分配角色，会同步更新 `usersList` 中的 user.roles，并在当前登录用户被修改时，聚合并更新 `permissions` 字段

- fetchPermissions(): Promise<Permission[]>
- getPermissionById(id: number): Promise<Permission | null>

示例：在 Vue 组件中使用（分配角色）

```ts
import { useUserStore } from '@/stores/user';
const userStore = useUserStore();

// 打开分配角色对话框时预先拉取角色
const roles = await userStore.fetchRoles();
// 用户选择角色后提交：
await userStore.assignRolesToUser(123, [1,2]);
```

示例：响应式读取权限/角色

```ts
const userStore = useUserStore();
if (userStore.hasPermission('system:user:add')) {
  // 显示新增按钮
}
```

错误处理与调试建议

- 任何 store 方法在失败时会抛出 Error（例如登录失败、用户不存在），调用方应使用 try/catch 捕获并显示用户友好消息。
- mock 数据保存在 store 的 ref 中，便于在 UI 开发时直接修改以模拟不同场景（例如把 admin 用户的 roles 改为 [] 来测试权限不足）。
- 当把 mock 替换为真实后端时，请保持方法签名一致（Promise 返回类型），并在失败时抛出 Error 或使用统一的 error 结构。

后续改进建议

- 为 `fetchUsers` 添加分页与排序参数，并让 UI 支持分页请求（当前返回全部数据）。
- 增加 `assignTenantsToUser(userId, tenantIds)` 到 store，并在 UI 中调用。
- 添加单元测试覆盖 store 的主要逻辑（loginAction、assignRolesToUser、switchTenantAction 等）。
- 将 mock 替换为 axios/fetch 的真实后端调用，增加 loading 与错误状态管理。

文档生成于项目工作区，供前端开发与后端对接参考。
