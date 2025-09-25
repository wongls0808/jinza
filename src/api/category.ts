import { ref } from 'vue';
import { get } from '@/utils/request';
import type { ApiResponse, Category } from '@/types/api';

// 获取分类列表
export const useCategories = () => {
  const categories = ref<Category[]>([]);
  const loading = ref(false);
  const error = ref('');
  
  const fetchCategories = async () => {
    loading.value = true;
    error.value = '';
    
    try {
      const response = await get<ApiResponse<Category[]>>('/api/categories');
      
      if (response.code === 200) {
        categories.value = response.data;
        return response.data;
      } else {
        error.value = response.message || '获取分类列表失败';
        return [];
      }
    } catch (err: any) {
      error.value = err.message || '获取分类列表失败';
      return [];
    } finally {
      loading.value = false;
    }
  };
  
  return {
    categories,
    loading,
    error,
    fetchCategories
  };
};