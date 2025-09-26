import axios from 'axios';
import { get, post, put, del } from '@/utils/request';
import type { LoginForm, LoginResponse, User, Role, Permission, Tenant } from '@/types/system';

// Simple switch: if VITE_API_BASE_URL is set, use real HTTP calls, otherwise use mock implementations
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const useMock = !API_BASE;

// Helper: delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// ---- Mock data (kept lightweight, mirrors store mocks) ----
let mockUsers: User[] = [
	{ id: 1, username: 'admin', nickname: '管理员', status: 1, roles: [1], tenants: [1,2], currentTenant: null },
	{ id: 2, username: 'test', nickname: '测试用户', status: 1, roles: [2], tenants: [1], currentTenant: null }
];

const mockRoles: Role[] = [
	{ id: 1, name: '管理员', code: 'admin', status: 1, permissions: [1,2,3,4], menuIds: [] },
	{ id: 2, name: '用户', code: 'user', status: 1, permissions: [1], menuIds: [] }
];

const mockPermissions: Permission[] = [
	{ id: 1, name: '查看用户', code: 'system:user:list', type: 'api', status: 1 },
	{ id: 2, name: '添加用户', code: 'system:user:add', type: 'api', status: 1 },
	{ id: 3, name: '编辑用户', code: 'system:user:edit', type: 'api', status: 1 },
	{ id: 4, name: '删除用户', code: 'system:user:delete', type: 'api', status: 1 }
];

// ---- API wrappers ----
export const login = async (form: LoginForm): Promise<LoginResponse> => {
	if (!useMock) {
		return post<LoginResponse>('/login', form);
	}

	await delay(800);
	const user = mockUsers.find(u => u.username === form.username && (form.password ? true : true));
	if (!user) throw new Error('用户名或密码错误');

		const tenants: Tenant[] = [
			{ id: 1, name: '示例公司1', code: 'company1', status: 1 as 0 | 1 },
			{ id: 2, name: '示例公司2', code: 'company2', status: 1 as 0 | 1 }
		];
		const permissions = user.id === 1 ? mockPermissions.map(p => p.code) : [(mockPermissions[0] && mockPermissions[0].code) || 'system:user:list'];
	const roles = user.id === 1 ? ['admin'] : ['user'];

	return { token: `mock-token-${user.id}`, user: { ...user, password: undefined } as any, tenants, permissions, roles };
};

export const getUserInfo = async (token: string): Promise<LoginResponse> => {
	if (!useMock) {
		return get<LoginResponse>('/me');
	}
	await delay(300);
	if (!token) throw new Error('无效的token');
	if (token.includes('1')) {
		return {
			token,
			user: { id: 1, username: 'admin', nickname: '管理员', status: 1, roles: [1], tenants: [1,2], currentTenant: null } as any,
			tenants: [{ id: 1, name: '示例公司1', code: 'company1', status: 1 }, { id: 2, name: '示例公司2', code: 'company2', status: 1 }],
			permissions: mockPermissions.map(p => p.code),
			roles: ['admin']
		};
	}
		return {
			token,
			user: { id: 2, username: 'test', nickname: '测试用户', status: 1, roles: [2], tenants: [1], currentTenant: null } as any,
			tenants: [{ id: 1, name: '示例公司1', code: 'company1', status: 1 as 0 | 1 }],
			permissions: [(mockPermissions[0] && mockPermissions[0].code) || 'system:user:list'],
			roles: ['user']
		};
};

export const logout = async () => {
	if (!useMock) return post('/logout');
	await delay(200);
};

export const switchTenant = async (tenantId: number) => {
	if (!useMock) return post('/tenant/switch', { tenantId });
	await delay(200);
};

// User CRUD
export const fetchUsers = async (query?: any) => {
	if (!useMock) return get('/users', query);
	await delay(200);
	let list = mockUsers.slice();
	if (query?.keyword) list = list.filter(u => (u.username || '').includes(query.keyword));
	return { total: list.length, items: list };
};

export const getUserById = async (id: number) => {
	if (!useMock) return get(`/users/${id}`);
	await delay(150);
	return mockUsers.find(u => Number(u.id) === Number(id)) || null;
};

export const createUser = async (payload: Partial<User>) => {
	if (!useMock) return post('/users', payload);
	await delay(200);
	const maxId = mockUsers.reduce((m, u) => Math.max(m, Number(u.id || 0)), 0);
	const newUser = { id: maxId + 1, username: payload.username || `user${maxId+1}`, nickname: payload.nickname || '', status: payload.status ?? 1, roles: payload.roles || [], tenants: payload.tenants || [], currentTenant: payload.currentTenant || null } as User;
	mockUsers.push(newUser);
	return newUser;
};

export const updateUser = async (id: number, payload: Partial<User>) => {
	if (!useMock) return put(`/users/${id}`, payload);
	await delay(200);
	const idx = mockUsers.findIndex(u => Number(u.id) === Number(id));
	if (idx === -1) throw new Error('用户不存在');
	mockUsers[idx] = { ...mockUsers[idx], ...payload } as User;
	return mockUsers[idx];
};

export const deleteUser = async (id: number) => {
	if (!useMock) return del(`/users/${id}`);
	await delay(150);
	const idx = mockUsers.findIndex(u => Number(u.id) === Number(id));
	if (idx === -1) throw new Error('用户不存在');
	mockUsers.splice(idx, 1);
	return true;
};

// Roles & Permissions
export const fetchRoles = async () => {
	if (!useMock) return get('/roles');
	await delay(150);
	return mockRoles.slice();
};

export const fetchPermissions = async () => {
	if (!useMock) return get('/permissions');
	await delay(120);
	return mockPermissions.slice();
};

export const assignRolesToUser = async (userId: number, roleIds: number[]) => {
	if (!useMock) return post(`/users/${userId}/roles`, { roleIds });
	await delay(200);
		const idx = mockUsers.findIndex(u => Number(u.id) === Number(userId));
		if (idx === -1) throw new Error('用户不存在');
		const target = mockUsers[idx];
		if (!target) throw new Error('用户不存在');
		target.roles = roleIds.slice();
	return mockUsers[idx];
};

export default {
	login,
	getUserInfo,
	logout,
	switchTenant,
	fetchUsers,
	getUserById,
	createUser,
	updateUser,
	deleteUser,
	fetchRoles,
	fetchPermissions,
	assignRolesToUser
};

