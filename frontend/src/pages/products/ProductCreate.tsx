import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import FormField from '../../components/ui/FormField';
import StyledInput from '../../components/ui/StyledInput';
import StyledTextArea from '../../components/ui/StyledTextArea';
import StyledButton from '../../components/ui/StyledButton';
import StyledBorder from '../../components/ui/StyledBorder';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';
import { certificationService } from '../../services/certificationService';
import { categoryService } from '../../services/categoryService';
import { ICategory } from '../../interfaces/category';
import Header from '../../components/layout/Header';
import UserProfile from '../../components/common/UserProfile';

interface Certification {
  id: string;
  name: string;
}

const ProductCreate: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const isEditMode = !!productId;
  const { isAuthenticated, user } = useAppContext();
  
  // Certification checking state
  const [isCertificateChecking, setIsCertificateChecking] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    region: '',
    quality: '',
    price: '',
    availableQuantity: '',
    unitMeasure: '',
    isFeatured: false
  });
  
  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Categories state
  const [categoriesList, setCategoriesList] = useState<ICategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string>('');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      setCategoriesList([]);
      try {
        const rawResponse = await categoryService.getCategories({
          includeChildren: true,
          includeParent: true
        });
        
        const response: any = rawResponse;

        let extractedCategories: ICategory[] = [];
        if (response && response.success && response.data) {
          if (Array.isArray(response.data.categories)) {
            extractedCategories = response.data.categories;
          } 
          else if (Array.isArray(response.data)) {
            extractedCategories = response.data;
          } 
          else if (typeof response.data === 'object' && response.data !== null) {
            console.error("[ProductCreate] Could not find categories array within response.data. Structure of response.data:", response.data);
          } else {
            console.error("[ProductCreate] response.data was present but not in a recognized array format. Content:", response.data);
          }
        } else {
          console.error("[ProductCreate] Main response object is not in expected {success: true, data: ...} format, or success/data is missing/false:", response);
        }
        
        if (extractedCategories.length === 0 && response && response.success) {
            console.warn("[ProductCreate] Successfully fetched response, but no categories were extracted. Check the structure of 'response.data'. Response was:", response);
        }

        setCategoriesList(extractedCategories);
      } catch (error) {
        console.error("[ProductCreate] Error fetching categories:", error);
        setCategoriesList([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const topLevelCategories = useMemo(() => {
    return categoriesList;
  }, [categoriesList]);

  const childCategoriesMap = useMemo(() => {
    const map = new Map<string, ICategory[]>();
    if (categoriesList) {
        categoriesList.forEach(parentCategory => {
          if (parentCategory.children && Array.isArray(parentCategory.children) && parentCategory.children.length > 0) {
            map.set(parentCategory.id, parentCategory.children);
          } else {
            map.set(parentCategory.id, []); 
          }
        });
    }
    return map;
  }, [categoriesList]);

  const currentChildCategories = useMemo(() => {
    if (!selectedParentCategoryId) return [];
    const children = childCategoriesMap.get(selectedParentCategoryId) || [];
    return children;
  }, [selectedParentCategoryId, childCategoriesMap]);

  // Check if user is authenticated and a seller
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.userType !== 'SELLER' && user?.userType !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  // Check if user has all required certifications
  useEffect(() => {
    const checkCertifications = async () => {
      if (isAuthenticated && user?.id) {
        try {
          setIsCertificateChecking(true);
          
          // Skip check for admins
          if (user.userType === 'ADMIN') {
            setIsCertificateChecking(false);
            return;
          }
          
          const certificationStatus = await certificationService.verifyUserCertifications(user.id);
          
          if (!certificationStatus.hasAllCertifications) {
            console.log("User doesn't have all required certifications. Redirecting to certificate upload page.");
            // Show a message and redirect to certificate upload page
            alert(`Para crear o editar productos necesitas tener los 4 certificados colombianos verificados. Actualmente tienes ${certificationStatus.certificationsCount.verified} de ${certificationStatus.certificationsCount.total}. Serás redirigido para completar tus certificados.`);
            navigate('/certificados');
          }
        } catch (err) {
          console.error("Error checking user certifications:", err);
          alert(`Error al verificar tus certificados. Por favor, intenta nuevamente más tarde o contacta a soporte.`);
          navigate('/dashboard');
        } finally {
          setIsCertificateChecking(false);
        }
      }
    };
    
    checkCertifications();
  }, [isAuthenticated, user, navigate]);

  // Load product data in edit mode
  useEffect(() => {
    // Ensure categories are loaded before trying to load product data that depends on them
    if (isEditMode && productId && !isCertificateChecking && categoriesList.length > 0) {
      loadProductData(productId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [isEditMode, productId, isCertificateChecking, categoriesList]); // loadProductData is stable but not memoized, added categoriesList

  const loadProductData = async (productId: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/products/${productId}`);
      
      if (response.data.success) {
        const product = response.data.data;
        const productCategoryId = product.categoryId || '';
        
        let parentIdToSet = '';
        // Attempt to find if the product's category is a child
        const productCategory = categoriesList.find(c => c.id === productCategoryId);
        if (productCategory && productCategory.parentId) {
          parentIdToSet = productCategory.parentId;
        }

        setFormData({
          name: product.name || '',
          categoryId: productCategoryId, // This will be the actual categoryId (child or parent)
          description: product.description || '',
          region: product.region || '',
          quality: product.quality || '',
          price: product.price?.toString() || '',
          availableQuantity: product.availableQuantity?.toString() || '',
          unitMeasure: product.unitMeasure || '',
          isFeatured: product.isFeatured || false
        });
        
        // Set parent category for the dropdown if applicable
        if (parentIdToSet) {
          setSelectedParentCategoryId(parentIdToSet);
        } else if (productCategoryId && !productCategory?.parentId) {
          // It's a top-level category
          setSelectedParentCategoryId(productCategoryId);
        }

        // Set existing images
        if (product.images && Array.isArray(product.images)) {
          setExistingImages(product.images);
        }
      } else {
        setSubmitError('Error al cargar los datos del producto');
        navigate('/pages/products/my-products');
      }
    } catch (err) {
      setSubmitError('Error al cargar los datos del producto');
      console.error('Error loading product data:', err);
      navigate('/pages/products/my-products');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'parentCategory') {
      setSelectedParentCategoryId(value);
      // When parent category changes, check for its children
      const childrenOfSelectedParent = childCategoriesMap.get(value) || [];
      if (childrenOfSelectedParent.length === 0) {
        // If no children, the selected parent IS the category
        setFormData(prev => ({ ...prev, categoryId: value }));
      } else {
        // If children exist, clear current categoryId, user must select a subcategory
        setFormData(prev => ({ ...prev, categoryId: '' })); 
      }
    } else if (name === 'categoryId') {
      // This is for the sub-category dropdown or a parent category that has no children
      setFormData(prev => ({ ...prev, categoryId: value }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }

    // Clear error for the field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    handleFiles(files);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    // Create preview URLs
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Remove preview image
  const removeImage = (index: number) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    
    // Remove the file and preview
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    
    const newPreviewUrls = [...previewUrls];
    newPreviewUrls.splice(index, 1);
    setPreviewUrls(newPreviewUrls);
  };

  // Remove existing image
  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.categoryId) newErrors.categoryId = 'La categoría es requerida';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    if (!formData.region) newErrors.region = 'La región es requerida';
    if (!formData.price.trim()) {
      newErrors.price = 'El precio es requerido';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'El precio debe ser un número mayor que cero';
    }
    if (!formData.availableQuantity.trim()) {
      newErrors.availableQuantity = 'La cantidad disponible es requerida';
    } else if (isNaN(parseFloat(formData.availableQuantity)) || parseFloat(formData.availableQuantity) <= 0) {
      newErrors.availableQuantity = 'La cantidad disponible debe ser un número mayor que cero';
    }
    if (!formData.unitMeasure) newErrors.unitMeasure = 'La unidad de medida es requerida';
    
    // Validate that at least one image is provided (either existing or new)
    if (existingImages.length === 0 && selectedFiles.length === 0) {
      newErrors.images = 'Debes proporcionar al menos una imagen del producto';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Double-check certifications before submission
    if (user?.userType !== 'ADMIN' && isAuthenticated && user?.id) {
      try {
        const certificationStatus = await certificationService.verifyUserCertifications(user.id);
        
        if (!certificationStatus.hasAllCertifications) {
          setSubmitError('Para crear productos necesitas tener los 4 certificados colombianos verificados');
          alert(`Para crear productos necesitas tener los 4 certificados colombianos verificados. Serás redirigido para completar tus certificados.`);
          navigate('/certificados');
          return;
        }
      } catch (err) {
        console.error("Error checking user certifications during form submission:", err);
        setSubmitError('Error al verificar tus certificados. Por favor, intenta nuevamente.');
        return;
      }
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const formDataToSend = new FormData();
      
      // Append product data
      formDataToSend.append('name', formData.name);
      formDataToSend.append('categoryId', formData.categoryId);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('region', formData.region);
      formDataToSend.append('quality', formData.quality);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('availableQuantity', formData.availableQuantity);
      formDataToSend.append('unitMeasure', formData.unitMeasure);
      formDataToSend.append('isFeatured', formData.isFeatured.toString());
      
      // Append images
      selectedFiles.forEach(file => {
        formDataToSend.append('images', file);
      });
      
      // Append existing images to keep
      existingImages.forEach(image => {
        formDataToSend.append('existingImages[]', image);
      });
      
      let response;
      
      if (isEditMode && productId) {
        response = await api.put(`/api/products/${productId}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await api.post('/api/products', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      if (response.data.success) {
        setSubmitSuccess(true);
        
        // Redirect after a brief delay
        setTimeout(() => {
          navigate('/pages/products/my-products');
        }, 1500);
      } else {
        throw new Error(response.data.error?.message || 'Error al guardar el producto');
      }
    } catch (err) {
      console.error('Error submitting product:', err);
      setSubmitError(err instanceof Error ? err.message : 'Error al guardar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Clean up preview URLs to avoid memory leaks
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    navigate('/pages/products/my-products');
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* User Profile Section */}
        <Card className="mb-6">
          <div className="p-4">
            <UserProfile user={user} variant="detailed" showActions={false} />
          </div>
        </Card>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Editar Producto' : 'Crear Nuevo Producto'}
          </h1>
        </div>

        {/* Form Card */}
        <Card className="mb-8">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6">
              {submitError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                  <p>{submitError}</p>
                </div>
              )}

              {submitSuccess && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
                  <p>
                    {isEditMode
                      ? 'Producto actualizado correctamente. Redireccionando...'
                      : 'Producto creado correctamente. Redireccionando...'}
                  </p>
                </div>
              )}

              {/* Basic Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Información Básica</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Nombre del Producto"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    error={errors.name}
                    required
                  />
                  
                  {/* Parent Category Dropdown */}
                  <FormField
                    label="Categoría Principal"
                    name="parentCategory"
                    value={selectedParentCategoryId}
                    onChange={handleInputChange}
                    error={errors.categoryId}
                  >
                    <select
                      name="parentCategory"
                      value={selectedParentCategoryId}
                      onChange={handleInputChange}
                      className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-1 ${
                        errors.categoryId ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={isLoadingCategories}
                    >
                      <option value="">
                        {isLoadingCategories ? "Cargando categorías..." : "Selecciona Categoría Principal"}
                      </option>
                      {!isLoadingCategories && topLevelCategories.length === 0 && (
                        <option value="" disabled>No hay categorías principales disponibles</option>
                      )}
                      {topLevelCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {/* Child Category Dropdown - only if parent selected and has children */}
                  {selectedParentCategoryId && (
                    <FormField
                      label="Subcategoría"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      error={errors.categoryId}
                      required={currentChildCategories.length > 0}
                    >
                      <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-1 ${
                          errors.categoryId ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={isLoadingCategories || !selectedParentCategoryId || currentChildCategories.length === 0}
                      >
                        <option value="">
                          {isLoadingCategories
                            ? "Cargando subcategorías..."
                            : currentChildCategories.length > 0
                              ? "Selecciona Subcategoría"
                              : "No hay subcategorías disponibles"}
                        </option>
                        {currentChildCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  )}
                </div>

                <div className="mt-6">
                  <StyledTextArea
                    label="Descripción"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    error={errors.description}
                    required
                  />
                </div>
              </div>

              {/* Product Details */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Detalles del Producto</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Región <span className="text-red-1">*</span>
                    </label>
                    <select
                      name="region"
                      value={formData.region}
                      onChange={handleInputChange}
                      className={`w-full py-2 px-3 border ${
                        errors.region ? 'border-red-500' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-green-1`}
                      required
                    >
                      <option value="">Seleccionar Región</option>
                      <option value="Antioquia">Antioquia</option>
                      <option value="Nariño">Nariño</option>
                      <option value="Cundinamarca">Cundinamarca</option>
                      <option value="Valle">Valle</option>
                      <option value="Cauca">Cauca</option>
                    </select>
                    {errors.region && (
                      <p className="mt-1 text-sm text-red-500">{errors.region}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calidad
                    </label>
                    <select
                      name="quality"
                      value={formData.quality}
                      onChange={handleInputChange}
                      className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-1"
                    >
                      <option value="">Seleccionar Calidad</option>
                      <option value="Premium">Premium</option>
                      <option value="Estándar">Estándar</option>
                      <option value="Económico">Económico</option>
                    </select>
                  </div>

                  <StyledInput
                    label="Precio (COP)"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    error={errors.price}
                    required
                  />

                  <StyledInput
                    label="Cantidad Disponible"
                    name="availableQuantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.availableQuantity}
                    onChange={handleInputChange}
                    error={errors.availableQuantity}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad de Medida <span className="text-red-1">*</span>
                    </label>
                    <select
                      name="unitMeasure"
                      value={formData.unitMeasure}
                      onChange={handleInputChange}
                      className={`w-full py-2 px-3 border ${
                        errors.unitMeasure ? 'border-red-500' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-green-1`}
                      required
                    >
                      <option value="">Seleccionar Unidad</option>
                      <option value="kg">Kilogramo (kg)</option>
                      <option value="gr">Gramo (gr)</option>
                      <option value="lb">Libra (lb)</option>
                      <option value="unidad">Unidad</option>
                      <option value="bulto">Bulto</option>
                      <option value="arroba">Arroba</option>
                    </select>
                    {errors.unitMeasure && (
                      <p className="mt-1 text-sm text-red-500">{errors.unitMeasure}</p>
                    )}
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-green-1 focus:ring-green-1 border-gray-300 rounded"
                    />
                    <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
                      Producto Destacado
                    </label>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Imágenes del Producto</h2>
                
                {errors.images && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                    <p>{errors.images}</p>
                  </div>
                )}

                {/* Existing images */}
                {existingImages.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-md font-medium mb-2 text-gray-700">Imágenes existentes</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {existingImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={image} 
                            alt={`Existing product image ${index + 1}`} 
                            className="w-full h-32 object-cover rounded border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute top-1 right-1 bg-red-1 text-white rounded-full p-1 shadow-md hover:bg-red-0-9"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image upload area */}
                <StyledBorder
                  variant={dragActive ? 'focus' : 'default'}
                  className={`border-2 border-dashed p-6 flex flex-col justify-center items-center ${
                    dragActive ? 'bg-green-0-4' : ''
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-1 text-sm text-gray-600">
                      Arrastra y suelta imágenes aquí, o{' '}
                      <label htmlFor="file-upload" className="cursor-pointer text-green-1 font-medium hover:underline">
                        selecciona archivos
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                  </div>
                </StyledBorder>

                {/* Image previews */}
                {previewUrls.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2 text-gray-700">Imágenes seleccionadas</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={url} 
                            alt={`Preview ${index + 1}`} 
                            className="w-full h-32 object-cover rounded border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-1 text-white rounded-full p-1 shadow-md hover:bg-red-0-9"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <StyledButton
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </StyledButton>
                <StyledButton
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? (isEditMode ? 'Actualizando...' : 'Creando...')
                    : (isEditMode ? 'Actualizar Producto' : 'Crear Producto')
                  }
                </StyledButton>
              </div>
            </form>
          )}
        </Card>
      </div>
    </>
  );
};

export default ProductCreate; 