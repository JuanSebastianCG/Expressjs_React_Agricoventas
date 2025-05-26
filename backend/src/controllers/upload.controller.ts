import { Request, Response } from 'express';
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';
import { 
  uploadProfileImage, 
  uploadCertificationImage,
  uploadProductImage,
  getS3Url
} from '../utils/s3Upload';

export class UploadController {
  /**
   * Upload profile image to S3
   * @param req Express request
   * @param res Express response
   */
  async uploadProfileImage(req: Request, res: Response): Promise<void> {
    try {
      uploadProfileImage.single('file')(req, res, (err) => {
        if (err) {
          return sendErrorResponse(res, err.message, HttpStatusCode.BAD_REQUEST);
        }
        
        if (!req.file) {
          return sendErrorResponse(res, 'No file uploaded', HttpStatusCode.BAD_REQUEST);
        }
        
        // @ts-ignore multer-s3 adds location property to file
        const fileUrl = req.file.location;
        
        sendSuccessResponse(res, { 
          url: fileUrl,
          // @ts-ignore multer-s3 adds key property to file
          key: req.file.key,
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        });
      });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
  
  /**
   * Upload certification document to S3
   * @param req Express request
   * @param res Express response
   */
  async uploadCertificationDocument(req: Request, res: Response): Promise<void> {
    try {
      console.log(`Received certification upload request from user ID: ${req.user?.userId || 'unknown user'}`);
      
      uploadCertificationImage.single('file')(req, res, (err) => {
        if (err) {
          console.error('Certification upload error:', err);
          return sendErrorResponse(res, err.message, HttpStatusCode.BAD_REQUEST);
        }
        
        if (!req.file) {
          return sendErrorResponse(res, 'No file uploaded', HttpStatusCode.BAD_REQUEST);
        }
        
        // @ts-ignore multer-s3 adds location property to file
        const fileUrl = req.file.location;
        
        console.log(`Successfully uploaded certification file to S3`);
        
        // Use a consistent response format with both url and data.url
        sendSuccessResponse(res, { 
          url: fileUrl,  // Direct url property for backward compatibility
          data: { url: fileUrl },  // Nested in data property for newer format
          // @ts-ignore multer-s3 adds key property to file
          key: req.file.key,
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        });
      });
    } catch (error: any) {
      console.error('Unexpected error in certification upload:', error);
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Upload product image to S3
   * @param req Express request
   * @param res Express response
   */
  async uploadProductImage(req: Request, res: Response): Promise<void> {
    try {
      uploadProductImage.single('file')(req, res, (err) => {
        if (err) {
          return sendErrorResponse(res, err.message, HttpStatusCode.BAD_REQUEST);
        }
        
        if (!req.file) {
          return sendErrorResponse(res, 'No file uploaded', HttpStatusCode.BAD_REQUEST);
        }
        
        // @ts-ignore multer-s3 adds location property to file
        const fileUrl = req.file.location;
        
        sendSuccessResponse(res, { 
          url: fileUrl,
          // @ts-ignore multer-s3 adds key property to file
          key: req.file.key,
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        });
      });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}

// Create and export a singleton instance for use in routes
export const uploadController = new UploadController(); 