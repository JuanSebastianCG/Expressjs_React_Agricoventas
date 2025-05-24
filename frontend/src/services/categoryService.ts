import api from './api';
import { ICategory, ICreateCategoryDto, IUpdateCategoryDto, CategoryQueryDto } from '../interfaces/category';

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt?: string;
  children?: Category[];
}

export interface CategoryResponse {
  success: boolean;
  data: {
    categories: Category[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

class CategoryService {
  /**
   * Obtiene todas las categorías
   * @returns Lista de categorías
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await api.get('/categories');
      
      if (response.data.success) {
        return response.data.data.categories || [];
      } else {
        throw new Error(response.data.error?.message || 'Error al obtener categorías');
      }
    } catch (error: any) {
      console.error('Error en getAllCategories:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Error al obtener categorías');
    }
  }

  /**
   * Obtiene una categoría específica por su ID
   * @param categoryId ID de la categoría
   * @returns Detalles de la categoría
   */
  async getCategoryById(categoryId: string): Promise<Category> {
    try {
      const response = await api.get(`/categories/${categoryId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Error al obtener la categoría');
      }
    } catch (error: any) {
      console.error('Error en getCategoryById:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Error al obtener la categoría');
    }
  }

  /**
   * Construye una estructura jerárquica de categorías
   * @param categories Lista plana de categorías
   * @returns Categorías organizadas jerárquicamente
   */
  buildCategoryHierarchy(categories: Category[]): Category[] {
    // Crear una copia para no modificar el original
    const categoriesCopy = JSON.parse(JSON.stringify(categories)) as Category[];
    
    // Mapa de categorías por ID para acceso rápido
    const categoryMap = new Map<string, Category>();
    
    // Añadir todas las categorías al mapa
    categoriesCopy.forEach(category => {
      category.children = [];
      categoryMap.set(category.id, category);
    });
    
    // Categorías raíz (sin padre)
    const rootCategories: Category[] = [];
    
    // Construir la jerarquía
    categoriesCopy.forEach(category => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
        } else {
          // Si el padre no existe, tratarlo como raíz
          rootCategories.push(category);
        }
      } else {
        // Categoría raíz (sin padre)
        rootCategories.push(category);
      }
    });
    
    return rootCategories;
  }

  /**
   * Obtiene categorías con opciones de filtrado
   * @param params Parámetros de filtrado
   * @returns Lista de categorías y total
   */
  async getCategories(params?: any): Promise<{ categories: Category[], total: number }> {
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
  }

  /**
   * Crea una nueva categoría
   * @param data Datos de la categoría
   * @returns La categoría creada
   */
  async createCategory(data: any): Promise<Category> {
    const response = await api.post('/categories', data);
    return response.data.data;
  }

  /**
   * Actualiza una categoría existente
   * @param id ID de la categoría
   * @param data Datos actualizados
   * @returns La categoría actualizada
   */
  async updateCategory(id: string, data: any): Promise<Category> {
    const response = await api.put(`/categories/${id}`, data);
    return response.data.data;
  }

  /**
   * Elimina una categoría
   * @param id ID de la categoría
   */
  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  }
}

export default new CategoryService(); 