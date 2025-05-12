import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

// Ensure upload directories exist before configuring multer
const uploadsDir = path.join(__dirname, '../../uploads');
const profilesDir = path.join(uploadsDir, 'profiles');
const certificationsDir = path.join(uploadsDir, 'certifications');

// Create directories if they don't exist
[uploadsDir, profilesDir, certificationsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`UploadController: Created directory: ${dir}`);
    } catch (err) {
      console.error(`UploadController: Failed to create directory: ${dir}`, err);
    }
  }
});

// Define storage configurations for different upload types
const storage = {
  profile: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, profilesDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
      const extension = path.extname(file.originalname);
      cb(null, `profile-${uniqueSuffix}${extension}`);
    }
  }),
  
  certification: multer.diskStorage({
    destination: (req, file, cb) => {
      // Double check that directory exists
      if (!fs.existsSync(certificationsDir)) {
        try {
          fs.mkdirSync(certificationsDir, { recursive: true });
          console.log(`Created certifications directory on demand: ${certificationsDir}`);
        } catch (error) {
          console.error('Error creating certifications directory:', error);
          return cb(new Error('Failed to create certifications directory'), certificationsDir);
        }
      }
      cb(null, certificationsDir);
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
      console.log(`Received certification upload request from user ID: ${req.user?.userId || 'unknown user'}`);
      
      // Verify certifications directory exists
      if (!fs.existsSync(certificationsDir)) {
        try {
          fs.mkdirSync(certificationsDir, { recursive: true });
          console.log(`Created certifications directory: ${certificationsDir}`);
        } catch (dirError) {
          console.error('Failed to create certifications directory:', dirError);
          sendErrorResponse(
            res, 
            `Server error: Failed to create upload directory (${dirError.message})`, 
            HttpStatusCode.INTERNAL_SERVER_ERROR
          );
          return;
        }
      }
      
      // Process the file upload
      certificationUpload.single('file')(req, res, (err) => {
        if (err) {
          console.error('Certification upload error:', err);
          return sendErrorResponse(res, err.message, HttpStatusCode.BAD_REQUEST);
        }
        
        if (!req.file) {
          return sendErrorResponse(res, 'No file uploaded', HttpStatusCode.BAD_REQUEST);
        }
        
        const file = req.file;
        const fileUrl = `/uploads/certifications/${file.filename}`;
        
        console.log(`Successfully uploaded certification file: ${file.filename}`);
        
        // Use a consistent response format with both url and data.url
        sendSuccessResponse(res, { 
          url: fileUrl,  // Direct url property for backward compatibility
          data: { url: fileUrl },  // Nested in data property for newer format
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        });
      });
    } catch (error: any) {
      console.error('Unexpected error in certification upload:', error);
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}

// Create and export a singleton instance for use in routes
export const uploadController = new UploadController(); 