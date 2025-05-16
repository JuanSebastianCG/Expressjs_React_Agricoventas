import api from './api';
import { IUserCertification, CertificationType } from '../interfaces/user';

/**
 * Service for managing user certifications
 */
export const certificationService = {
  /**
   * Upload a certification
   * @param userId - User ID
   * @param certName - Certification name
   * @param certType - Certification type
   * @param certNumber - Certificate number/code
   * @param issuedDate - Date when certificate was issued
   * @param expiryDate - Date when certificate expires
   * @param imageFile - Image file
   */
  async uploadCertification(
    userId: string,
    certName: string,
    certType: CertificationType,
    certNumber: string,
    issuedDate: Date,
    expiryDate: Date,
    imageFile: File
  ): Promise<IUserCertification> {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', imageFile);
    
    try {
      // Upload the image first - use the correct endpoint
      const imageResponse = await api.post('/uploads/certifications', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!imageResponse.data.success) {
        throw new Error('Failed to upload image');
      }
      
      const imageUrl = imageResponse.data.url || imageResponse.data.data?.url;
      
      console.log("Image upload success, URL:", imageUrl);
      
      // Create the certification with the image URL
      const response = await api.post('/certifications/upload', {
        userId,
        certificationName: certName,
        certificationType: certType,
        certificateNumber: certNumber,
        issuedDate,
        expiryDate,
        imageUrl,
      });
      
      return response.data;
    } catch (error) {
      console.error('Error in uploadCertification:', error);
      throw error;
    }
  },
  
  /**
   * Get all certifications for a user
   * @param userId - User ID
   */
  async getUserCertifications(userId: string): Promise<IUserCertification[]> {
    try {
      const response = await api.get(`/certifications/user/${userId}`);
      // Check if the data is nested and return the array, otherwise return the direct data (or an empty array)
      const responseData = response.data;
      return Array.isArray(responseData?.data) ? responseData.data : Array.isArray(responseData) ? responseData : [];
    } catch (error) {
      console.error('Error fetching user certifications in service:', error);
      return []; // Return empty array on error
    }
  },
  
  /**
   * Verify if a user has all required certifications
   * @param userId - User ID
   */
  async verifyUserCertifications(userId: string): Promise<{
    hasAllCertifications: boolean;
    certificationsCount: {
      verified: number;
      total: number;
    };
  }> {
    const response = await api.get(`/certifications/verify/${userId}`);
    return response.data;
  },
  
  /**
   * Get all certifications for admin view
   */
  async getAllCertificationsAdmin(params?: Record<string, any>): Promise<{
    data: IUserCertification[];
    pagination: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number; };
  }> {
    try {
      console.log('Fetching admin certifications with params:', params);
      const response = await api.get('/certifications/admin', { params });
      console.log('Admin certifications response:', response);

      // Ensure we handle different response formats correctly
      if (response && response.data) {
        if (response.data.success === true) {
          // Standard API response format: { success: true, data: {...} }
          let certifications: IUserCertification[] = [];
          let pagination = {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 10
          };

          if (response.data.data) {
            // Direct data property containing items and pagination
            if (Array.isArray(response.data.data.certifications)) {
              certifications = response.data.data.certifications;
              
              if (response.data.data.pagination) {
                pagination = {
                  currentPage: response.data.data.pagination.page || 1,
                  totalPages: response.data.data.pagination.pages || 1,
                  totalItems: response.data.data.pagination.total || 0,
                  itemsPerPage: response.data.data.pagination.limit || 10
                };
              }
            } 
            // Alternative: data directly contains certifications array
            else if (Array.isArray(response.data.data)) {
              certifications = response.data.data;
            }
            // Alternative: data contains different named fields
            else if (typeof response.data.data === 'object') {
              if (Array.isArray(response.data.data.items)) {
                certifications = response.data.data.items;
              }
              
              if (response.data.data.meta || response.data.data.paging) {
                const paginationData = response.data.data.meta || response.data.data.paging;
                pagination = {
                  currentPage: paginationData.page || paginationData.currentPage || 1,
                  totalPages: paginationData.totalPages || paginationData.pages || 1,
                  totalItems: paginationData.total || paginationData.totalItems || 0,
                  itemsPerPage: paginationData.limit || paginationData.pageSize || 10
                };
              }
            }
          }

          console.log('Processed certifications:', certifications.length);
          console.log('Processed pagination:', pagination);

          return {
            data: certifications,
            pagination
          };
        } else {
          // Non-success response
          console.error('API returned success:false:', response.data.error);
          throw new Error(response.data.error?.message || 'Error fetching certifications');
        }
      }

      // Fallback for unexpected response format
      console.error('Unexpected response format:', response);
      throw new Error('Respuesta inesperada del servidor');
    } catch (error: any) {
      console.error('Error in getAllCertificationsAdmin:', error);
      
      if (error.response?.data?.error) {
        throw new Error(`Error: ${error.response.data.error.message || 'Estructura de respuesta errónea'}`);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Error desconocido al obtener certificaciones');
      }
    }
  },
  
  /**
   * Get all pending certifications (admin only)
   */
  async getPendingCertifications(): Promise<IUserCertification[]> {
    const response = await api.get('/certifications/pending');
    return response.data;
  },
  
  /**
   * Approve a certification (admin only)
   * @param certificationId - Certification ID
   * @param adminId - Admin user ID
   */
  async approveCertification(certificationId: string, adminId: string): Promise<IUserCertification> {
    const response = await api.put(`/certifications/approve/${certificationId}`, { adminId });
    return response.data;
  },
  
  /**
   * Reject a certification (admin only)
   * @param certificationId - Certification ID
   * @param adminId - Admin user ID
   * @param rejectionReason - Reason for rejection
   */
  async rejectCertification(
    certificationId: string,
    adminId: string,
    rejectionReason: string
  ): Promise<IUserCertification> {
    const response = await api.put(`/certifications/reject/${certificationId}`, {
      adminId,
      rejectionReason,
    });
    return response.data;
  },
  
  /**
   * Get a single certification by ID
   */
  async getCertificationById(certificationId: string): Promise<IUserCertification> {
    try {
      // Validate MongoDB ObjectID format to prevent unnecessary API calls
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(certificationId)) {
        throw new Error('Invalid certification ID format');
      }
      
      console.log(`Fetching certification with ID: ${certificationId}`);
      const response = await api.get(`/certifications/${certificationId}`);
      
      if (response.data && response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data?.error?.message || 'Error fetching certification');
    } catch (error: any) {
      console.error('Error in getCertificationById:', error);
      
      if (error.response?.data?.error) {
        throw new Error(`Error: ${error.response.data.error.message || 'No se pudo obtener el certificado'}`);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Error desconocido al obtener el certificado');
      }
    }
  },
}; 