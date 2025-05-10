import express from 'express';
import multer from 'multer';
import path from 'path';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { updateUserSchema } from '../schemas/user.schema';

const router = express.Router();
const userController = new UserController();

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/profiles'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Aceptar solo imágenes
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
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/", authenticate, authorize(["ADMIN"]), (req, res) => userController.getAllUsers(req, res));

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 */
router.get("/:userId", authenticate, (req, res) => userController.getUserById(req, res));

/**
 * @swagger
 * /users/{userId}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserDto'
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put(
  "/:userId",
  authenticate,
  validateRequest(updateUserSchema),
  (req, res) => userController.updateUser(req, res)
);

/**
 * @swagger
 * /users/check/username:
 *   get:
 *     summary: Check if a username is available
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: Username to check
 *     responses:
 *       200:
 *         description: Username availability
 */
router.get("/check/username", (req, res) => userController.checkUsernameAvailability(req, res));

/**
 * @swagger
 * /users/check/email:
 *   get:
 *     summary: Check if an email is available
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Email to check
 *     responses:
 *       200:
 *         description: Email availability
 */
router.get("/check/email", (req, res) => userController.checkEmailAvailability(req, res));

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Deactivate a user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User account deactivated successfully
 */
router.delete("/:userId", authenticate, (req, res) => userController.deactivateUser(req, res));

// Profile image upload route
router.put(
  '/:userId/profile-image',
  authenticate,
  upload.single('profileImage'),
  (req, res) => userController.updateProfileImage(req, res)
);

// Get current user profile
router.get("/me", authenticate, (req, res) => {
  req.params.userId = 'me';
  userController.getUserById(req, res);
});

// Update current user profile
router.put("/me", authenticate, validateRequest(updateUserSchema), (req, res) => {
  req.params.userId = 'me';
  userController.updateUser(req, res);
});

// Current user profile image upload route
router.put(
  '/me/profile-image',
  authenticate,
  upload.single('profileImage'),
  (req, res) => {
    req.params.userId = 'me';
    userController.updateProfileImage(req, res);
  }
);

export default router; 