import type { Request, Response, NextFunction } from "express"
import { CategoryService } from "../services/category.service"
import type { CreateCategoryDto, UpdateCategoryDto, CategoryQueryParams } from "../schemas/category.schema"
import HttpStatusCode from "../utils/HttpStatusCode"
import { sendSuccessResponse } from "../utils/responseHandler"
import { ApiError } from "../middleware/error.middleware"
import { logger } from "../config/logger"

export class CategoryController {
  private categoryService: CategoryService

  constructor() {
    this.categoryService = new CategoryService()
  }

  /**
   * Create a new category
   */
  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryData: CreateCategoryDto = req.body

      const isSlugAvailable = await this.categoryService.isSlugAvailable(categoryData.slug)
      if (!isSlugAvailable) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Slug is already in use")
      }

      const category = await this.categoryService.create(categoryData)
      sendSuccessResponse(res, { category }, HttpStatusCode.CREATED)
    } catch (error) {
      logger.error("Error creating category:", error)
      next(error)
    }
  }

  /**
   * Get a category by ID
   */
  async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = req.params.category_id
      const category = await this.categoryService.findById(categoryId)

      if (!category) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Category not found")
      }

      sendSuccessResponse(res, { category })
    } catch (error) {
      logger.error("Error retrieving category:", error)
      next(error)
    }
  }

  /**
   * Get a category by slug
   */
  async getCategoryBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = req.params.slug
      const category = await this.categoryService.findBySlug(slug)

      if (!category) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Category not found")
      }

      sendSuccessResponse(res, { category })
    } catch (error) {
      logger.error("Error retrieving category:", error)
      next(error)
    }
  }

  /**
   * Get categories with filtering and pagination
   */
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams: CategoryQueryParams = {
        search: req.query.search as string,
        parentId: req.query.parentId as string,
        level: req.query.level ? Number(req.query.level) : undefined,
        isActive: req.query.isActive === "false" ? false : true,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      }

      const result = await this.categoryService.findAll(queryParams)
      sendSuccessResponse(res, result)
    } catch (error) {
      logger.error("Error retrieving categories:", error)
      next(error)
    }
  }

  /**
   * Get hierarchical category tree
   */
  async getCategoryTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await this.categoryService.getTree()
      sendSuccessResponse(res, { tree })
    } catch (error) {
      logger.error("Error retrieving category tree:", error)
      next(error)
    }
  }

  /**
   * Get child categories
   */
  async getChildCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parentId = req.params.category_id
      const children = await this.categoryService.getChildren(parentId)
      sendSuccessResponse(res, { children })
    } catch (error) {
      logger.error("Error retrieving child categories:", error)
      next(error)
    }
  }

  /**
   * Get ancestor categories
   */
  async getAncestorCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = req.params.category_id
      const ancestors = await this.categoryService.getAncestors(categoryId)
      sendSuccessResponse(res, { ancestors })
    } catch (error) {
      logger.error("Error retrieving ancestor categories:", error)
      next(error)
    }
  }

  /**
   * Update a category
   */
  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = req.params.category_id
      const updateData: UpdateCategoryDto = req.body

      const category = await this.categoryService.findById(categoryId)
      if (!category) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Category not found")
      }

      if (updateData.slug && updateData.slug !== category.slug) {
        const isSlugAvailable = await this.categoryService.isSlugAvailable(updateData.slug, categoryId)
        if (!isSlugAvailable) {
          throw new ApiError(HttpStatusCode.BAD_REQUEST, "Slug is already in use")
        }
      }

      const updatedCategory = await this.categoryService.update(categoryId, updateData)
      sendSuccessResponse(res, { category: updatedCategory })
    } catch (error) {
      logger.error("Error updating category:", error)
      next(error)
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = req.params.category_id

      const category = await this.categoryService.findById(categoryId)
      if (!category) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Category not found")
      }

      await this.categoryService.delete(categoryId)
      sendSuccessResponse(res, null, HttpStatusCode.NO_CONTENT)
    } catch (error) {
      logger.error("Error deleting category:", error)
      next(error)
    }
  }

  /**
   * Bulk update categories
   */
  async bulkUpdateCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids, data } = req.body

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid category IDs")
      }

      const updatedCount = await this.categoryService.bulkUpdate(ids, data)
      sendSuccessResponse(res, { updatedCount })
    } catch (error) {
      logger.error("Error bulk updating categories:", error)
      next(error)
    }
  }
}
