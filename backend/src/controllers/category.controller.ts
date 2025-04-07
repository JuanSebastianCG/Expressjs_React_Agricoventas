import type { Request, Response } from "express";
import { CategoryService } from "../services/category.service";
import type { CreateCategoryDto, UpdateCategoryDto, CategoryQueryParams } from "../schemas/category.schema";
import HttpStatusCode from "../utils/HttpStatusCode";
import { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } from "../utils/responseHandler";

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryData: CreateCategoryDto = req.body;

      const isSlugAvailable = await this.categoryService.isSlugAvailable(categoryData.slug);
      if (!isSlugAvailable) {
        sendErrorResponse(res, "Slug is already in use", HttpStatusCode.BAD_REQUEST, "VALIDATION_ERROR");
        return;
      }

      const category = await this.categoryService.create(categoryData);
      sendSuccessResponse(res, category, HttpStatusCode.CREATED);
    } catch (error) {
      console.error("Error creating category:", error);
      sendErrorResponse(res, "Failed to create category", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = req.params.category_id;
      const category = await this.categoryService.findById(categoryId);

      if (!category) {
        sendNotFoundResponse(res, "Category not found");
        return;
      }

      sendSuccessResponse(res, category);
    } catch (error) {
      console.error("Error retrieving category:", error);
      sendErrorResponse(res, "Failed to retrieve category", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getCategoryBySlug(req: Request, res: Response): Promise<void> {
    try {
      const slug = req.params.slug;
      const category = await this.categoryService.findBySlug(slug);

      if (!category) {
        sendNotFoundResponse(res, "Category not found");
        return;
      }

      sendSuccessResponse(res, category);
    } catch (error) {
      console.error("Error retrieving category:", error);
      sendErrorResponse(res, "Failed to retrieve category", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const queryParams: CategoryQueryParams = {
        search: req.query.search as string,
        parentId: req.query.parentId as string,
        level: req.query.level ? Number(req.query.level) : undefined,
        isActive: req.query.isActive === "false" ? false : true,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      };

      const result = await this.categoryService.findAll(queryParams);
      sendSuccessResponse(res, result);
    } catch (error) {
      console.error("Error retrieving categories:", error);
      sendErrorResponse(res, "Failed to retrieve categories", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getCategoryTree(req: Request, res: Response): Promise<void> {
    try {
      const tree = await this.categoryService.getTree();
      sendSuccessResponse(res, tree);
    } catch (error) {
      console.error("Error retrieving category tree:", error);
      sendErrorResponse(res, "Failed to retrieve category tree", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getChildCategories(req: Request, res: Response): Promise<void> {
    try {
      const parentId = req.params.category_id;
      const children = await this.categoryService.getChildren(parentId);
      sendSuccessResponse(res, children);
    } catch (error) {
      console.error("Error retrieving child categories:", error);
      sendErrorResponse(res, "Failed to retrieve child categories", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getAncestorCategories(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = req.params.category_id;
      const ancestors = await this.categoryService.getAncestors(categoryId);
      sendSuccessResponse(res, ancestors);
    } catch (error) {
      console.error("Error retrieving ancestor categories:", error);
      sendErrorResponse(res, "Failed to retrieve ancestor categories", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = req.params.category_id;
      const updateData: UpdateCategoryDto = req.body;

      const category = await this.categoryService.findById(categoryId);
      if (!category) {
        sendNotFoundResponse(res, "Category not found");
        return;
      }

      if (updateData.slug && updateData.slug !== category.slug) {
        const isSlugAvailable = await this.categoryService.isSlugAvailable(updateData.slug, categoryId);
        if (!isSlugAvailable) {
          sendErrorResponse(res, "Slug is already in use", HttpStatusCode.BAD_REQUEST, "VALIDATION_ERROR");
          return;
        }
      }

      const updatedCategory = await this.categoryService.update(categoryId, updateData);
      sendSuccessResponse(res, updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      sendErrorResponse(res, "Failed to update category", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = req.params.category_id;

      const category = await this.categoryService.findById(categoryId);
      if (!category) {
        sendNotFoundResponse(res, "Category not found");
        return;
      }

      await this.categoryService.delete(categoryId);
      sendSuccessResponse(res, null, HttpStatusCode.NO_CONTENT);
    } catch (error) {
      console.error("Error deleting category:", error);
      sendErrorResponse(res, "Failed to delete category", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async bulkUpdateCategories(req: Request, res: Response): Promise<void> {
    try {
      const { ids, data } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        sendErrorResponse(res, "Invalid category IDs", HttpStatusCode.BAD_REQUEST);
        return;
      }

      const updatedCount = await this.categoryService.bulkUpdate(ids, data);
      sendSuccessResponse(res, { updatedCount });
    } catch (error) {
      console.error("Error bulk updating categories:", error);
      sendErrorResponse(res, "Failed to bulk update categories", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}