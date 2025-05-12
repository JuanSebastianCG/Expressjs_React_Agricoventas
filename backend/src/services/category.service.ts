import { PrismaClient } from "@prisma/client"
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryParams,
  CategoryTreeNode,
} from "../schemas/category.schema"
import { ApiError } from "../middleware/error.middleware"
import HttpStatusCode from "../utils/HttpStatusCode"
import { logger } from "../config/logger"

// Initialize Prisma client
const prisma = new PrismaClient()

export class CategoryService {
  /**
   * Create a new category
   * @param data - Category data
   * @returns Created category
   */
  async create(data: CreateCategoryDto) {
    try {
      // Handle hierarchical structure
      let level = 1
      let path: string[] = []

      if (data.parentId) {
        // Find parent category to get its level and path
        const parentCategory = await prisma.category.findUnique({
          where: { id: data.parentId },
        })

        if (!parentCategory) {
          throw new ApiError(HttpStatusCode.NOT_FOUND, "Parent category not found")
        }

        // Set level as parent level + 1
        level = parentCategory.level + 1

        // Set path as parent path + parent id
        path = [...parentCategory.path, parentCategory.id]
      }

      // Create the category
      return prisma.category.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          parentId: data.parentId,
          level,
          path,
          metadata: data.metadata || {},
        },
      })
    } catch (error) {
      logger.error("Error creating category:", error)
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to create category")
    }
  }

  /**
   * Get a category by ID
   * @param id - Category ID
   * @returns Category if found, null otherwise
   */
  async findById(id: string) {
    try {
      return prisma.category.findUnique({
        where: { id },
      })
    } catch (error) {
      logger.error("Error finding category by ID:", error)
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to find category")
    }
  }

  /**
   * Get a category by slug
   * @param slug - Category slug
   * @returns Category if found, null otherwise
   */
  async findBySlug(slug: string) {
    try {
      return prisma.category.findUnique({
        where: { slug },
      })
    } catch (error) {
      logger.error("Error finding category by slug:", error)
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to find category")
    }
  }

  /**
   * Get categories with filtering and pagination
   * @param params - Query parameters
   * @returns Categories and pagination info
   */
  async findAll(params: CategoryQueryParams) {
    try {
      const { search, parentId, level, isActive, page = 1, limit = 10 } = params

      const skip = (page - 1) * limit

      // Build where clause for filtering
      const where: any = {}

      if (isActive !== undefined) {
        where.isActive = isActive
      }

      if (parentId) {
        where.parentId = parentId
      }

      if (level !== undefined) {
        where.level = level
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ]
      }

      // Get categories and total count
      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: "asc" },
        }),
        prisma.category.count({ where }),
      ])

      return {
        categories,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      logger.error("Error finding categories:", error)
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to find categories")
    }
  }

  /**
   * Get all categories as a hierarchical tree
   * @returns Hierarchical category tree
   */
  async getTree() {
    try {
      // Get all active categories
      const allCategories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      })

      // Convert to map for easy lookup
      const categoriesMap = new Map()
      allCategories.forEach((category) => {
        categoriesMap.set(category.id, {
          ...category,
          children: [],
        })
      })

      // Build the tree
      const rootCategories: CategoryTreeNode[] = []

      // Populate children arrays
      allCategories.forEach((category) => {
        if (category.parentId && categoriesMap.has(category.parentId)) {
          // This is a child category, add to parent's children
          const parentCategory = categoriesMap.get(category.parentId)
          parentCategory.children.push(categoriesMap.get(category.id))
        } else {
          // This is a root category
          rootCategories.push(categoriesMap.get(category.id))
        }
      })

      return rootCategories
    } catch (error) {
      logger.error("Error getting category tree:", error)
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to get category tree")
    }
  }

  /**
   * Get child categories of a specific category
   * @param parentId - Parent category ID
   * @returns Child categories
   */
  async getChildren(parentId: string) {
    try {
      return prisma.category.findMany({
        where: {
          parentId,
          isActive: true,
        },
        orderBy: { name: "asc" },
      })
    } catch (error) {
      logger.error("Error getting child categories:", error)
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to get child categories")
    }
  }

  /**
   * Get ancestor categories of a specific category
   * @param categoryId - Category ID
   * @returns Ancestor categories
   */
  async getAncestors(categoryId: string) {
    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      })

      if (!category) {
        return []
      }

      // Get all ancestors using the path array
      return prisma.category.findMany({
        where: {
          id: { in: category.path },
        },
        orderBy: { level: "asc" },
      })
    } catch (error) {
      logger.error("Error getting ancestor categories:", error)
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to get ancestor categories")
    }
  }

  /**
   * Update a category
   * @param id - Category ID
   * @param data - Updates for the category
   * @returns Updated category
   */
  async update(id: string, data: UpdateCategoryDto) {
    try {
      // Check if we're updating the parent
      if (data.parentId !== undefined) {
        // Prevent circular references
        if (data.parentId === id) {
          throw new ApiError(HttpStatusCode.BAD_REQUEST, "A category cannot be its own parent")
        }

        // Check if the new parent exists
        if (data.parentId) {
          const newParent = await prisma.category.findUnique({
            where: { id: data.parentId },
          })

          if (!newParent) {
            throw new ApiError(HttpStatusCode.NOT_FOUND, "Parent category not found")
          }

          // Make sure the new parent is not a descendant of this category
          const descendants = await this.getDescendants(id)
          if (descendants.some((desc) => desc.id === data.parentId)) {
            throw new ApiError(HttpStatusCode.BAD_REQUEST, "Cannot set a descendant as parent")
          }

          // Update level and path
          const level = newParent.level + 1
          const path = [...newParent.path, newParent.id]

          // Update this category and all its descendants
          await this.updateCategoryHierarchy(id, level, path)
        } else {
          // Setting to root level
          await this.updateCategoryHierarchy(id, 1, [])
        }
      }

      // Update the category
      return prisma.category.update({
        where: { id },
        data,
      })
    } catch (error) {
      logger.error("Error updating category:", error)
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to update category")
    }
  }

  /**
   * Update category hierarchy (level and path) for a category and all its descendants
   * @param categoryId - Category ID
   * @param newLevel - New level
   * @param newPath - New path
   */
  private async updateCategoryHierarchy(categoryId: string, newLevel: number, newPath: string[]) {
    try {
      // Update the category itself
      await prisma.category.update({
        where: { id: categoryId },
        data: {
          level: newLevel,
          path: newPath,
        },
      })

      // Get direct children
      const children = await prisma.category.findMany({
        where: { parentId: categoryId },
      })

      // Recursively update all children
      for (const child of children) {
        await this.updateCategoryHierarchy(child.id, newLevel + 1, [...newPath, categoryId])
      }
    } catch (error) {
      logger.error("Error updating category hierarchy:", error)
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to update category hierarchy")
    }
  }

  /**
   * Get all descendants of a category
   * @param categoryId - Category ID
   * @returns Descendant categories
   */
  async getDescendants(categoryId: string) {
    try {
      return prisma.category.findMany({
        where: {
          path: { has: categoryId },
        },
        orderBy: { level: "asc" },
      })
    } catch (error) {
      logger.error("Error getting descendant categories:", error)
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to get descendant categories")
    }
  }

  /**
   * Delete a category (soft delete)
   * @param id - Category ID
   * @returns Updated category
   */
  async delete(id: string) {
    try {
      // Check if category has children
      const childrenCount = await prisma.category.count({
        where: { parentId: id, isActive: true },
      })

      if (childrenCount > 0) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Cannot delete a category with active children")
      }

      // Check if category has products
      const productsCount = await prisma.product.count({
        where: { category: id, isActive: true },
      })

      if (productsCount > 0) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Cannot delete a category with active products")
      }

      // Soft delete the category
      return prisma.category.update({
        where: { id },
        data: { isActive: false },
      })
    } catch (error) {
      logger.error("Error deleting category:", error)
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to delete category")
    }
  }

  /**
   * Hard delete a category
   * @param id - Category ID
   * @returns Deleted category
   */
  async hardDelete(id: string) {
    try {
      // Check if category has children
      const childrenCount = await prisma.category.count({
        where: { parentId: id },
      })

      if (childrenCount > 0) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Cannot delete a category with children")
      }

      // Check if category has products
      const productsCount = await prisma.product.count({
        where: { category: id },
      })

      if (productsCount > 0) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Cannot delete a category with products")
      }

      // Hard delete the category
      return prisma.category.delete({
        where: { id },
      })
    } catch (error) {
      logger.error("Error hard deleting category:", error)
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to hard delete category")
    }
  }

  /**
   * Bulk update categories
   * @param ids - Category IDs
   * @param data - Updates for the categories
   * @returns Number of updated categories
   */
  async bulkUpdate(ids: string[], data: Partial<UpdateCategoryDto>) {
    try {
      // Exclude parentId from bulk updates to avoid hierarchy issues
      const { parentId, ...updateData } = data

      const result = await prisma.category.updateMany({
        where: {
          id: { in: ids },
        },
        data: updateData,
      })

      return result.count
    } catch (error) {
      logger.error("Error bulk updating categories:", error)
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to bulk update categories")
    }
  }

  /**
   * Check if a slug is already in use
   * @param slug - Category slug
   * @param excludeId - Category ID to exclude from check
   * @returns True if slug is available, false otherwise
   */
  async isSlugAvailable(slug: string, excludeId?: string) {
    try {
      const where: any = { slug }

      if (excludeId) {
        where.id = { not: excludeId }
      }

      const count = await prisma.category.count({ where })
      return count === 0
    } catch (error) {
      logger.error("Error checking slug availability:", error)
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to check slug availability")
    }
  }
}
