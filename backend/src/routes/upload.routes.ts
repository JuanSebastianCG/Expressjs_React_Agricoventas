import express from 'express';
import { uploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All upload routes require authentication
router.use(authenticate);

// Upload profile image
router.post('/profile', (req, res) => uploadController.uploadProfileImage(req, res));

// Upload certification document
router.post('/certification', (req, res) => uploadController.uploadCertificationDocument(req, res));

export default router; 