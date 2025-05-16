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
  const [sortField, setSortField] = useState<string>('status');
  const [sortOrder, setSortOrder] = useState<string>('asc');
  
  // Modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCertification, setViewingCertification] = useState<Certification | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (!user || user.userType !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch all certifications with sorting
  const fetchCertifications = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params: Record<string, any> = {
        page,
        limit: 10, // Increased limit to show more items per page
        sortBy: sortField,
        sortOrder: sortOrder
      };

      const serviceResponse = await certificationService.getAllCertificationsAdmin(params);

      if (serviceResponse && serviceResponse.data && serviceResponse.pagination) {
        const backendCertifications = serviceResponse.data;
        const paginationInfo = serviceResponse.pagination;

        // Map backend to frontend structure
        const frontendCertifications: Certification[] = backendCertifications.map((cert: any) => ({
          id: cert.id,
          userId: cert.userId,
          certificationName: cert.certificationName,
          certificationType: cert.certificationType,
          imageUrl: cert.imageUrl,
          status: cert.status,
          uploadedAt: cert.uploadedAt,
          user: {
            id: cert.user?.id || '',
            username: cert.user?.username || 'N/A',
            firstName: cert.user?.firstName,
            lastName: cert.user?.lastName,
            email: cert.user?.email || '',
            profileImage: cert.user?.profileImage,
          },
          certificateNumber: cert.certificateNumber,
          issuedDate: cert.issuedDate,
          expiryDate: cert.expiryDate,
        }));
        
        // Sort certifications to ensure PENDING appears first, regardless of backend sort
        const sortedCertifications = [...frontendCertifications].sort((a, b) => {
          // Custom sort to ensure PENDING appears first, then REJECTED, then VERIFIED
          const statusOrder = { 'PENDING': 1, 'REJECTED': 2, 'VERIFIED': 3 };
          return (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
        });
        
        setCertifications(sortedCertifications);
        setCurrentPage(paginationInfo.currentPage);
        setTotalPages(paginationInfo.totalPages);
        setTotalItems(paginationInfo.totalItems);
      } else {
        setCertifications([]);
        throw new Error('Respuesta inesperada del servidor al cargar certificaciones (structure error)');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al cargar certificaciones';
      setError(errorMsg);
      setCertifications([]); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial data with all certifications
    fetchCertifications(1); 
  }, [sortField, sortOrder]); // Refetch when sort options change

  // Handle sort change
  const handleSortChange = (field: string) => {
    // If clicking the same field, toggle order, otherwise default to ascending
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchCertifications(newPage);
    }
  };

  // View certification details
  const handleViewCertification = (cert: Certification) => {
    setViewingCertification(cert);
    setIsViewModalOpen(true);
  };

  // Handle certification approval
  const handleApprove = async (certificationId: string) => {
    try {
      await certificationService.approveCertification(certificationId, user!.id);
      // Refetch current view
      fetchCertifications(currentPage);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al aprobar certificación';
      setError(errorMsg);
      console.error('Error approving certification:', err);
    }
  };

  // Open rejection modal
  const openRejectModal = (certificationId: string) => {
    setSelectedCertification(certificationId);
    setIsRejectModalOpen(true);
  };

  // Close rejection modal
  const closeRejectModal = () => {
    setSelectedCertification(null);
    setRejectionReason('');
    setIsRejectModalOpen(false);
  };

  // Handle certification rejection
  const handleReject = async () => {
    if (!selectedCertification || !rejectionReason.trim()) {
      setError('Debes proporcionar un motivo para el rechazo');
      return;
    }

    try {
      await certificationService.rejectCertification(selectedCertification, user!.id, rejectionReason);
      setRejectionReason('');
      setSelectedCertification(null);
      setIsRejectModalOpen(false);
      // Refetch current view
      fetchCertifications(currentPage);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al rechazar certificación';
      setError(errorMsg);
      console.error('Error rejecting certification:', err);
    }
  };

  // Format dates nicely
  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-CO');
  };

  // Get status badge color and text
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Pendiente</span>;
      case 'VERIFIED':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Verificado</span>;
      case 'REJECTED':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Rechazado</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Gestión de Certificaciones</h1>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Main table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('status')}
                >
                  Estado {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('certificationType')}
                >
                  Tipo {sortField === 'certificationType' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('uploadedAt')}
                >
                  Fecha de Subida {sortField === 'uploadedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-1"></div>
                    </div>
                  </td>
                </tr>
              ) : certifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No hay certificaciones disponibles
                  </td>
                </tr>
              ) : (
                certifications.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(cert.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cert.certificationType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          {cert.user.profileImage ? (
                            <img className="h-8 w-8 rounded-full" src={cert.user.profileImage} alt="" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-600">
                                {cert.user.firstName ? cert.user.firstName[0] : cert.user.username[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {cert.user.firstName && cert.user.lastName
                              ? `${cert.user.firstName} ${cert.user.lastName}`
                              : cert.user.username}
                          </div>
                          <div className="text-xs text-gray-500">{cert.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(cert.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cert.certificateNumber || 'No específicado'}</div>
                      <div className="text-xs text-gray-500">{formatDate(cert.expiryDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleViewCertification(cert)}
                        className="text-green-1 hover:text-green-0-9 mr-3"
                      >
                        Ver
                      </button>
                      {cert.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => handleApprove(cert.id)}
                            className="text-green-1 hover:text-green-0-9 mr-3"
                          >
                            Aprobar
                          </button>
                          <button 
                            onClick={() => openRejectModal(cert.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{certifications.length > 0 ? (currentPage - 1) * 10 + 1 : 0}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, totalItems)}
                  </span> de <span className="font-medium">{totalItems}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Primera</span>
                    &laquo;
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Anterior</span>
                    &lsaquo;
                  </button>
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-green-1 text-white border-green-1'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Siguiente</span>
                    &rsaquo;
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Última</span>
                    &raquo;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Rejection Modal */}
      {isRejectModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Razón del Rechazo</h3>
                    <div className="mt-2">
                      <StyledTextArea
                        name="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                        placeholder="Ingresa la razón por la que rechazas esta certificación"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleReject}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Certification Modal */}
      {isViewModalOpen && viewingCertification && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Detalles de la Certificación</h3>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    &times;
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Tipo de Certificado</p>
                    <p className="font-medium">{viewingCertification.certificationType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <p>{getStatusBadge(viewingCertification.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Número de Certificado</p>
                    <p className="font-medium">{viewingCertification.certificateNumber || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Usuario</p>
                    <p className="font-medium">
                      {viewingCertification.user.firstName && viewingCertification.user.lastName
                        ? `${viewingCertification.user.firstName} ${viewingCertification.user.lastName}`
                        : viewingCertification.user.username}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Expedición</p>
                    <p className="font-medium">{formatDate(viewingCertification.issuedDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                    <p className="font-medium">{formatDate(viewingCertification.expiryDate)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Imagen del Certificado</p>
                  <div className="border rounded-md overflow-hidden">
                    <img 
                      src={viewingCertification.imageUrl} 
                      alt="Certification" 
                      className="max-w-full h-auto object-contain mx-auto"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-1 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cerrar
                </button>
                {viewingCertification.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsViewModalOpen(false);
                        handleApprove(viewingCertification.id);
                      }}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-1 text-base font-medium text-white hover:bg-green-0-9 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-1 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsViewModalOpen(false);
                        openRejectModal(viewingCertification.id);
                      }}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Rechazar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationApproval; 