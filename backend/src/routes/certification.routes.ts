import express from 'express';
import { certificationController } from '../controllers/certification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User certification routes
router.post('/upload', (req, res) => certificationController.uploadCertification(req, res));
router.get('/user/:userId', (req, res) => certificationController.getUserCertifications(req, res));
router.get('/verify/:userId', (req, res) => certificationController.verifyUserCertifications(req, res));

// Admin-only routes
router.get('/pending', authorize(['ADMIN']), (req, res) => certificationController.getPendingCertifications(req, res));
router.put('/approve/:certificationId', authorize(['ADMIN']), (req, res) => certificationController.approveCertification(req, res));
router.put('/reject/:certificationId', authorize(['ADMIN']), (req, res) => certificationController.rejectCertification(req, res));

export default router; 