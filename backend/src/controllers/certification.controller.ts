import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hasRequiredCertifications, getCertificationsCount, REQUIRED_CERTIFICATIONS } from '../utils/certificateValidator';
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
   * Get all certifications with filtering and pagination (for admin view)
   * @param req Express request with query params: status, userId, page, limit, sortBy, sortOrder
   * @param res Express response
   */
  async getAllCertificationsAdmin(req: Request, res: Response): Promise<void> {
    try {
      // Extract query parameters (consider adding validation with Zod)
      const { 
        status, 
        userId, 
        page = '1', 
        limit = '10',
        sortBy = 'uploadedAt', // Default sort field
        sortOrder = 'desc'    // Default sort order
      } = req.query as { 
        status?: string; 
        userId?: string; 
        page?: string; 
        limit?: string;
        sortBy?: 'uploadedAt' | 'verifiedAt' | 'certificationName' | 'user.username'; // Add more valid sort fields
        sortOrder?: 'asc' | 'desc';
      };

      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
      const skip = (pageNumber - 1) * limitNumber;

      // Build the where clause for Prisma query
      const whereClause: any = {};
      if (status) {
        whereClause.status = status;
      }
      if (userId) {
        whereClause.userId = userId;
      }
      
      // Build the orderBy clause
      const orderByClause: any = {};
      if (sortBy === 'user.username') {
        // Handle sorting by related field
        orderByClause.user = { username: sortOrder };
      } else if (sortBy) {
         orderByClause[sortBy] = sortOrder;
      }

      // Fetch certifications with pagination and filtering
      const certifications = await this.db.userCertification.findMany({
        where: whereClause,
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
          },
          // Include verifier admin details if needed
          verifierAdmin: {
             select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: orderByClause,
        skip: skip,
        take: limitNumber,
      });

      // Get the total count for pagination
      const totalCertifications = await this.db.userCertification.count({
        where: whereClause,
      });

      // Send response with data and pagination info
      sendSuccessResponse(res, {
        data: certifications,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalCertifications / limitNumber),
          totalItems: totalCertifications,
          itemsPerPage: limitNumber,
        },
      });
    } catch (error: any) {
      console.error('Error fetching all certifications for admin:', error);
      sendErrorResponse(res, 'Error fetching certifications', HttpStatusCode.INTERNAL_SERVER_ERROR);
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

  /**
   * Get details for each of the 4 required certifications for a user.
   * @param req Express request
   * @param res Express response
   */
  async getRequiredCertificationDetails(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      // Use authenticated user ID if 'me' is passed
      const targetUserId = userId === 'me' ? req.user?.userId : userId;

      if (!targetUserId) {
        sendErrorResponse(res, 'User ID not found or user not authenticated', HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Fetch all certifications for the target user
      const userCertifications = await this.db.userCertification.findMany({
        where: {
          userId: targetUserId,
          certificationType: { 
            in: REQUIRED_CERTIFICATIONS // Only fetch types that are in the required list
          }
        },
        orderBy: {
          uploadedAt: 'desc'
        }
      });

      // Create a map to store the results, initializing with null
      const requiredCertDetails: Record<string, any | null> = {};
      REQUIRED_CERTIFICATIONS.forEach(type => {
        requiredCertDetails[type] = null; // Initialize as null
      });

      // Populate the map with found certifications
      userCertifications.forEach(cert => {
        if (requiredCertDetails.hasOwnProperty(cert.certificationType)) {
          requiredCertDetails[cert.certificationType] = cert; // Replace null with the cert object
        }
      });

      sendSuccessResponse(res, requiredCertDetails);
    } catch (error: any) {
      console.error('Error fetching required certification details:', error);
      sendErrorResponse(res, 'Error fetching required certification details', HttpStatusCode.INTERNAL_SERVER_ERROR);
      // No return needed here as sendErrorResponse is the last statement
    }
  }
}

// Create and export a singleton instance for use in routes
export const certificationController = new CertificationController(); 