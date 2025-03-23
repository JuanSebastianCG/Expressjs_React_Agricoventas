/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - fullName
 *         - username
 *         - email
 *         - role
 *         - isActive
 *       properties:
 *         id:
 *           type: string
 *           description: ID único del usuario
 *         fullName:
 *           type: string
 *           description: Nombre completo del usuario
 *         username:
 *           type: string
 *           description: Nombre de usuario único
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico único del usuario
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: Rol del usuario
 *         isActive:
 *           type: boolean
 *           description: Estado de la cuenta del usuario
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del usuario
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización del usuario
 *
 *     UserResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Estado de la operación
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *         message:
 *           type: string
 *           description: Mensaje descriptivo
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Nombre de usuario
 *         password:
 *           type: string
 *           format: password
 *           description: Contraseña del usuario
 *
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - username
 *         - email
 *         - password
 *       properties:
 *         fullName:
 *           type: string
 *           description: Nombre completo
 *         username:
 *           type: string
 *           description: Nombre de usuario único
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico único
 *         password:
 *           type: string
 *           format: password
 *           description: Contraseña segura
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Estado de la operación
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             accessToken:
 *               type: string
 *               description: Token JWT para autenticación
 *         message:
 *           type: string
 *           description: Mensaje descriptivo
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               description: Mensaje de error
 */

// Este archivo es solo para la documentación de Swagger
// No contiene código ejecutable
