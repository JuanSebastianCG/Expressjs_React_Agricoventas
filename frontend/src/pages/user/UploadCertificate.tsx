import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { certificationService } from '../../services/certificationService';
import { CertificationType, IUserCertification } from '../../interfaces/user';
import Header from '../../components/layout/Header';
import { useAppContext } from '../../context/AppContext';

const UploadCertificate: React.FC = () => {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<CertificationType | ''>('');
  const [certificationName, setCertificationName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCertifications, setUserCertifications] = useState<IUserCertification[]>([]);
  const [certificationStatus, setStatus] = useState<{ verified: number, total: number } | null>(null);

  // Cargar certificaciones del usuario al montar el componente
  useEffect(() => {
    if (!user || !user.id) {
      navigate('/login');
      return;
    }
    
    const loadUserCertifications = async () => {
      try {
        const certs = await certificationService.getUserCertifications(user.id);
        setUserCertifications(certs);
        
        // Obtener estado de certificación
        const status = await certificationService.verifyUserCertifications(user.id);
        setStatus(status.certificationsCount);
      } catch (err) {
        setError('No se pudieron cargar tus certificaciones');
        console.error(err);
      }
    };
    
    loadUserCertifications();
  }, [user, navigate]);

  // Generar vista previa cuando cambia el archivo
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Limpiar la URL del objeto cuando el componente se desmonta o cambia el archivo
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!selectedType) {
      setError('Por favor selecciona un tipo de certificación');
      return;
    }
    
    if (!certificationName) {
      setError('Por favor ingresa un nombre de certificación');
      return;
    }
    
    if (!file) {
      setError('Por favor selecciona una imagen de certificación');
      return;
    }
    
    try {
      setLoading(true);
      await certificationService.uploadCertification(
        user!.id,
        certificationName,
        selectedType as CertificationType,
        file
      );
      
      // Actualizar la lista de certificaciones
      const certs = await certificationService.getUserCertifications(user!.id);
      setUserCertifications(certs);
      
      // Reiniciar formulario
      setSelectedType('');
      setCertificationName('');
      setFile(null);
      
      // Obtener estado actualizado
      const status = await certificationService.verifyUserCertifications(user!.id);
      setStatus(status.certificationsCount);
      
      // Mostrar mensaje de éxito
      alert('¡Certificación subida con éxito!');
    } catch (err) {
      console.error(err);
      setError('Error al subir la certificación');
    } finally {
      setLoading(false);
    }
  };

  // Obtener estado de certificación para un tipo específico
  const getCertificateStatus = (type: CertificationType) => {
    const cert = userCertifications.find(c => c.certificationType === type);
    if (!cert) return null;
    return cert.status;
  };

  // Función para traducir el tipo de certificación
  const getSpanishCertificationType = (type: CertificationType): string => {
    const translations: Record<CertificationType, string> = {
      [CertificationType.INVIMA]: 'INVIMA',
      [CertificationType.ICA]: 'ICA',
      [CertificationType.REGISTRO_SANITARIO]: 'Registro Sanitario',
      [CertificationType.CERTIFICADO_ORGANICO]: 'Certificado Orgánico'
    };
    return translations[type] || type.replace(/_/g, ' ');
  };

  // Función para traducir el estado de la certificación
  const getSpanishCertificationStatus = (status: string): string => {
    const translations: Record<string, string> = {
      'PENDING': 'Pendiente',
      'VERIFIED': 'Verificado',
      'REJECTED': 'Rechazado'
    };
    return translations[status] || status;
  };

  return (
    <>
      <Header />
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold text-green-1 mb-8">Gestión de Certificaciones</h1>
        
        {/* Estado de Certificación */}
        <div className="bg-green-0-4 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold mb-2">Estado de tus Certificaciones</h2>
          <p className="mb-2">
            Tienes {certificationStatus?.verified || 0} de {certificationStatus?.total || 4} certificaciones requeridas verificadas.
          </p>
          {certificationStatus?.verified === certificationStatus?.total ? (
            <div className="bg-green-0-5 text-green-1 p-3 rounded font-medium">
              ✅ ¡Tienes todas las certificaciones requeridas y puedes publicar productos!
            </div>
          ) : (
            <div className="bg-yellow-100 text-yellow-1 p-3 rounded font-medium">
              ⚠️ Necesitas tener todas las certificaciones requeridas verificadas antes de poder publicar productos.
            </div>
          )}
        </div>
        
        {/* Certificaciones Actuales */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Tus Certificaciones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              CertificationType.INVIMA,
              CertificationType.ICA,
              CertificationType.REGISTRO_SANITARIO,
              CertificationType.CERTIFICADO_ORGANICO
            ].map(certType => {
              const status = getCertificateStatus(certType);
              return (
                <div 
                  key={certType} 
                  className="border rounded-lg p-4 flex flex-col"
                >
                  <h3 className="font-medium">{getSpanishCertificationType(certType)}</h3>
                  {status ? (
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        status === 'VERIFIED' 
                          ? 'bg-green-0-5 text-green-1' 
                          : status === 'PENDING' 
                            ? 'bg-yellow-100 text-yellow-1' 
                            : 'bg-red-100 text-red-1'
                      }`}>
                        {getSpanishCertificationStatus(status)}
                      </span>
                      {status === 'REJECTED' && (
                        <p className="text-sm text-red-1 mt-1">
                          {userCertifications.find(c => c.certificationType === certType)?.rejectionReason}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-0-5 text-sm mt-2">No subido</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Formulario de Subida */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Subir Nueva Certificación</h2>
          
          {error && (
            <div className="bg-red-100 text-red-1 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-1 mb-1">
                Tipo de Certificación *
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as CertificationType | '')}
                className="w-full p-2 border border-gray-0-5 rounded focus:border-green-1 focus:ring-1 focus:ring-green-1"
                required
              >
                <option value="">Seleccionar tipo de certificación</option>
                {Object.values(CertificationType).map(type => (
                  <option key={type} value={type}>
                    {getSpanishCertificationType(type)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-1 mb-1">
                Nombre/Número de Certificación *
              </label>
              <input
                type="text"
                value={certificationName}
                onChange={(e) => setCertificationName(e.target.value)}
                className="w-full p-2 border border-gray-0-5 rounded focus:border-green-1 focus:ring-1 focus:ring-green-1"
                placeholder="Ingresa el nombre o número de certificación"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-1 mb-1">
                Documento de Certificación *
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full"
                accept="image/*,.pdf"
                required
              />
              <p className="text-xs text-gray-0-5 mt-1">
                Sube una imagen clara o escaneo de tu documento de certificación
              </p>
            </div>
            
            {preview && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Vista previa:</p>
                <img 
                  src={preview} 
                  alt="Vista previa de la certificación" 
                  className="max-w-full h-auto max-h-64 border rounded"
                />
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="mr-2 px-4 py-2 border border-gray-0-5 rounded text-gray-1 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-1 text-white rounded hover:bg-green-0-9"
                disabled={loading}
              >
                {loading ? 'Subiendo...' : 'Subir Certificación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UploadCertificate; 