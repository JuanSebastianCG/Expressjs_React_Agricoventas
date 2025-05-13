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

// Placeholder ILocation - replace with your actual interface
interface ILocation {
  id: string;
  addressLine1: string; // Or a more descriptive name for the dropdown
  city: string;
  department: string;
}
// Placeholder locationService - replace with your actual service
const locationService = {
  async getUserLocations(userId: string): Promise<ILocation[]> {
    console.log("[ProductCreate] Mock: Fetching locations for user:", userId);
    // Replace with actual API call
    // Example: return api.get(`/api/locations/user/${userId}`).then(res => res.data.data || []);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    // Mock data for now
    if (userId === "mockUserIdWithLocations") {
      return [
        { id: 'loc1', addressLine1: 'Finca La Esperanza', city: 'Salento', department: 'Quindío' },
        { id: 'loc2', addressLine1: 'Bodega Central', city: 'Armenia', department: 'Quindío' },
      ];
    }
    return [];
  },
  async createLocation(data: Partial<ILocation>): Promise<ILocation> {
    console.log("[ProductCreate] Mock: Creating new location:", data);
    // Replace with actual API call
    // Example: return api.post('/api/locations', data).then(res => res.data.data);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    return { id: `new_loc_${Date.now()}`, ...data } as ILocation;
  }
};
// Placeholder LocationFormModal - replace with your actual component
const LocationFormModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (newLocation: ILocation) => void, userId: string | undefined }> = ({ isOpen, onClose, onSubmit, userId }) => {
  if (!isOpen) return null;
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');

  const handleSubmit = async () => {
    // Basic validation
    if (!address || !city || !department || !userId) {
      alert("Todos los campos son requeridos para la ubicación.");
      return;
    }
    try {
      const newLoc = await locationService.createLocation({ addressLine1: address, city, department /*, userId - if backend needs it directly */ });
      onSubmit(newLoc);
    } catch (e) {
      alert("Error creando ubicación");
      console.error(e);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '400px' }}>
        <h3>Crear Nueva Ubicación</h3>
        <input type="text" placeholder="Nombre/Dirección" value={address} onChange={e => setAddress(e.target.value)} style={{ display: 'block', width: '90%', marginBottom: '10px', padding: '8px' }} />
        <input type="text" placeholder="Ciudad" value={city} onChange={e => setCity(e.target.value)} style={{ display: 'block', width: '90%', marginBottom: '10px', padding: '8px' }} />
        <input type="text" placeholder="Departamento" value={department} onChange={e => setDepartment(e.target.value)} style={{ display: 'block', width: '90%', marginBottom: '20px', padding: '8px' }} />
        <button onClick={handleSubmit} style={{ padding: '10px 15px', marginRight: '10px' }}>Guardar Ubicación</button>
        <button onClick={onClose} style={{ padding: '10px 15px' }}>Cancelar</button>
      </div>
    </div>
  );
};

