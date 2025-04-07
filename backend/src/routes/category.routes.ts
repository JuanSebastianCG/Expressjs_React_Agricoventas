import { Router } from "express"
import { CategoryController } from "../controllers/category.controller"
import { CategoryMiddleware } from "../middleware/category.middleware"
import { authenticate, authorize } from "../middleware/auth.middleware"

const router = Router()
const categoryController = new CategoryController()

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the category
 *         name:
 *           type: string
 *           description: The name of the category
 *         slug:
 *           type: string
 *           description: URL-friendly version of the name
 *         description:
 *           type: string
 *           description: Detailed description of the category
 *         parentId:
 *           type: string
 *           description: ID of the parent category (null for root categories)
 *         level:
 *           type: integer
 *           description: Hierarchy level (1 for root categories)
 *         path:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of ancestor category IDs
 *         isActive:
 *           type: boolean
 *           description: Whether the category is active or not
 *         metadata:
 *           type: object
 *           description: Additional metadata for the category
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the category was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the category was last updated
 *       example:
 *         id: "60d21b4667d0d8992e610c85"
 *         name: "Vegetables"
 *         slug: "vegetables"
 *         description: "Fresh vegetables from local farms"
 *         parentId: null
 *         level: 1
 *         path: []
 *         isActive: true
 *         metadata: { "icon": "vegetable-icon" }
 *         createdAt: "2023-05-15T10:30:00Z"
 *         updatedAt: "2023-05-15T10:30:00Z"
 */

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
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
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               parentId:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User is not an admin
 *       500:
 *         description: Server error
 */
router.post(
  "/categories",
  authenticate,
  CategoryMiddleware.isAdmin,
  CategoryMiddleware.validateCreateCategory,
  categoryController.createCategory.bind(categoryController),
)

/**
 * @swagger
 * /api/categories/{category_id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: category_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the category to retrieve
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.get(
  "/categories/:category_id",
  CategoryMiddleware.validateCategoryId,
  categoryController.getCategoryById.bind(categoryController),
)

/**
 * @swagger
 * /api/categories/slug/{slug}:
 *   get:
 *     summary: Get a category by slug
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Slug of the category to retrieve
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.get("/categories/slug/:slug", categoryController.getCategoryBySlug.bind(categoryController))

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get categories with filtering and pagination
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by category name or description
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *         description: Filter by parent category ID
 *       - in: query
 *         name: level
 *         schema:
 *           type: integer
 *         description: Filter by hierarchy level
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of categories per page
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */
router.get(
  "/categories",
  CategoryMiddleware.validateCategoryQuery,
  categoryController.getCategories.bind(categoryController),
)

/**
 * @swagger
 * /api/categories/tree:
 *   get:
 *     summary: Get hierarchical category tree
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Category tree retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/categories/tree", categoryController.getCategoryTree.bind(categoryController))

/**
 * @swagger
 * /api/categories/{category_id}/children:
 *   get:
 *     summary: Get child categories
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: category_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the parent category
 *     responses:
 *       200:
 *         description: Child categories retrieved successfully
 *       500:
 *         description: Server error
 */
router.get(
  "/categories/:category_id/children",
  CategoryMiddleware.validateCategoryId,
  categoryController.getChildCategories.bind(categoryController),
)

/**
 * @swagger
 * /api/categories/{category_id}/ancestors:
 *   get:
 *     summary: Get ancestor categories
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: category_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the category
 *     responses:
 *       200:
 *         description: Ancestor categories retrieved successfully
 *       500:
 *         description: Server error
 */
router.get(
  "/categories/:category_id/ancestors",
  CategoryMiddleware.validateCategoryId,
  categoryController.getAncestorCategories.bind(categoryController),
)

/**
 * @swagger
 * /api/categories/{category_id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the category to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               parentId:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.put(
  "/categories/:category_id",
  authenticate,
  CategoryMiddleware.isAdmin,
  CategoryMiddleware.validateCategoryId,
  CategoryMiddleware.validateUpdateCategory,
  categoryController.updateCategory.bind(categoryController),
)

/**
 * @swagger
 * /api/categories/{category_id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the category to delete
 *     responses:
 *       204:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/categories/:category_id",
  authenticate,
  CategoryMiddleware.isAdmin,
  CategoryMiddleware.validateCategoryId,
  categoryController.deleteCategory.bind(categoryController),
)

/**
 * @swagger
 * /api/categories/bulk-update:
 *   patch:
 *     summary: Bulk update categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *               - data
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               data:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 *                   metadata:
 *                     type: object
 *     responses:
 *       200:
 *         description: Categories updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User is not an admin
 *       500:
 *         description: Server error
 */
router.patch(
  "/categories/bulk-update",
  authenticate,
  CategoryMiddleware.isAdmin,
  CategoryMiddleware.validateBulkUpdate,
  categoryController.bulkUpdateCategories.bind(categoryController),
)

export default router

