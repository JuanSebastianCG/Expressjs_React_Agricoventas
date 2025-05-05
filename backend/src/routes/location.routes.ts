import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { locationIdSchema, createLocationSchema, updateLocationSchema, addLocationToUserSchema, addLocationToProductSchema } from '../schemas/location.schema';

const router = Router();
const locationController = new LocationController();

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Crear una nueva ubicación
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - city
 *               - state
 *             properties:
 *               name:
 *                 type: string
 *                 example: Finca Los Alpes
 *               address:
 *                 type: string
 *                 example: Km 5 Vía al Mar
 *               city:
 *                 type: string
 *                 example: Medellín
 *               state:
 *                 type: string
 *                 example: Antioquia
 *               country:
 *                 type: string
 *                 example: Colombia
 *                 default: Colombia
 *               postalCode:
 *                 type: string
 *                 example: 050001
 *               latitude:
 *                 type: number
 *                 example: 6.244338
 *               longitude:
 *                 type: number
 *                 example: -75.573553
 *               description:
 *                 type: string
 *                 example: Finca productora de café en las montañas de Antioquia
 *     responses:
 *       201:
 *         description: Ubicación creada exitosamente
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
 *                     location:
 *                       type: object
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.post('/', authenticate, validate(createLocationSchema), locationController.createLocation);

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Obtener todas las ubicaciones
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ubicaciones recuperada exitosamente
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
 *                     locations:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: No autenticado
 */
router.get('/', authenticate, locationController.getAllLocations);

/**
 * @swagger
 * /api/locations/search:
 *   get:
 *     summary: Buscar ubicaciones
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Término de búsqueda (nombre, ciudad, estado, país)
 *     responses:
 *       200:
 *         description: Resultados de búsqueda recuperados exitosamente
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
 *                     locations:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Consulta de búsqueda inválida
 *       401:
 *         description: No autenticado
 */
router.get('/search', authenticate, locationController.searchLocations);

/**
 * @swagger
 * /api/locations/{id}:
 *   get:
 *     summary: Obtener ubicación por ID
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ubicación
 *     responses:
 *       200:
 *         description: Ubicación recuperada exitosamente
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
 *                     location:
 *                       type: object
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Ubicación no encontrada
 */
router.get('/:id', authenticate, validate(locationIdSchema, 'params'), locationController.getLocationById);

/**
 * @swagger
 * /api/locations/{id}:
 *   put:
 *     summary: Actualizar ubicación
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ubicación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Ubicación actualizada exitosamente
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
 *                     location:
 *                       type: object
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Ubicación no encontrada
 */
router.put('/:id', authenticate, validate(locationIdSchema, 'params'), validate(updateLocationSchema), locationController.updateLocation);

/**
 * @swagger
 * /api/locations/{id}:
 *   delete:
 *     summary: Eliminar ubicación
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ubicación
 *     responses:
 *       200:
 *         description: Ubicación eliminada exitosamente
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
 *                   example: Location deleted successfully
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Ubicación no encontrada
 */
router.delete('/:id', authenticate, validate(locationIdSchema, 'params'), locationController.deleteLocation);

/**
 * @swagger
 * /api/locations/users/{id}:
 *   get:
 *     summary: Obtener ubicaciones de un usuario
 *     tags: [Locations]
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
 *         description: Ubicaciones del usuario recuperadas exitosamente
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
 *                     locations:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/users/:id', authenticate, locationController.getUserLocations);

/**
 * @swagger
 * /api/locations/users/{id}:
 *   post:
 *     summary: Asignar ubicación a un usuario
 *     tags: [Locations]
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
 *             required:
 *               - locationId
 *             properties:
 *               locationId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *               isPrimary:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Ubicación asignada exitosamente
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
 *                   example: Location added to user successfully
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Usuario o ubicación no encontrada
 */
router.post('/users/:id', authenticate, validate(addLocationToUserSchema), locationController.addLocationToUser);

/**
 * @swagger
 * /api/locations/users/{userId}/{locationId}:
 *   delete:
 *     summary: Eliminar ubicación de un usuario
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ubicación
 *     responses:
 *       200:
 *         description: Ubicación eliminada exitosamente del usuario
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
 *                   example: Location removed from user successfully
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Usuario o ubicación no encontrada
 */
router.delete('/users/:userId/:locationId', authenticate, locationController.removeLocationFromUser);

/**
 * @swagger
 * /api/locations/products/{id}:
 *   get:
 *     summary: Obtener ubicaciones de un producto
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Ubicaciones del producto recuperadas exitosamente
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
 *                     locations:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Producto no encontrado
 */
router.get('/products/:id', authenticate, locationController.getProductLocations);

/**
 * @swagger
 * /api/locations/products/{id}:
 *   post:
 *     summary: Asignar ubicación a un producto
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - locationId
 *             properties:
 *               locationId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *               isPrimary:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Ubicación asignada exitosamente
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
 *                   example: Location added to product successfully
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Producto o ubicación no encontrada
 */
router.post('/products/:id', authenticate, validate(addLocationToProductSchema), locationController.addLocationToProduct);

/**
 * @swagger
 * /api/locations/products/{productId}/{locationId}:
 *   delete:
 *     summary: Eliminar ubicación de un producto
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ubicación
 *     responses:
 *       200:
 *         description: Ubicación eliminada exitosamente del producto
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
 *                   example: Location removed from product successfully
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Producto o ubicación no encontrada
 */
router.delete('/products/:productId/:locationId', authenticate, locationController.removeLocationFromProduct);

export default router; 