import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hasRequiredCertifications, getCertificationsCount } from '../utils/certificateValidator';
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

// Create a prisma instance for normal usage
export const prisma = new PrismaClient();

export class CertificationController {
  private db: any;

  constructor(dbClient = prisma) {
    this.db = dbClient;
  }

  /**
   * Upload a new certification
   * @param req Express request
   * @param res Express response
   */
  async uploadCertification(req: Request, res: Response): Promise<void> {
    try {
      const { userId, certificationName, certificationType, imageUrl } = req.body;

      // Validate input
      if (!userId || !certificationName || !certificationType || !imageUrl) {
        sendErrorResponse(res, 'Missing required fields', HttpStatusCode.BAD_REQUEST);
        return;
      }

      // Check if this certificate type already exists for the user
      const existingCert = await this.db.userCertification.findFirst({
        where: {
          userId,
          certificationType
        }
      });

      if (existingCert) {
        // Update existing certification
        const updatedCert = await this.db.userCertification.update({
          where: {
            id: existingCert.id
          },
          data: {
            certificationName,
            imageUrl,
            status: 'PENDING', // Reset to pending if it was previously verified/rejected
            uploadedAt: new Date(),
            verifiedAt: null,
            verifierAdminId: null,
            rejectionReason: null
          }
        });
        sendSuccessResponse(res, updatedCert, HttpStatusCode.OK);
        return;
      }

      // Create new certification
      const certification = await this.db.userCertification.create({
        data: {
          userId,
          certificationName,
          certificationType,
          imageUrl,
          status: 'PENDING'
        }
      });

      sendSuccessResponse(res, certification, HttpStatusCode.CREATED);
    } catch (error: any) {
      console.error('Error uploading certification:', error);
      sendErrorResponse(res, 'Error uploading certification', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get certifications by user ID
   * @param req Express request
   * @param res Express response
   */
  async getUserCertifications(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const certifications = await this.db.userCertification.findMany({
        where: {
          userId
        },
        orderBy: {
          uploadedAt: 'desc'
        }
      });

      sendSuccessResponse(res, certifications);
    } catch (error: any) {
      console.error('Error fetching certifications:', error);
      sendErrorResponse(res, 'Error fetching certifications', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Verify if a user has all required certifications
   * @param req Express request
   * @param res Express response
   */
  async verifyUserCertifications(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const hasAllCertifications = await hasRequiredCertifications(userId, this.db);
      const certificationsCount = await getCertificationsCount(userId, this.db);

      sendSuccessResponse(res, { 
        hasAllCertifications,
        certificationsCount
      });
    } catch (error: any) {
      console.error('Error verifying certifications:', error);
      sendErrorResponse(res, 'Error verifying certifications', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all pending certifications (for admin approval)
   * @param req Express request
   * @param res Express response
   */
  async getPendingCertifications(req: Request, res: Response): Promise<void> {
    try {
      const pendingCertifications = await this.db.userCertification.findMany({
        where: {
          status: 'PENDING'
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
              profileImage: true
            }
          }
        },
        orderBy: {
          uploadedAt: 'asc'
        }
      });

      sendSuccessResponse(res, pendingCertifications);
    } catch (error: any) {
      console.error('Error fetching pending certifications:', error);
      sendErrorResponse(res, 'Error fetching pending certifications', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Approve a certification
   * @param req Express request
   * @param res Express response
   */
  async approveCertification(req: Request, res: Response): Promise<void> {
    try {
      const { certificationId } = req.params;
      const { adminId } = req.body;

      if (!adminId) {
        sendErrorResponse(res, 'Admin ID is required', HttpStatusCode.BAD_REQUEST);
        return;
      }

      const updatedCertification = await this.db.userCertification.update({
        where: {
          id: certificationId
        },
        data: {
          status: 'VERIFIED',
          verifiedAt: new Date(),
          verifierAdminId: adminId
        }
      });

      sendSuccessResponse(res, updatedCertification);
    } catch (error: any) {
      console.error('Error approving certification:', error);
      sendErrorResponse(res, 'Error approving certification', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Reject a certification
   * @param req Express request
   * @param res Express response
   */
  async rejectCertification(req: Request, res: Response): Promise<void> {
    try {
      const { certificationId } = req.params;
      const { adminId, rejectionReason } = req.body;

      if (!adminId || !rejectionReason) {
        sendErrorResponse(res, 'Admin ID and rejection reason are required', HttpStatusCode.BAD_REQUEST);
        return;
      }

      const updatedCertification = await this.db.userCertification.update({
        where: {
          id: certificationId
        },
        data: {
          status: 'REJECTED',
          rejectionReason,
          verifierAdminId: adminId
        }
      });

      sendSuccessResponse(res, updatedCertification);
    } catch (error: any) {
      console.error('Error rejecting certification:', error);
      sendErrorResponse(res, 'Error rejecting certification', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}

// Create and export a singleton instance for use in routes
export const certificationController = new CertificationController(); 