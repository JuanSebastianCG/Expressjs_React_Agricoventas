import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

// Define storage configurations for different upload types
const storage = {
  profile: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../../uploads/profiles'));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
      const extension = path.extname(file.originalname);
      cb(null, `profile-${uniqueSuffix}${extension}`);
    }
  }),
  
  certification: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../../uploads/certifications'));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
      const extension = path.extname(file.originalname);
      cb(null, `certification-${uniqueSuffix}${extension}`);
    }
  })
};

// File filter for uploads
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file types - accept images and PDFs for certifications
  if (
    file.mimetype === 'image/jpeg' || 
    file.mimetype === 'image/png' || 
    file.mimetype === 'image/jpg' || 
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, JPG images and PDF documents are allowed'));
  }
};

// Create upload configurations
const profileUpload = multer({ 
  storage: storage.profile,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter 
});

const certificationUpload = multer({ 
  storage: storage.certification,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter 
});

export class UploadController {
  /**
   * Upload profile image
   * @param req Express request
   * @param res Express response
   */
  async uploadProfileImage(req: Request, res: Response): Promise<void> {
    try {
      profileUpload.single('file')(req, res, (err) => {
        if (err) {
          return sendErrorResponse(res, err.message, HttpStatusCode.BAD_REQUEST);
        }
        
        if (!req.file) {
          return sendErrorResponse(res, 'No file uploaded', HttpStatusCode.BAD_REQUEST);
        }
        
        const file = req.file;
        const fileUrl = `/uploads/profiles/${file.filename}`;
        
        sendSuccessResponse(res, { 
          url: fileUrl,
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        });
      });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
  
  /**
   * Upload certification document
   * @param req Express request
   * @param res Express response
   */
  async uploadCertificationDocument(req: Request, res: Response): Promise<void> {
    try {
      certificationUpload.single('file')(req, res, (err) => {
        if (err) {
          return sendErrorResponse(res, err.message, HttpStatusCode.BAD_REQUEST);
        }
        
        if (!req.file) {
          return sendErrorResponse(res, 'No file uploaded', HttpStatusCode.BAD_REQUEST);
        }
        
        const file = req.file;
        const fileUrl = `/uploads/certifications/${file.filename}`;
        
        sendSuccessResponse(res, { 
          url: fileUrl,
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        });
      });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}

// Create and export a singleton instance for use in routes
export const uploadController = new UploadController(); 