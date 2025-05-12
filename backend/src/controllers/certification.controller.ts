import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hasRequiredCertifications, getCertificationsCount } from '../utils/certificateValidator';
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';
import fs from 'fs'; // Import fs for file operations
import path from 'path'; // Import path for path operations

// Create a prisma instance for normal usage
export const prisma = new PrismaClient();

export class CertificationController {
  private db: any;

  constructor(dbClient = prisma) {
    this.db = dbClient;
  }

  /**
   * Upload a new certification or update an existing one.
   * If updating, it will delete the old image file.
   * @param req Express request
   * @param res Express response
   */
  async uploadCertification(req: Request, res: Response): Promise<void> {
    try {
      const { 
        userId, 
        certificationName, 
        certificationType, 
        certificateNumber, 
        issuedDate, 
        expiryDate, 
        imageUrl // This is the new image URL from the upload service
      } = req.body;

      // Validate input
      if (!userId || !certificationName || !certificationType || !certificateNumber || !issuedDate || !expiryDate || !imageUrl) {
        sendErrorResponse(res, 'Missing required fields for certification', HttpStatusCode.BAD_REQUEST);
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
        // If certificate exists, and a new image URL is provided, delete the old image.
        if (existingCert.imageUrl && existingCert.imageUrl !== imageUrl) {
          const oldImagePath = path.join(__dirname, '../../uploads', existingCert.imageUrl.replace('/uploads/', ''));
          try {
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
              console.log(`Successfully deleted old certificate image: ${oldImagePath}`);
            }
          } catch (fileError) {
            console.error(`Failed to delete old certificate image ${oldImagePath}:`, fileError);
            // Decide if this error should prevent the update or just be logged.
            // For now, we'll log and continue.
          }
        }

        // Update existing certification
        const updatedCert = await this.db.userCertification.update({
          where: {
            id: existingCert.id
          },
          data: {
            certificationName,
            certificateNumber,
            issuedDate: new Date(issuedDate),
            expiryDate: new Date(expiryDate),
            imageUrl, // new image URL
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

      // Create new certification if it doesn't exist
      const certification = await this.db.userCertification.create({
        data: {
          userId,
          certificationName,
          certificationType,
          certificateNumber,
          issuedDate: new Date(issuedDate),
          expiryDate: new Date(expiryDate),
          imageUrl,
          status: 'PENDING'
        }
      });

      sendSuccessResponse(res, certification, HttpStatusCode.CREATED);
    } catch (error: any) {
      console.error('Error in uploadCertification controller:', error);
      // Check for Prisma-specific validation errors if applicable
      if (error.name === 'PrismaClientValidationError') {
        sendErrorResponse(res, `Validation error: ${error.message}`, HttpStatusCode.BAD_REQUEST);
        return;
      }
      sendErrorResponse(res, 'Server error during certification upload', HttpStatusCode.INTERNAL_SERVER_ERROR);
      return;
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