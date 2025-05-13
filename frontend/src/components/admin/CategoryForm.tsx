import React, { useState, useEffect } from 'react';
import { ICategory, ICreateCategoryDto, IUpdateCategoryDto } from '../../interfaces/category';
import TextField from '../ui/StyledInput';
import TextareaField from '../ui/StyledTextArea';
import Button from '../ui/StyledButton';
import FormField from '../ui/FormField';

interface CategoryFormProps {
  category?: ICategory | null;
  allCategories: ICategory[]; // For parent selection, excluding current category and its children if editing
  onSubmit: (data: ICreateCategoryDto | IUpdateCategoryDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  allCategories,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [parentId, setParentId] = useState<string | null | undefined>(
    category?.parentId
  );

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
      setParentId(category.parentId);
    } else {
      setName('');
      setDescription('');
      setParentId(null);
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: ICreateCategoryDto | IUpdateCategoryDto = {
      name,
      description: description || null,
      parentId: parentId || null,
    };
    onSubmit(data);
  };

  // Filter out the current category and its children from parent options
  const getParentOptions = () => {
    let filtered = allCategories;
    if (category) {
      const childrenIds: string[] = [];
      const collectChildrenIds = (cat: ICategory) => {
        if (cat.children) {
          cat.children.forEach(child => {
            childrenIds.push(child.id);
            collectChildrenIds(child);
          });
        }
      };
      collectChildrenIds(category); // This needs the category object to have children pre-fetched if they exist
      // For simplicity, we might need to fetch children separately or adjust logic.
      // For now, just excluding the category itself.
      filtered = allCategories.filter(c => c.id !== category.id && !childrenIds.includes(c.id));
    }
    return filtered.map(c => ({ value: c.id, label: c.name }));
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextField
        label="Nombre de la Categoría"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Ej: Frutas Frescas"
      />
      <TextareaField
        label="Descripción (Opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Una breve descripción de la categoría"
        rows={3}
      />
      <FormField
        type="select"
        label="Categoría Padre (Opcional)"
        name="parentId"
        value={parentId || ''}
        onChange={(e) => setParentId(e.target.value || null)}
        options={[
          { value: '', label: 'Ninguna (Categoría Principal)' },
          ...getParentOptions(),
        ]}
      />
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="solid" color="primary" isLoading={isLoading} disabled={isLoading}>
          {category ? 'Actualizar Categoría' : 'Crear Categoría'}
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm; 