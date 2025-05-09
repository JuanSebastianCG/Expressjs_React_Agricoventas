import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { updateUserSchema, userIdSchema } from '../schemas/user.schema';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const userController = new UserController();

// Configuración provisional para la subida de archivos
// Esta solución funciona temporalmente si multer no está disponible
const imageUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Si req.body.imageUrl existe, usamos esa URL directamente
    if (req.body && req.body.imageUrl) {
      // Simular un archivo subido
      req.file = {
        filename: path.basename(req.body.imageUrl),
        path: req.body.imageUrl
      } as any;
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios recuperada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado, solo administradores pueden acceder
 */
router.get('/', authenticate, authorize(['admin']), userController.getAllUsers);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Obtener el perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil de usuario recuperado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *       401:
 *         description: No autenticado
 */
router.get('/me', authenticate, userController.getMyProfile);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Actualizar el perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Juan Pérez Actualizado
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan_updated@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *       401:
 *         description: No autenticado
 */
router.put('/me', authenticate, validate(updateUserSchema), userController.updateMyProfile);

/**
 * @swagger
 * /api/users/me/profile-image:
 *   put:
 *     summary: Actualizar imagen de perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/me/profile-image',
  authenticate,
  imageUploadMiddleware,
  userController.updateCurrentProfileImage
);

/**
 * @swagger
 * /api/users/{id}/profile-image:
 *   put:
 *     summary: Actualizar imagen de perfil de un usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://ejemplo.com/imagen.jpg
 *     responses:
 *       200:
 *         description: Imagen de perfil actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.put(
  '/:id/profile-image',
  authenticate,
  validate(userIdSchema, 'params'),
  imageUploadMiddleware,
  userController.updateProfileImage
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario recuperado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id', authenticate, validate(userIdSchema, 'params'), userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Juan Pérez Actualizado
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan_updated@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123!
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: user
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.put(
  '/:id',
  authenticate,
  validate(userIdSchema, 'params'),
  validate(updateUserSchema),
  userController.updateUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User deleted
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/:id', authenticate, validate(userIdSchema, 'params'), userController.deleteUser);

export default router;
