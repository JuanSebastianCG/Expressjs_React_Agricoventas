import express from 'express';
import authRoutes from './auth.routes';
import certificationRoutes from './certification.routes';
import orderRoutes from './order.routes';
import productRoutes from './product.routes';
import uploadRoutes from './upload.routes';
import userRoutes from './user.routes';

const router = express.Router();

// Register all routes
router.use('/auth', authRoutes);
router.use('/certifications', certificationRoutes);
router.use('/orders', orderRoutes);
router.use('/products', productRoutes);
router.use('/uploads', uploadRoutes);
router.use('/users', userRoutes);

export default router; 