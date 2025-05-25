import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { certificationService } from '../../services/certificationService';
import { CertificationType, IUserCertification, CertificationStatus } from '../../interfaces/user';
import Header from '../../components/layout/Header';
import { useAppContext } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import StyledButton from '../../components/ui/StyledButton';
import MainLayout from '../../components/layout/MainLayout';
import FormField from '../../components/ui/FormField';
import AuthButton from '../../components/common/AuthButton';
import TermsModal from './TermsModal';

const UploadCertificate: React.FC = () => {
  const { isAuthenticated, user } = useAppContext();
  const navigate = useNavigate();
  
  // State for certificates
  const [userCertifications, setUserCertifications] = useState<IUserCertification[]>([]);
  const [certificationStatus, setStatus] = useState<{ verified: number, total: number } | null>(null);
  
  // State for the form
  const [selectedType, setSelectedType] = useState<CertificationType | null>(null);
  const [certName, setCertName] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [issuedDate, setIssuedDate] = useState<Date | undefined>(undefined);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  // UI state
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Funciones para manejar el modal de términos y condiciones
  const openTermsModal = () => {
    setShowTermsModal(true);
  };

  const closeTermsModal = () => {
    setShowTermsModal(false);
  };

  // Load user certifications
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const loadUserCertifications = async () => {
      try {
        setUploadLoading(true);
        const certs = await certificationService.getUserCertifications(user?.id || '');
        setUserCertifications(certs);
        
        // Get certification status
        console.log("Fetching certification status...");
        const statusResponse = await certificationService.verifyUserCertifications(user?.id || '');
        console.log("Received statusResponse:", statusResponse); // Log the raw response

        // Extract the certification counts correctly
        if (statusResponse && statusResponse.certificationsCount && 
            typeof statusResponse.certificationsCount.verified === 'number' && 
            typeof statusResponse.certificationsCount.total === 'number') {
          // Direct access when the structure is as expected
          setStatus(statusResponse.certificationsCount);
          console.log("Certification status state updated:", statusResponse.certificationsCount);
        } else if (statusResponse && typeof statusResponse.hasAllCertifications === 'boolean') {
          // Fallback: If we at least know whether all certs are verified
          console.log("Fallback certification status from hasAllCertifications");
          
          // Count verified certifications from the certs array we already loaded
          const verifiedCount = certs.filter(cert => cert.status === "VERIFIED").length;
          setStatus({
            verified: verifiedCount,
            total: 4 // Fixed required value
          });
        } else {
          console.warn("Could not determine certification status:", statusResponse);
          setStatus({ verified: 0, total: 4 }); // Default fallback
        }
      } catch (err) {
        setError('No se pudieron cargar tus certificaciones');
        console.error("Error in loadUserCertifications:", err);
      } finally {
        setUploadLoading(false);
      }
    };
    
    loadUserCertifications();
  }, [isAuthenticated, user, navigate]);

  // Generate preview when file changes
  useEffect(() => {
    if (!certificateFile) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(certificateFile);
    setPreview(objectUrl);

    // Clean up object URL when component unmounts or file changes
    return () => URL.revokeObjectURL(objectUrl);
  }, [certificateFile]);
  
  // Reset form
  const resetForm = () => {
    setSelectedType(null);
    setCertName('');
    setCertNumber('');
    setIssuedDate(undefined);
    setExpiryDate(undefined);
    setCertificateFile(null);
    setError(null);
    setSuccessMessage(null);
  };

  // Format date as YYYY-MM-DD for input field
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    return date instanceof Date
      ? date.toISOString().split('T')[0]
      : new Date(date).toISOString().split('T')[0];
  };

  // Select a certification type
  const handleSelectType = (type: CertificationType) => {
    setSelectedType(type);
    // Pre-fill form if certification exists
    const existingCert = userCertifications.find(cert => cert.certificationType === type);
    if (existingCert) {
      setCertName(existingCert.certificationName || '');
      setCertNumber(existingCert.certificateNumber || '');
      setIssuedDate(existingCert.issuedDate ? new Date(existingCert.issuedDate) : undefined);
      setExpiryDate(existingCert.expiryDate ? new Date(existingCert.expiryDate) : undefined);
    } else {
      setCertName('');
      setCertNumber('');
      setIssuedDate(undefined);
      setExpiryDate(undefined);
    }
    setCertificateFile(null);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCertificateFile(e.target.files[0]);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    if (!selectedType) {
      setError('Por favor selecciona un tipo de certificación');
      return;
    }
    
    if (!certNumber) {
      setError('Por favor ingresa el número de certificado');
      return;
    }
    
    if (!issuedDate) {
      setError('Por favor selecciona la fecha de expedición');
      return;
    }
    
    if (!expiryDate) {
      setError('Por favor selecciona la fecha de vencimiento');
      return;
    }
    
    // Check if expiry date is after issued date
    if (new Date(expiryDate) <= new Date(issuedDate)) {
      setError('La fecha de vencimiento debe ser posterior a la fecha de expedición');
      return;
    }
    
    if (!certificateFile) {
      setError('Por favor selecciona una imagen de certificación');
      return;
    }
    
    try {
      setUploadLoading(true);
      const certificationName = getSpanishCertificationType(selectedType);
      
      await certificationService.uploadCertification(
        user!.id,
        certificationName,
        selectedType,
        certNumber,
        issuedDate,
        expiryDate,
        certificateFile
      );
      
      // Update certifications list AFTER upload
      const updatedCerts = await certificationService.getUserCertifications(user!.id);
      setUserCertifications(updatedCerts);
      
      // Get updated status AFTER upload
      console.log("Fetching updated status after upload...");
      const updatedStatusResponse = await certificationService.verifyUserCertifications(user!.id);
      console.log("Received updatedStatusResponse:", updatedStatusResponse);

      // Extract the certification counts correctly
      if (updatedStatusResponse && updatedStatusResponse.certificationsCount && 
          typeof updatedStatusResponse.certificationsCount.verified === 'number' && 
          typeof updatedStatusResponse.certificationsCount.total === 'number') {
        // Direct access when the structure is as expected
        setStatus(updatedStatusResponse.certificationsCount);
        console.log("Certification status state updated after upload:", updatedStatusResponse.certificationsCount);
      } else if (updatedStatusResponse && typeof updatedStatusResponse.hasAllCertifications === 'boolean') {
        // Fallback: If we at least know whether all certs are verified
        console.log("Fallback certification status from hasAllCertifications after upload");
        
        // Refetch the certifications to get the latest state
        const refreshedCerts = await certificationService.getUserCertifications(user!.id);
        const verifiedCount = refreshedCerts.filter(cert => cert.status === "VERIFIED").length;
        setStatus({
          verified: verifiedCount,
          total: 4 // Fixed required value
        });
        // Update the certificates list with the latest data
        setUserCertifications(refreshedCerts);
      } else {
        console.warn("Could not determine certification status after upload:", updatedStatusResponse);
        // Keep previous state
      }
      
      // Show success message
      setSuccessMessage('¡Certificación subida con éxito!');
      
      // Reset form
      resetForm();
    } catch (err) {
      console.error(err);
      setError('Error al subir la certificación');
    } finally {
      setUploadLoading(false);
    }
  };
  
  // Delete a certification
  const handleDelete = async (certId: string) => {
    try {
      setUploadLoading(true);
      // This is a placeholder - you would need to implement this in your API
      // await certificationService.deleteCertification(certId);
      
      // For now let's simulate deleting by removing from state
      setUserCertifications(current => current.filter(cert => cert.id !== certId));
      
      // Update certification status
      const status = await certificationService.verifyUserCertifications(user!.id);
      setStatus(status.certificationsCount);
      
      setSuccessMessage('Certificación eliminada correctamente');
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
      setError('Error al eliminar la certificación');
    } finally {
      setUploadLoading(false);
    }
  };

  // Get certification status for a specific type
  const getCertificateForType = (type: CertificationType): IUserCertification | undefined => {
    // Ensure userCertifications is an array before calling find
    if (!Array.isArray(userCertifications)) {
      console.warn('getCertificateForType called before userCertifications was an array');
      return undefined;
    }
    return userCertifications.find(c => c.certificationType === type);
  };

  // Translate certification type to Spanish
  const getSpanishCertificationType = (type: CertificationType): string => {
    const translations: Record<CertificationType, string> = {
      [CertificationType.INVIMA]: 'INVIMA',
      [CertificationType.ICA]: 'ICA',
      [CertificationType.REGISTRO_SANITARIO]: 'Registro Sanitario',
      [CertificationType.CERTIFICADO_ORGANICO]: 'Certificado Orgánico'
    };
    return translations[type] || type.replace(/_/g, ' ');
  };

  // Translate certification status to Spanish
  const getSpanishCertificationStatus = (status: string): string => {
    const translations: Record<string, string> = {
      'PENDING': 'Pendiente',
      'VERIFIED': 'Verificado',
      'REJECTED': 'Rechazado'
    };
    return translations[status] || status;
  };
  
  // Get icon for certification type
  const getCertificateIcon = (type: CertificationType): string => {
    const icons: Record<CertificationType, string> = {
      [CertificationType.INVIMA]: '🏥',
      [CertificationType.ICA]: '🌱',
      [CertificationType.REGISTRO_SANITARIO]: '🧪',
      [CertificationType.CERTIFICADO_ORGANICO]: '🍃'
    };
    return icons[type];
  };
  
  // Get status color class
  const getStatusColorClass = (status: CertificationStatus | undefined): string => {
    if (!status) return '';
    
    switch (status) {
      case CertificationStatus.VERIFIED:
        return 'bg-green-0-5 text-green-1';
      case CertificationStatus.PENDING:
        return 'bg-yellow-100 text-yellow-1';
      case CertificationStatus.REJECTED:
        return 'bg-red-100 text-red-1';
      default:
        return 'bg-gray-200 text-gray-600';
    }
  };

  // Format date for display
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-CO');
  };

  return (
    <>
      
      {/* Modal de términos y condiciones */}
      <TermsModal 
        isOpen={showTermsModal} 
        onClose={closeTermsModal} 
      />

      <MainLayout title="Certificaciones de Vendedor">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h1 className="text-3xl font-bold text-green-1 mb-2">Certificaciones de Vendedor</h1>
            <p className="text-gray-600 mb-6">
              Para vender productos en Agricoventas, necesitas tener tus certificaciones verificadas.
              Sube tus documentos y nuestro equipo los revisará en breve.
            </p>
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Estado de Certificaciones</h2>
              <button 
                onClick={openTermsModal}
                className="text-green-1 hover:underline text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ver Términos sobre Certificaciones
              </button>
            </div>
            
            {/* Certification Status */}
            <div className="bg-green-0-4 rounded-lg p-5 mb-8">
              <h2 className="text-lg font-semibold mb-2">Estado de tus Certificaciones</h2>
              <p className="mb-2">
                Tienes certificaciones requeridos para publicar productos.
              </p>
              {certificationStatus && (certificationStatus.verified >= certificationStatus.total || userCertifications.filter(cert => cert.status === "VERIFIED").length >= 4) ? (
                <div className="bg-green-0-5 text-green-1 p-4 rounded-md font-medium">
                  ✅ ¡Tienes todas las certificaciones requeridas y puedes publicar productos!
                  
                  <div className="mt-4">
                    <StyledButton 
                      variant="primary"
                      onClick={() => navigate('/mis-productos')}
                    >
                      Ir a Gestionar Productos
                    </StyledButton>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-100 text-yellow-1 p-4 rounded-md font-medium">
                  ⚠️ Necesitas tener todas las certificaciones requeridas verificadas antes de poder publicar productos.
                </div>
              )}
            </div>
            
            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-100 text-red-1 p-4 rounded-md mb-6">
                <p>{error}</p>
                <button 
                  className="text-sm underline mt-1" 
                  onClick={() => setError(null)}
                >
                  Cerrar
                </button>
              </div>
            )}
            
            {successMessage && (
              <div className="bg-green-0-5 text-green-1 p-4 rounded-md mb-6">
                <p>{successMessage}</p>
                <button 
                  className="text-sm underline mt-1" 
                  onClick={() => setSuccessMessage(null)}
                >
                  Cerrar
                </button>
              </div>
            )}
            
            {/* Certificate Cards */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Certificaciones Requeridas</h2>
              <p className="text-gray-1 mb-4">Selecciona una tarjeta para subir o actualizar la certificación correspondiente</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.values(CertificationType).map(certType => {
                  const cert = getCertificateForType(certType);
                  const status = cert?.status;
                  const isActive = selectedType === certType;
                  
                  return (
                    <div 
                      key={certType} 
                      className={`border rounded-lg p-5 flex flex-col transition-all cursor-pointer ${
                        isActive 
                          ? 'border-green-1 shadow-md' 
                          : 'border-gray-200 hover:border-green-0-5 hover:shadow'
                      }`}
                      onClick={() => handleSelectType(certType)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl">{getCertificateIcon(certType)}</div>
                        {status && (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColorClass(status)}`}>
                            {getSpanishCertificationStatus(status)}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-medium text-lg">{getSpanishCertificationType(certType)}</h3>
                      
                      {cert ? (
                        <div className="mt-3 text-sm text-gray-1">
                          <div><span className="font-medium">Nombre:</span> {cert.certificationName}</div>
                          <div><span className="font-medium">Número:</span> {cert.certificateNumber || 'No disponible'}</div>
                          <div><span className="font-medium">Expedido:</span> {formatDate(cert.issuedDate)}</div>
                          <div><span className="font-medium">Vence:</span> {formatDate(cert.expiryDate)}</div>
                          
                          {status === CertificationStatus.REJECTED && cert.rejectionReason && (
                            <div className="mt-2 text-red-1">
                              <span className="font-medium">Motivo de rechazo:</span> {cert.rejectionReason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 text-sm text-gray-0-5">
                          No subido - Haz clic para agregar
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Upload Form - Only shown when a card is selected */}
            {selectedType && (
              <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    {getCertificateForType(selectedType) 
                      ? `Actualizar ${getSpanishCertificationType(selectedType)}` 
                      : `Subir ${getSpanishCertificationType(selectedType)}`}
                  </h2>
                  <button 
                    onClick={resetForm}
                    className="text-gray-1 hover:text-gray-800"
                  >
                    ✕ Cerrar
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-1 mb-1">
                        Número de Certificado *
                      </label>
                      <input
                        type="text"
                        value={certNumber}
                        onChange={(e) => setCertNumber(e.target.value)}
                        className="w-full p-3 border border-gray-0-5 rounded-md focus:border-green-1 focus:outline-none focus:ring-1 focus:ring-green-1"
                        placeholder="Código o número único del certificado"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-1 mb-1">
                        Fecha de Expedición *
                      </label>
                      <input
                        type="date"
                        value={formatDateForInput(issuedDate)}
                        onChange={(e) => setIssuedDate(new Date(e.target.value))}
                        className="w-full p-3 border border-gray-0-5 rounded-md focus:border-green-1 focus:outline-none focus:ring-1 focus:ring-green-1"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-1 mb-1">
                        Fecha de Vencimiento *
                      </label>
                      <input
                        type="date"
                        value={formatDateForInput(expiryDate)}
                        onChange={(e) => setExpiryDate(new Date(e.target.value))}
                        className="w-full p-3 border border-gray-0-5 rounded-md focus:border-green-1 focus:outline-none focus:ring-1 focus:ring-green-1"
                        min={formatDateForInput(issuedDate)} // Prevent selecting a date before issue date
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-1 mb-1">
                      Imagen del Certificado *
                    </label>
                    <div className="border-2 border-dashed border-gray-0-5 rounded-md p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="certificate-file"
                        required
                      />
                      
                      {preview ? (
                        <div className="mb-3">
                          <img 
                            src={preview} 
                            alt="Vista previa" 
                            className="max-h-48 mx-auto"
                          />
                        </div>
                      ) : (
                        <div className="text-gray-0-5 mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      <label 
                        htmlFor="certificate-file"
                        className="bg-white hover:bg-gray-100 text-gray-1 border border-gray-0-5 px-4 py-2 rounded-md cursor-pointer inline-block"
                      >
                        {preview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                      </label>
                      
                      {preview && (
                        <button
                          type="button"
                          onClick={() => setCertificateFile(null)}
                          className="ml-3 text-red-1 underline"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-3">
                    <StyledButton
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      Cancelar
                    </StyledButton>
                    <StyledButton
                      type="submit"
                      variant="primary"
                      disabled={uploadLoading}
                    >
                      {uploadLoading 
                        ? 'Subiendo...' 
                        : getCertificateForType(selectedType) 
                          ? 'Actualizar Certificación' 
                          : 'Subir Certificación'
                      }
                    </StyledButton>
                  </div>
                </form>
              </div>
            )}
            
            {/* Confirmation Modal */}
            {confirmDelete && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-lg font-semibold mb-3">Confirmar eliminación</h3>
                  <p className="mb-4 text-gray-1">
                    ¿Estás seguro de que deseas eliminar esta certificación? Esta acción no se puede deshacer.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <StyledButton
                      variant="outline"
                      onClick={() => setConfirmDelete(null)}
                    >
                      Cancelar
                    </StyledButton>
                    <StyledButton
                      variant="danger"
                      onClick={() => handleDelete(confirmDelete)}
                      disabled={uploadLoading}
                    >
                      {uploadLoading ? 'Eliminando...' : 'Eliminar'}
                    </StyledButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </>
  );
};

export default UploadCertificate; 