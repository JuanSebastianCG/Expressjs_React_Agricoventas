import api from './api';
import { ICategory, ICreateCategoryDto, IUpdateCategoryDto, CategoryQueryDto } from '../interfaces/category';

export const categoryService = {
  getCategories: async (params?: CategoryQueryDto): Promise<{ categories: ICategory[], total: number }> => {
    const response = await api.get('/categories', { params });
    
    // Extract categories from the response.data.data structure
    if (response.data && response.data.success && response.data.data) {
      // If data has categories and total properties, return them directly
      if (response.data.data.categories && typeof response.data.data.total === 'number') {
        return response.data.data;
      }
      
      // If data is an array, assume it's the categories list
      if (Array.isArray(response.data.data)) {
        return { 
          categories: response.data.data,
          total: response.data.data.length 
        };
      }
    }
    
    // Fallback to empty array if structure doesn't match
    console.warn('Unexpected API response structure in categoryService.getCategories:', response.data);
    return { categories: [], total: 0 };
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