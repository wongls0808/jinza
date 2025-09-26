import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// mock router to avoid createWebHistory / history access in test environment
vi.mock('@/router', () => ({
  default: {
    push: () => {}
  }
}));

import { useUserStore } from '../src/stores/user';

describe('useUserStore (mock)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('loginAction should login and set token/user', async () => {
    const store = useUserStore();
    const res = await store.loginAction({ username: 'admin', password: '123456' });
    expect(res.token).toContain('mock-token');
    expect(store.isLoggedIn).toBe(true);
    expect(store.user?.username).toBe('admin');
  });

  it('assignRolesToUser should update user roles and permissions aggregation', async () => {
    const store = useUserStore();
    // ensure there's a target user
    const created = await store.createUser({ username: 'u1' });
    expect(created).toBeDefined();

    // assign role id 1 (which has permissions [1,2,3,4] in mock)
    const updated = await store.assignRolesToUser(Number(created.id), [1]);
    expect(updated.roles).toEqual([1]);

    // if currently logged in user is the same, permissions should aggregate; otherwise permissions may be empty
    // mark current user to created for testing aggregation
    store.user = created as any;
    const aggregated = await store.assignRolesToUser(Number(created.id), [1]);
    expect(store.permissions.length).toBeGreaterThan(0);
  });

  it('switchTenantAction should throw when user not logged in', async () => {
    const store = useUserStore();
    // ensure logged out
    store.logoutAction();
    await expect(store.switchTenantAction(1)).rejects.toThrow();
  });
});
