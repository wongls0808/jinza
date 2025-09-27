import { defineStore } from 'pinia';
import { customerApi } from '../api/http';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useCustomerStore = defineStore('customer', {
  state: () => ({
    items: [] as Customer[],
    loading: false,
    error: '' as string | null
  }),
  actions: {
    async fetchAll() {
      this.loading = true; this.error = null;
      try {
        this.items = await customerApi.list();
      } catch (e: any) {
        this.error = e?.message || '加载失败';
      } finally { this.loading = false; }
    },
    async create(payload: { name: string; email: string; phone?: string }) {
      const created = await customerApi.create(payload);
      this.items.unshift(created);
      return created;
    },
    async remove(id: number) {
      await customerApi.remove(id);
      this.items = this.items.filter(c => c.id !== id);
    }
  }
});
