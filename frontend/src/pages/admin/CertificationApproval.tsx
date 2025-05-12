import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Header from '../../components/layout/Header';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';

interface Certification {
  id: string;
  userId: string;
  certificationName: string;
  certificationType: string;
  imageUrl: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploadedAt: string;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email: string;
    profileImage?: string;
  };
}

const CertificationApproval: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedCertification, setSelectedCertification] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (!user || user.userType !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch pending certifications
  const fetchCertifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/certifications/pending');
      if (response.data.success) {
        setCertifications(response.data.data);
      } else {
        throw new Error(response.data.error?.message || 'Error al cargar certificaciones');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar certificaciones');
      console.error('Error fetching certifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertifications();
  }, []);

  // Handle certification approval
  const handleApprove = async (certificationId: string) => {
    try {
      const response = await api.put(`/api/certifications/approve/${certificationId}`, {
        adminId: user?.id
      });
      
      if (response.data.success) {
        await fetchCertifications();
      } else {
        throw new Error(response.data.error?.message || 'Error al aprobar certificación');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar certificación');
      console.error('Error approving certification:', err);
    }
  };

  // Handle certification rejection
  const handleReject = async (certificationId: string) => {
    if (!rejectionReason.trim()) {
      setError('Debes proporcionar un motivo para el rechazo');
      return;
    }

    try {
      const response = await api.put(`/api/certifications/reject/${certificationId}`, {
        adminId: user?.id,
        rejectionReason
      });
      
      if (response.data.success) {
        setRejectionReason('');
        setSelectedCertification(null);
        await fetchCertifications();
      } else {
        throw new Error(response.data.error?.message || 'Error al rechazar certificación');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar certificación');
      console.error('Error rejecting certification:', err);
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Aprobación de Certificaciones</h1>
              <p className="text-gray-1">Revisa y aprueba las certificaciones de los vendedores</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-4 rounded shadow-sm transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* Certifications list */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 gap-6">
            {certifications.map((cert) => (
              <Card key={cert.id} className="relative">
                <div className="p-6">
                  {/* User info */}
                  <div className="flex items-center mb-4">
                    {cert.user.profileImage ? (
                      <img
                        src={cert.user.profileImage}
                        alt={cert.user.username}
                        className="w-12 h-12 rounded-full mr-4"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                        <span className="text-gray-500 text-xl">
                          {cert.user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {cert.user.firstName && cert.user.lastName
                          ? `${cert.user.firstName} ${cert.user.lastName}`
                          : cert.user.username}
                      </h3>
                      <p className="text-sm text-gray-600">{cert.user.email}</p>
                    </div>
                  </div>

                  {/* Certification details */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Detalles del Certificado</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Tipo de Certificado</p>
                        <p className="font-medium">{cert.certificationType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Nombre del Certificado</p>
                        <p className="font-medium">{cert.certificationName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Fecha de Subida</p>
                        <p className="font-medium">
                          {new Date(cert.uploadedAt).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Certificate image */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Imagen del Certificado</h4>
                    <div className="relative aspect-w-16 aspect-h-9">
                      <img
                        src={cert.imageUrl}
                        alt={cert.certificationName}
                        className="w-full h-64 object-contain rounded-lg border border-gray-200"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => {
                        setSelectedCertification(cert.id);
                        setRejectionReason('');
                      }}
                      className="bg-red-1 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => handleApprove(cert.id)}
                      className="bg-green-1 hover:bg-green-0-9 text-white px-4 py-2 rounded transition-colors"
                    >
                      Aprobar
                    </button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Empty state */}
            {certifications.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-1 text-lg">No hay certificaciones pendientes de aprobación.</p>
              </div>
            )}
          </div>
        )}

        {/* Rejection Modal */}
        {selectedCertification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rechazar Certificación</h3>
                <div className="mb-4">
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo del Rechazo
                  </label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-1"
                    rows={4}
                    placeholder="Ingresa el motivo del rechazo..."
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setSelectedCertification(null);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleReject(selectedCertification)}
                    className="bg-red-1 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    Confirmar Rechazo
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default CertificationApproval; 