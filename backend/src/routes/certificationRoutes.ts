import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { CertificationController } from '../controllers/certificationController';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();
const certificationController = new CertificationController();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/certifications');
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

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * @swagger
 * /certifications:
 *   get:
 *     summary: Get all certifications (admin only)
 *     tags: [Certifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all certifications
 */
router.get('/', authenticate, authorize(['ADMIN']), (req, res) => 
  certificationController.getAllCertifications(req, res));

/**
 * @swagger
 * /certifications/types:
 *   get:
 *     summary: Get all required certification types
 *     tags: [Certifications]
 *     responses:
 *       200:
 *         description: List of required certification types
 */
router.get('/types', (req, res) => 
  certificationController.getRequiredCertificationTypes(req, res));

/**
 * @swagger
 * /certifications/seller/{sellerId}:
 *   get:
 *     summary: Get certifications for a specific seller
 *     tags: [Certifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Seller ID
 *     responses:
 *       200:
 *         description: List of seller's certifications
 */
router.get('/seller/:sellerId', authenticate, (req, res) => 
  certificationController.getSellerCertifications(req, res));

/**
 * @swagger
 * /certifications/{certificationId}:
 *   get:
 *     summary: Get a certification by ID
 *     tags: [Certifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: certificationId
 *         schema:
 *           type: string
 *         required: true
 *         description: Certification ID
 *     responses:
 *       200:
 *         description: Certification details
 */
router.get('/:certificationId', authenticate, (req, res) => 
  certificationController.getCertificationById(req, res));

/**
 * @swagger
 * /certifications:
 *   post:
 *     summary: Submit a new certification
 *     tags: [Certifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               certificationName:
 *                 type: string
 *               certificationType:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Certification submitted successfully
 */
router.post('/', authenticate, upload.single('image'), (req, res) => 
  certificationController.submitCertification(req, res));

/**
 * @swagger
 * /certifications/{certificationId}/verify:
 *   put:
 *     summary: Verify or reject a certification (admin only)
 *     tags: [Certifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: certificationId
 *         schema:
 *           type: string
 *         required: true
 *         description: Certification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [VERIFIED, REJECTED]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Certification verified or rejected successfully
 */
router.put('/:certificationId/verify', authenticate, authorize(['ADMIN']), (req, res) => 
  certificationController.verifyCertification(req, res));

export default router; 