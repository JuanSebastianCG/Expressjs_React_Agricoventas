import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ICategory, ICreateCategoryDto, IUpdateCategoryDto } from '../../interfaces/category';
import categoryService from '../../services/categoryService';
import CategoryForm from '../../components/admin/CategoryForm';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/StyledButton';
import { FiEdit, FiTrash2, FiPlusCircle, FiChevronDown, FiChevronRight } from 'react-icons/fi';

const ManageCategories: React.FC = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [allCategoriesForForm, setAllCategoriesForForm] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ICategory | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const fetchCategories = useCallback(async (includeChildren = true) => {
    setIsLoading(true);
    try {
      // Get categories with their children for main display
      const topLevelResponse = await categoryService.getCategories({ includeChildren: true, includeParent: true });
      
      if (topLevelResponse && Array.isArray(topLevelResponse.categories)) {
        console.log("[ManageCategories] Successfully loaded categories:", topLevelResponse.categories.length);
        setCategories(topLevelResponse.categories);
      } else {
        console.error("[ManageCategories] Failed to extract categories from response. Response structure:", topLevelResponse);
        setCategories([]);
      }

      // Get all categories (without children) for the dropdown in the form
      const allCategoriesResponse = await categoryService.getCategories({ includeChildren: false });
      
      if (allCategoriesResponse && Array.isArray(allCategoriesResponse.categories)) {
        console.log("[ManageCategories] Successfully loaded categories for form:", allCategoriesResponse.categories.length);
        setAllCategoriesForForm(allCategoriesResponse.categories);
      } else {
        console.error("[ManageCategories] Failed to extract categories for form dropdown. Response structure:", allCategoriesResponse);
        setAllCategoriesForForm([]);
      }

    } catch (error: any) {
      toast.error(`Error al cargar categorías: ${error.message || 'Error desconocido'}`);
      console.error("[ManageCategories] Error in fetchCategories function:", error);
      setCategories([]);
      setAllCategoriesForForm([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenModal = (category: ICategory | null = null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmitCategory = async (data: ICreateCategoryDto | IUpdateCategoryDto) => {
    setIsLoading(true);
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, data as IUpdateCategoryDto);
        toast.success('Categoría actualizada con éxito');
      } else {
        await categoryService.createCategory(data as ICreateCategoryDto);
        toast.success('Categoría creada con éxito');
      }
      fetchCategories();
      handleCloseModal();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      toast.error(`Error al guardar categoría: ${errorMsg}`);
      console.error("Error submitting category:", error);
    }
    setIsLoading(false);
  };

  const handleOpenConfirmDeleteModal = (category: ICategory) => {
    setCategoryToDelete(category);
    setIsConfirmDeleteModalOpen(true);
  };

  const handleCloseConfirmDeleteModal = () => {
    setIsConfirmDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsLoading(true);
    try {
      await categoryService.deleteCategory(categoryToDelete.id);
      toast.success('Categoría eliminada con éxito');
      fetchCategories();
      handleCloseConfirmDeleteModal();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      toast.error(`Error al eliminar categoría: ${errorMsg}`);
      console.error("Error deleting category:", error);
    }
    setIsLoading(false);
  };
  
  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const renderCategoryRow = (category: ICategory, level: number = 0) => (
    <React.Fragment key={category.id}>
      <tr className={`${level > 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}>
        <td style={{ paddingLeft: `${level * 20 + 16}px` }} className="py-3 px-4 border-b border-gray-200 text-sm">
          <div className="flex items-center">
            {category.children && category.children.length > 0 && (
              <button onClick={() => toggleExpand(category.id)} className="mr-2 text-gray-500 hover:text-gray-700">
                {expandedCategories[category.id] ? <FiChevronDown /> : <FiChevronRight />}
              </button>
            )}
            <span className="font-medium text-gray-700">{category.name}</span>
          </div>
        </td>
        <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-600 truncate max-w-xs">{category.description || '-'}</td>
        <td className="py-3 px-4 border-b border-gray-200 text-sm">
          <div className="flex items-center space-x-2">
            <Button variant="text" size="sm" onClick={() => handleOpenModal(category)} aria-label="Editar">
              <FiEdit className="w-4 h-4 text-blue-600" />
            </Button>
            <Button variant="text" size="sm" onClick={() => handleOpenConfirmDeleteModal(category)} aria-label="Eliminar">
              <FiTrash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </td>
      </tr>
      {expandedCategories[category.id] && category.children && category.children.map(child => renderCategoryRow(child, level + 1))}
    </React.Fragment>
  );

  if (isLoading && !categories.length) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div></div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Gestionar Categorías</h1>
        <Button 
          variant="primary" 
          color="primary" 
          onClick={() => handleOpenModal()} 
          leftIcon={<FiPlusCircle className="w-5 h-5"/>}
        >
          Nueva Categoría
        </Button>
      </div>

      {categories.length === 0 && !isLoading ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <FiPlusCircle className="mx-auto text-gray-400 w-12 h-12 mb-4" />
          <p className="text-gray-600 text-lg">No hay categorías registradas.</p>
          <p className="text-sm text-gray-500 mt-1">Crea la primera categoría para organizar tus productos.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map(category => renderCategoryRow(category))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        >
          <CategoryForm
            category={editingCategory}
            allCategories={allCategoriesForForm} // Pass all categories for parent selection
            onSubmit={handleSubmitCategory}
            onCancel={handleCloseModal}
            isLoading={isLoading}
          />
        </Modal>
      )}

      {isConfirmDeleteModalOpen && categoryToDelete && (
        <Modal
          isOpen={isConfirmDeleteModalOpen}
          onClose={handleCloseConfirmDeleteModal}
          title="Confirmar Eliminación"
          footer = {
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCloseConfirmDeleteModal} disabled={isLoading}>Cancelar</Button>
              <Button variant="danger" onClick={handleDeleteCategory} isLoading={isLoading} disabled={isLoading}>Eliminar</Button>
            </div>
          }
        >
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar la categoría "<strong>{categoryToDelete.name}</strong>"?
            Esta acción no se puede deshacer.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default ManageCategories; 