import api from './api';
import { ICategory, ICreateCategoryDto, IUpdateCategoryDto, CategoryQueryDto } from '../interfaces/category';

export const categoryService = {
  getCategories: async (params?: CategoryQueryDto): Promise<{ categories: ICategory[], total: number }> => {
    const response = await api.get('/categories', { params });
    return response.data; // Changed from response.data.data since we want { categories: [], total: 0 }
  },

  getCategoryById: async (id: string): Promise<ICategory> => {
    const response = await api.get(`/categories/${id}`);
    return response.data.data; // Assuming API returns { success: boolean, data: ICategory }
  },

  createCategory: async (data: ICreateCategoryDto): Promise<ICategory> => {
    const response = await api.post('/categories', data);
    return response.data.data; // Assuming API returns { success: boolean, data: ICategory }
  },

  updateCategory: async (id: string, data: IUpdateCategoryDto): Promise<ICategory> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data.data; // Assuming API returns { success: boolean, data: ICategory }
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
}; 