import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import StyledButton from '../../components/ui/StyledButton';
import StyledTextArea from '../../components/ui/StyledTextArea';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';
import { certificationService } from '../../services/certificationService';

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
  certificateNumber?: string;
  issuedDate?: string;
  expiryDate?: string;
}

const CertificationApproval: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedCertification, setSelectedCertification] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');

  // Check if user is admin
  useEffect(() => {
    if (!user || user.userType !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch certifications based on filter and page
  const fetchCertifications = async (page = 1, status = filterStatus) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare parameters for the service call
      const params: Record<string, any> = {
        page,
        limit: 5, // Or your preferred page size
        status,
        sortBy: 'uploadedAt', // Default sort
        sortOrder: 'asc'
      };

      // Call the updated service function
      const response = await certificationService.getAllCertificationsAdmin(params);
      console.log("Admin Certs: Raw response from service:", response);

      // Access the application data within response.data
      const applicationData = response.data; // This is { success: true, data: { data: [...], pagination: {...} } }
      console.log("Admin Certs: Application data object:", applicationData);

      // Check if the structure is as expected and access the nested data/pagination
      if (applicationData && applicationData.success && applicationData.data && applicationData.data.data && applicationData.data.pagination) {
        console.log("Admin Certs: Setting state with:", applicationData.data.data, applicationData.data.pagination);
        setCertifications(applicationData.data.data); // List is here
        setCurrentPage(applicationData.data.pagination.currentPage); // Pagination is here
        setTotalPages(applicationData.data.pagination.totalPages);
        setTotalItems(applicationData.data.pagination.totalItems);
      } else {
        // Handle case where structure is still not as expected
        console.error("Unexpected application data structure:", applicationData);
        setCertifications([]);
        throw new Error('Respuesta inesperada del servidor (app data structure error) al cargar certificaciones');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al cargar certificaciones';
      setError(errorMsg);
      console.error('Error fetching certifications:', err);
      setCertifications([]); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial data (pending certifications, page 1)
    fetchCertifications(1, 'PENDING'); 
  }, []); // Run only on mount

  // Handle changing the filter status (example)
  const handleFilterChange = (newStatus: string) => {
    setFilterStatus(newStatus);
    fetchCertifications(1, newStatus); // Fetch page 1 of the new status
  };

  // Handle changing page (example)
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchCertifications(newPage, filterStatus);
    }
  };

  // Handle certification approval
  const handleApprove = async (certificationId: string) => {
    try {
      // Assuming approveCertification returns the updated cert or success status
      await certificationService.approveCertification(certificationId, user!.id);
      // Refetch current view
      fetchCertifications(currentPage, filterStatus);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al aprobar certificación';
      setError(errorMsg);
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
      await certificationService.rejectCertification(certificationId, user!.id, rejectionReason);
      setRejectionReason('');
      setSelectedCertification(null);
      // Refetch current view
      fetchCertifications(currentPage, filterStatus); 
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al rechazar certificación';
      setError(errorMsg);
      console.error('Error rejecting certification:', err);
    }
  };

  // Add a function to format dates nicely
  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-CO');
  };

  return (
    <div className="w-full">
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
        <div className="grid grid-cols-1 gap-4">
          {certifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-1 text-lg">No hay certificaciones pendientes de aprobación.</p>
            </div>
          ) : (
            certifications.map((cert) => (
              <div key={cert.id} className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-3 rounded-md">
                      <div>
                        <p className="text-sm text-gray-600">Tipo de Certificado</p>
                        <p className="font-medium">{cert.certificationType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Número de Certificado</p>
                        <p className="font-medium">{cert.certificateNumber || 'No especificado'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Fecha de Subida</p>
                        <p className="font-medium">
                          {formatDate(cert.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Add issued and expiry dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md mt-2">
                      <div>
                        <p className="text-sm text-gray-600">Fecha de Expedición</p>
                        <p className="font-medium">{formatDate(cert.issuedDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                        <p className="font-medium">{formatDate(cert.expiryDate)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Certificate image */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Imagen del Certificado</h4>
                    <div className="bg-gray-50 p-2 rounded-md">
                      <img
                        src={cert.imageUrl}
                        alt={cert.certificationName}
                        className="w-full h-64 object-contain rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-4 mt-4">
                    <StyledButton
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setSelectedCertification(cert.id);
                        setRejectionReason('');
                      }}
                    >
                      Rechazar
                    </StyledButton>
                    <StyledButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(cert.id)}
                    >
                      Aprobar
                    </StyledButton>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {selectedCertification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rechazar Certificación</h3>
              <div className="mb-4">
                <StyledTextArea
                  label="Motivo del Rechazo"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  placeholder="Explica por qué estás rechazando esta certificación"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <StyledButton
                  variant="outline"
                  onClick={() => {
                    setSelectedCertification(null);
                    setRejectionReason('');
                  }}
                >
                  Cancelar
                </StyledButton>
                <StyledButton
                  variant="danger"
                  onClick={() => handleReject(selectedCertification || '')}
                  disabled={!rejectionReason.trim()}
                >
                  Rechazar
                </StyledButton>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CertificationApproval; 