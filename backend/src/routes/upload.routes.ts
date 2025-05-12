import express from 'express';
import { uploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';
import { sendSuccessResponse } from '../utils/responseHandler';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// All upload routes require authentication
router.use(authenticate);

// Debug endpoint to check folders
router.get('/debug', (req, res) => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  const certificationsDir = path.join(uploadsDir, 'certifications');
  
  // Check if directories exist
  const uploadsExists = fs.existsSync(uploadsDir);
  const certificationsExists = fs.existsSync(certificationsDir);
  
  // Get list of files in certifications directory
  let certificationFiles = [];
  if (certificationsExists) {
    try {
      certificationFiles = fs.readdirSync(certificationsDir);
    } catch (error) {
      console.error('Error reading certifications directory:', error);
    }
  }
  
  sendSuccessResponse(res, {
    message: 'Debug information',
    paths: {
      uploadsDir,
      certificationsDir
    },
    exists: {
      uploadsDir: uploadsExists,
      certificationsDir: certificationsExists
    },
    files: {
      certifications: certificationFiles
    }
  });
});

// Upload profile image
router.post('/profile', (req, res) => uploadController.uploadProfileImage(req, res));

// Upload certification document
router.post('/certifications', (req, res) => uploadController.uploadCertificationDocument(req, res));

export default router; 