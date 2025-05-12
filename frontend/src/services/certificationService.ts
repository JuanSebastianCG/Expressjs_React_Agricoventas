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
   * @param imageFile - Image file
   */
  async uploadCertification(
    userId: string,
    certName: string,
    certType: CertificationType,
    imageFile: File
  ): Promise<IUserCertification> {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', imageFile);
    
    // Upload the image first
    const imageResponse = await api.post('/uploads/certifications', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const imageUrl = imageResponse.data.url;
    
    // Create the certification with the image URL
    const response = await api.post('/certifications/upload', {
      userId,
      certificationName: certName,
      certificationType: certType,
      imageUrl,
    });
    
    return response.data;
  },
  
  /**
   * Get all certifications for a user
   * @param userId - User ID
   */
  async getUserCertifications(userId: string): Promise<IUserCertification[]> {
    const response = await api.get(`/certifications/user/${userId}`);
    return response.data;
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
}; 