const ProductCreate: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const isEditMode = !!productId;
  const { isAuthenticated, user } = useAppContext();
  
  const [isCertificateChecking, setIsCertificateChecking] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    originLocationId: '',
    quality: '',
    price: '',
    availableQuantity: '',
    unitMeasure: '',
    isFeatured: false
  });

  // Location specific state
  const [userLocations, setUserLocations] = useState<ILocation[]>([]);
  const [isLoadingUserLocations, setIsLoadingUserLocations] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [categoriesList, setCategoriesList] = useState<ICategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.userType !== 'SELLER' && user?.userType !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const checkCertifications = async () => {
      if (isAuthenticated && user?.id) {
        try {
          setIsCertificateChecking(true);
          if (user.userType === 'ADMIN') {
            setIsCertificateChecking(false);
            return;
          }
          const certificationStatus = await certificationService.verifyUserCertifications(user.id);
          if (!certificationStatus.hasAllCertifications) {
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

  // Fetch Categories
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
          console.error("[ProductCreate] Main response object for categories is not in expected {success: true, data: ...} format, or success/data is missing/false:", response);
        }
        if (extractedCategories.length === 0 && response && response.success) {
            console.warn("[ProductCreate] Successfully fetched categories response, but no categories were extracted. Check structure of 'response.data'. Response was:", response);
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

  // Fetch User Locations
  useEffect(() => {
    const fetchUserLocations = async () => {
      if (user?.id) {
        setIsLoadingUserLocations(true);
        try {
          // Replace 'mockUserIdWithLocations' with user.id for real use
          const locations = await locationService.getUserLocations(user.id); 
          setUserLocations(locations);
          // If editing and product has an originLocationId, try to pre-select it
          // This part might need adjustment based on how productData is loaded for edit mode
          if (isEditMode && formData.originLocationId && locations.some(loc => loc.id === formData.originLocationId)) {
            // Already set, or will be set by loadProductData
          } else if (locations.length > 0 && !isEditMode) {
            // Optionally, pre-select the first location for new products
            // setFormData(prev => ({ ...prev, originLocationId: locations[0].id }));
          }
        } catch (error) {
          console.error("[ProductCreate] Error fetching user locations:", error);
          // Optionally set an error state for locations
        } finally {
          setIsLoadingUserLocations(false);
        }
      }
    };
    if (!isCertificateChecking) { // Fetch locations after certificate check
        fetchUserLocations();
    }
  }, [user?.id, isCertificateChecking, isEditMode]); // formData.originLocationId removed from deps to avoid loop

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
  
  const loadProductData = useCallback(async (productIdToLoad: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/products/${productIdToLoad}`);
      if (response.data.success) {
        const product = response.data.data;
        const productCategoryId = product.categoryId || '';
        let parentIdToSet = '';
        const productCategory = categoriesList.find(c => c.id === productCategoryId);
        if (productCategory && productCategory.parentId) {
          parentIdToSet = productCategory.parentId;
        }

        setFormData({
          name: product.name || '',
          categoryId: productCategoryId,
          description: product.description || '',
          originLocationId: product.originLocationId || '',
          quality: product.quality || '',
          price: product.basePrice?.toString() || '',
          availableQuantity: product.stockQuantity?.toString() || '',
          unitMeasure: product.unitMeasure || '',
          isFeatured: product.isFeatured || false
        });
        
        if (parentIdToSet) {
          setSelectedParentCategoryId(parentIdToSet);
        } else if (productCategoryId && !productCategory?.parentId) {
          setSelectedParentCategoryId(productCategoryId);
        }

        if (product.images && Array.isArray(product.images)) {
          // Assuming images are full URLs. If they are just paths, adjust accordingly.
          setExistingImages(product.images.map((img: any) => img.imageUrl || img));
        }
      } else {
        setSubmitError('Error al cargar los datos del producto para editar.');
        navigate('/pages/products/my-products');
      }
    } catch (err) {
      setSubmitError('Error grave al cargar los datos del producto.');
      console.error('Error loading product data for edit:', err);
      navigate('/pages/products/my-products');
    } finally {
      setIsLoading(false);
    }
  }, [categoriesList, navigate]); // Removed loadProductData from its own deps
  
  useEffect(() => {
    if (isEditMode && productId && !isCertificateChecking && categoriesList.length > 0) {
        // Delay loading product data until user locations are also potentially loaded, or handle pre-selection better
        if (!isLoadingUserLocations) { // Ensure locations are fetched before trying to match product's location
            loadProductData(productId);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [isEditMode, productId, isCertificateChecking, categoriesList, isLoadingUserLocations]); // loadProductData is stable, added isLoadingUserLocations

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    console.log(`[ProductCreate] handleInputChange: name=${name}, value=${value}, type=${type}`);

    if (name === 'parentCategory') {
      setSelectedParentCategoryId(value);
      const childrenOfSelectedParent = childCategoriesMap.get(value) || [];
      console.log("[ProductCreate] Children of selected parent (", value, "):", childrenOfSelectedParent.map(c=>c.name));
      if (childrenOfSelectedParent.length === 0) {
        setFormData(prev => ({ ...prev, categoryId: value }));
        console.log("[ProductCreate] Parent category has no children. Set categoryId to:", value);
      } else {
        setFormData(prev => ({ ...prev, categoryId: '' })); 
        console.log("[ProductCreate] Parent category has children. Cleared categoryId. User must select a subcategory.");
      }
    } else if (name === 'categoryId') {
      setFormData(prev => ({ ...prev, categoryId: value }));
      console.log("[ProductCreate] Set categoryId (likely from subcategory selection) to:", value);
    } else if (name === 'originLocationId') {
        if (value === "CREATE_NEW_LOCATION") {
            setIsLocationModalOpen(true);
        } else {
            setFormData(prev => ({ ...prev, originLocationId: value }));
        }
    }
    else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNewLocationCreated = (newLocation: ILocation) => {
    setUserLocations(prev => [...prev, newLocation]);
    setFormData(prev => ({ ...prev, originLocationId: newLocation.id }));
    setIsLocationModalOpen(false);
    // Optionally, show a success toast/message for location creation
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    handleFiles(files);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    const newFiles = [...selectedFiles]; newFiles.splice(index, 1); setSelectedFiles(newFiles);
    const newPreviewUrls = [...previewUrls]; newPreviewUrls.splice(index, 1); setPreviewUrls(newPreviewUrls);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.categoryId) newErrors.categoryId = 'La categoría es requerida (selecciona una subcategoría si aplica)';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    if (!formData.originLocationId) newErrors.originLocationId = 'La ubicación de origen es requerida'; // Validates the selection
    if (!formData.price.trim()) newErrors.price = 'El precio es requerido';
    else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) newErrors.price = 'El precio debe ser un número mayor que cero';
    if (!formData.availableQuantity.trim()) newErrors.availableQuantity = 'La cantidad disponible es requerida';
    else if (isNaN(parseFloat(formData.availableQuantity)) || parseFloat(formData.availableQuantity) < 0) newErrors.availableQuantity = 'La cantidad disponible debe ser un número positivo o cero'; // Allow 0
    if (!formData.unitMeasure) newErrors.unitMeasure = 'La unidad de medida es requerida';
    if (existingImages.length === 0 && selectedFiles.length === 0) newErrors.images = 'Debes proporcionar al menos una imagen del producto';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
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
        setSubmitError('Error al verificar tus certificados. Por favor, intenta nuevamente.');
        return;
      }
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('categoryId', formData.categoryId);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('originLocationId', formData.originLocationId);
      formDataToSend.append('quality', formData.quality);
      formDataToSend.append('basePrice', formData.price); 
      formDataToSend.append('stockQuantity', formData.availableQuantity);
      formDataToSend.append('unitMeasure', formData.unitMeasure);
      formDataToSend.append('isFeatured', formData.isFeatured.toString());
      
      if (user && user.id) {
        formDataToSend.append('sellerId', user.id);
      } else {
        console.error("User ID not available for sellerId");
        setSubmitError('Error: No se pudo identificar al vendedor. Por favor, reintenta.');
        setIsSubmitting(false);
        return;
      }
      
      selectedFiles.forEach(file => formDataToSend.append('images', file));
      existingImages.forEach(image => formDataToSend.append('existingImages[]', image)); // Backend needs to handle this
      
      let response;
      if (isEditMode && productId) {
        response = await api.put(`/api/products/${productId}`, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' }});
      } else {
        response = await api.post('/api/products', formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' }});
      }
      
      if (response.data.success) {
        setSubmitSuccess(true);
        setTimeout(() => { navigate('/pages/products/my-products'); }, 1500);
      } else {
        throw new Error(response.data.error?.message || 'Error al guardar el producto');
      }
    } catch (err: any) {
      console.error('Error submitting product:', err);
      const backendError = err.response?.data?.error?.details || err.response?.data?.error?.message || err.response?.data?.message || err.message;
      setSubmitError(backendError ? `Error del servidor: ${typeof backendError === 'string' ? backendError : JSON.stringify(backendError)}` : 'Error desconocido al guardar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    navigate('/pages/products/my-products');
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
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

        <Card className="mb-8">
          {isLoading && !isEditMode ? ( // Only show main loader for edit mode initial load
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
                        <option value="" disabled>No hay categorías principales</option>
                      )}
                      {topLevelCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {selectedParentCategoryId && currentChildCategories.length > 0 && (
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
                        disabled={isLoadingCategories || currentChildCategories.length === 0}
                      >
                        <option value="">
                          {isLoadingCategories 
                            ? "Cargando..." 
                            : "Selecciona Subcategoría"}
                        </option>
                        {currentChildCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  )}
                   {/* Show categoryId directly if parent has no children and is selected */}
                   {selectedParentCategoryId && currentChildCategories.length === 0 && formData.categoryId && (
                     <div className="md:col-span-1 p-2 bg-gray-50 rounded-md">
                       <p className="text-sm text-gray-600">Categoría Seleccionada:</p>
                       <p className="font-medium">{topLevelCategories.find(c => c.id === formData.categoryId)?.name || 'N/A'}</p>
                     </div>
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

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Detalles del Producto y Origen</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <FormField 
                    label="Ubicación de Origen del Producto"
                    name="originLocationId"
                    value={formData.originLocationId}
                    onChange={handleInputChange}
                    error={errors.originLocationId}
                    required
                  >
                    <select
                      name="originLocationId"
                      value={formData.originLocationId}
                      onChange={handleInputChange}
                      className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-1 ${
                        errors.originLocationId ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={isLoadingUserLocations}
                    >
                      <option value="">
                        {isLoadingUserLocations ? "Cargando ubicaciones..." : "Seleccionar ubicación existente"}
                      </option>
                      {userLocations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.addressLine1} ({loc.city}, {loc.department})
                        </option>
                      ))}
                      <option value="CREATE_NEW_LOCATION">-- Crear nueva ubicación --</option>
                    </select>
                  </FormField>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Región (Departamento) <span className="text-xs text-gray-500">(Informativo, se toma de la ubicación)</span>
                    </label>
                    <StyledInput
                      name="derivedRegion"
                      type="text"
                      value={userLocations.find(loc => loc.id === formData.originLocationId)?.department || ''}
                      disabled // This field is derived
                      readOnly
                    />
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
                    min="0" // Allow 0
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

                  <div className="flex items-center md:col-span-2">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-green-1 focus:ring-green-1 border-gray-300 rounded"
                    />
                    <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
                      Producto Destacado (aparecerá en la página principal)
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Imágenes del Producto</h2>
                {errors.images && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                    <p>{errors.images}</p>
                  </div>
                )}
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
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF hasta 5MB por imagen</p>
                  </div>
                </StyledBorder>
                {previewUrls.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2 text-gray-700">Imágenes seleccionadas (nuevas)</h3>
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
                  isLoading={isSubmitting || isLoadingUserLocations || isLoadingCategories || isCertificateChecking}
                  disabled={isSubmitting || isLoadingUserLocations || isLoadingCategories || isCertificateChecking}
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
      
      {/* Placeholder for LocationFormModal - replace with your actual modal component */}
      <LocationFormModal 
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSubmit={handleNewLocationCreated}
        userId={user?.id} // Pass userId if your createLocation API/modal needs it directly
      />
    </>
  );
};

export default ProductCreate; 