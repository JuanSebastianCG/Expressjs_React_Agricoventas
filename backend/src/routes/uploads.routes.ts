import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../../uploads/certifications');
if (!fs.existsSync(uploadsDir)) {
  // Create directory recursively
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory: ${uploadsDir}`);
}

// Configure Multer for certificate image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the directory exists (redundant but safe)
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'cert-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// All routes require authentication
router.use(authenticate);

// Route for uploading certification images
router.post('/certifications', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      error: { 
        message: 'No file uploaded',
        code: 'BAD_REQUEST'
      }
    });
  }
  
  // Return the URL to access the file
  return res.json({ 
    success: true, 
    data: { 
      url: `/uploads/certifications/${req.file.filename}` 
    }
  });
});

export default router; 