import express from 'express';
import { certificationController } from '../controllers/certification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

// Test route for uploads
router.post('/test-upload', upload.single('file'), (req, res): void => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }
  res.json({ 
    success: true, 
    data: { 
      url: `/uploads/certifications/${req.file.filename}`,
      filename: req.file.filename,
      originalname: req.file.originalname
    } 
  });
});

// User certification routes
router.post('/upload', (req, res) => certificationController.uploadCertification(req, res));
router.get('/user/:userId', (req, res) => certificationController.getUserCertifications(req, res));
router.get('/verify/:userId', (req, res) => certificationController.verifyUserCertifications(req, res));
// New route for required certification details
router.get('/user/:userId/required-status', (req, res) => certificationController.getRequiredCertificationDetails(req, res));

// Admin-only routes
router.get('/admin', authorize(['ADMIN']), (req, res) => certificationController.getAllCertificationsAdmin(req, res));
router.put('/approve/:certificationId', authorize(['ADMIN']), (req, res) => certificationController.approveCertification(req, res));
router.put('/reject/:certificationId', authorize(['ADMIN']), (req, res) => certificationController.rejectCertification(req, res));

export default router; 