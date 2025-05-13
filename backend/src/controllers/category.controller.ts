import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
  CategoryResponse,
} from '../schemas/category.schema';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
} from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

const prisma = new PrismaClient();

export class CategoryController {
  private db: PrismaClient;

  constructor(dbClient: PrismaClient = prisma) {
    this.db = dbClient;
  }

  /**
   * Create a new category
   */
  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryData: CreateCategoryDto = req.body;

      // Check for parentId validity if provided
      if (categoryData.parentId) {
        const parentCategory = await (this.db as any).category.findUnique({
          where: { id: categoryData.parentId },
        });
        if (!parentCategory) {
          sendErrorResponse(res, 'Parent category not found', HttpStatusCode.BAD_REQUEST);
          return;
        }
        // Optional: Check hierarchy depth (e.g., max 2 levels)
        if (parentCategory.parentId) {
            sendErrorResponse(res, 'Cannot create a category more than two levels deep.', HttpStatusCode.BAD_REQUEST);
            return;
        }
      }

      const category = await (this.db as any).category.create({
        data: {
          name: categoryData.name,
          description: categoryData.description,
          iconUrl: categoryData.iconUrl,
          parentId: categoryData.parentId,
        },
      });
      sendSuccessResponse(res, this.mapToCategoryResponse(category), HttpStatusCode.CREATED);
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        sendErrorResponse(res, 'Category with this name already exists.', HttpStatusCode.CONFLICT);
      } else {
        console.error('Error creating category:', error);
        sendErrorResponse(res, 'Failed to create category', HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
    }
  }

  /**
   * Get a category by ID
   */
  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = req.params.categoryId;
      const { includeParent, includeChildren } = req.query as unknown as CategoryQueryDto;

      const category = await (this.db as any).category.findUnique({
        where: { id: categoryId },
        include: {
          parent: includeParent ? true : undefined,
          children: includeChildren ? true : undefined,
        },
      });

      if (!category) {
        sendNotFoundResponse(res, 'Category not found');
        return;
      }
      sendSuccessResponse(res, this.mapToCategoryResponse(category, includeParent, includeChildren));
    } catch (error: any) {
      console.error(`Error fetching category ${req.params.categoryId}:`, error);
      sendErrorResponse(res, 'Failed to fetch category', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all categories with filtering
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const { parentId, includeChildren, includeParent, level } = req.query as unknown as CategoryQueryDto;

      const where: any = {};
      if (parentId) {
        where.parentId = parentId;
      } else if (level === 1 || (level === undefined && !parentId)) {
        // Only top-level categories if level 1 or no parentId specified
        where.parentId = null;
      }
      // If level 2 is specified, we might need a more complex query or multiple queries
      // For simplicity, level 2 without parentId might mean all second-level categories.

      const include: any = {};
      if (includeParent) {
        include.parent = true;
      }
      if (includeChildren) {
        include.children = true;
      }
       if (level === 2 && !parentId) {
        // If we want all level 2 categories, we fetch top-level, then their children.
        // This might be inefficient for large datasets.
        // A more optimized approach might involve a raw query or specific Prisma features if available.
        // For now, we fetch all and filter, or fetch top-level and include children.
        // Let's fetch all and let client filter or refine later.
        // Or, fetch top-level with children.
         const topLevelCategories = await (this.db as any).category.findMany({
            where: { parentId: null },
            include: { children: true },
        });
        const secondLevelCategories = topLevelCategories.flatMap(tlc => tlc.children || []);
        const responseCategories = secondLevelCategories.map(cat => this.mapToCategoryResponse(cat, includeParent, false)); // Children already fetched

        sendSuccessResponse(res, { categories: responseCategories, total: secondLevelCategories.length });
        return;

      }


      const categories = await (this.db as any).category.findMany({
        where,
        include,
        orderBy: { name: 'asc' },
      });

      const responseCategories = categories.map(cat => this.mapToCategoryResponse(cat, includeParent, includeChildren));
      sendSuccessResponse(res, { categories: responseCategories, total: categories.length });
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      sendErrorResponse(res, 'Failed to fetch categories', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update a category
   */
  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = req.params.categoryId;
      const updateData: UpdateCategoryDto = req.body;

      const category = await (this.db as any).category.findUnique({ where: { id: categoryId } });
      if (!category) {
        sendNotFoundResponse(res, 'Category not found');
        return;
      }

      // Prevent making a category its own parent or creating circular dependencies
      if (updateData.parentId && updateData.parentId === categoryId) {
        sendErrorResponse(res, 'Category cannot be its own parent.', HttpStatusCode.BAD_REQUEST);
        return;
      }

      // Check for parentId validity if provided
      if (updateData.parentId) {
        const parentCategory = await (this.db as any).category.findUnique({
          where: { id: updateData.parentId },
        });
        if (!parentCategory) {
          sendErrorResponse(res, 'Parent category not found', HttpStatusCode.BAD_REQUEST);
          return;
        }
         // Optional: Check hierarchy depth (e.g., max 2 levels)
        if (parentCategory.parentId) {
            sendErrorResponse(res, 'Cannot move category to be more than two levels deep.', HttpStatusCode.BAD_REQUEST);
            return;
        }
      }


      const updatedCategory = await (this.db as any).category.update({
        where: { id: categoryId },
        data: {
          name: updateData.name,
          description: updateData.description,
          iconUrl: updateData.iconUrl,
          parentId: updateData.parentId === null ? null : updateData.parentId, // Explicitly allow unsetting parent
        },
      });
      sendSuccessResponse(res, this.mapToCategoryResponse(updatedCategory));
    } catch (error: any)
{
      const categoryId = req.params.categoryId;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        sendErrorResponse(res, 'Category with this name already exists.', HttpStatusCode.CONFLICT);
      } else {
        console.error(`Error updating category ${categoryId}:`, error);
        sendErrorResponse(res, 'Failed to update category', HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = req.params.categoryId;

      const category = await (this.db as any).category.findUnique({
        where: { id: categoryId },
        include: { children: true, products: { take: 1 } }, // Check for children and products
      });

      if (!category) {
        sendNotFoundResponse(res, 'Category not found');
        return;
      }

      if (category.children && category.children.length > 0) {
        sendErrorResponse(
          res,
          'Cannot delete category with child categories. Please delete or reassign child categories first.',
          HttpStatusCode.BAD_REQUEST
        );
        return;
      }

      if (category.products && category.products.length > 0) {
        sendErrorResponse(
          res,
          'Cannot delete category with associated products. Please reassign products to another category first.',
          HttpStatusCode.BAD_REQUEST
        );
        return;
      }
      
      // Also need to check ProductRecommendations
      const recommendations = await (this.db as any).productRecommendation.findFirst({
        where: { categoryId: categoryId } as any
      });

      if (recommendations) {
         sendErrorResponse(
          res,
          'Cannot delete category with associated product recommendations. Please reassign recommendations first.',
          HttpStatusCode.BAD_REQUEST
        );
        return;
      }


      await (this.db as any).category.delete({
        where: { id: categoryId },
      });
      sendSuccessResponse(res, { message: 'Category deleted successfully' }, HttpStatusCode.OK);
    } catch (error: any) {
      const categoryId = req.params.categoryId;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
         sendNotFoundResponse(res, 'Category not found');
      } else {
        console.error(`Error deleting category ${categoryId}:`, error);
        sendErrorResponse(res, 'Failed to delete category', HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
    }
  }

  /**
   * Map category entity to category response
   */
  private mapToCategoryResponse(
    category: any, // Prisma category type, potentially with parent/children
    includeParent?: boolean,
    includeChildren?: boolean
  ): CategoryResponse {
    const response: CategoryResponse = {
      id: category.id,
      name: category.name,
      description: category.description,
      iconUrl: category.iconUrl,
      parentId: category.parentId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    if (includeParent && category.parent) {
      response.parent = this.mapToCategoryResponse(category.parent, false, false); // Avoid deep nesting
    }
    if (includeChildren && category.children) {
      response.children = category.children.map((child: any) =>
        this.mapToCategoryResponse(child, false, false) // Avoid deep nesting
      );
    }
    return response;
  }
} 