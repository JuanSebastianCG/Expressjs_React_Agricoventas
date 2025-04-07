import { PrismaClient } from "@prisma/client"
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryParams,
  CategoryTreeNode,
} from "../schemas/category.schema"

// Initialize Prisma client
const prisma = new PrismaClient()

export class CategoryService {
  /**
   * Create a new category
   * @param data - Category data
   * @returns Created category
   */
  async create(data: CreateCategoryDto) {
    // Handle hierarchical structure
    let level = 1
    let path: string[] = []

    if (data.parentId) {
      // Find parent category to get its level and path
      const parentCategory = await prisma.Category.findUnique({
        where: { id: data.parentId },
      })

      if (!parentCategory) {
        throw new Error("Parent category not found")
      }

      // Set level as parent level + 1
      level = parentCategory.level + 1

      // Set path as parent path + parent id
      path = [...parentCategory.path, parentCategory.id]
    }

    // Create the category
    return prisma.Category.create({
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
  }

  /**
   * Get a category by ID
   * @param id - Category ID
   * @returns Category if found, null otherwise
   */
  async findById(id: string) {
    return prisma.Category.findUnique({
      where: { id },
    })
  }

  /**
   * Get a category by slug
   * @param slug - Category slug
   * @returns Category if found, null otherwise
   */
  async findBySlug(slug: string) {
    return prisma.Category.findUnique({
      where: { slug },
    })
  }

  /**
   * Get categories with filtering and pagination
   * @param params - Query parameters
   * @returns Categories and pagination info
   */
  async findAll(params: CategoryQueryParams) {
    const { search, parentId, level, isActive, page = 1, limit = 10 } = params

    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = { isActive }

    if (parentId) {
      where.parentId = parentId
    }

    if (level !== undefined) {
      where.level = level
    }

    if (search) {
      where.OR = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Get categories and total count
    const [categories, total] = await Promise.all([
      prisma.Category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.Category.count({ where }),
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
  }

  /**
   * Get all categories as a hierarchical tree
   * @returns Hierarchical category tree
   */
  async getTree() {
    // Get all active categories
    const allCategories = await prisma.Category.findMany({
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
  }

  /**
   * Get child categories of a specific category
   * @param parentId - Parent category ID
   * @returns Child categories
   */
  async getChildren(parentId: string) {
    return prisma.Category.findMany({
      where: {
        parentId,
        isActive: true,
      },
      orderBy: { name: "asc" },
    })
  }

  /**
   * Get ancestor categories of a specific category
   * @param categoryId - Category ID
   * @returns Ancestor categories
   */
  async getAncestors(categoryId: string) {
    const category = await prisma.Category.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return []
    }

    // Get all ancestors using the path array
    return prisma.Category.findMany({
      where: {
        id: { in: category.path },
      },
      orderBy: { level: "asc" },
    })
  }

  /**
   * Update a category
   * @param id - Category ID
   * @param data - Updates for the category
   * @returns Updated category
   */
  async update(id: string, data: UpdateCategoryDto) {
    // Check if we're updating the parent
    if (data.parentId !== undefined) {
      // Prevent circular references
      if (data.parentId === id) {
        throw new Error("A category cannot be its own parent")
      }

      // Check if the new parent exists
      if (data.parentId) {
        const newParent = await prisma.Category.findUnique({
          where: { id: data.parentId },
        })

        if (!newParent) {
          throw new Error("Parent category not found")
        }

        // Make sure the new parent is not a descendant of this category
        const descendants = await this.getDescendants(id)
        if (descendants.some((desc) => desc.id === data.parentId)) {
          throw new Error("Cannot set a descendant as parent")
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
    return prisma.Category.update({
      where: { id },
      data,
    })
  }

  /**
   * Update category hierarchy (level and path) for a category and all its descendants
   * @param categoryId - Category ID
   * @param newLevel - New level
   * @param newPath - New path
   */
  private async updateCategoryHierarchy(categoryId: string, newLevel: number, newPath: string[]) {
    // Update the category itself
    await prisma.Category.update({
      where: { id: categoryId },
      data: {
        level: newLevel,
        path: newPath,
      },
    })

    // Get direct children
    const children = await prisma.Category.findMany({
      where: { parentId: categoryId },
    })

    // Recursively update all children
    for (const child of children) {
      await this.updateCategoryHierarchy(child.id, newLevel + 1, [...newPath, categoryId])
    }
  }

  /**
   * Get all descendants of a category
   * @param categoryId - Category ID
   * @returns Descendant categories
   */
  async getDescendants(categoryId: string) {
    return prisma.Category.findMany({
      where: {
        path: { has: categoryId },
      },
      orderBy: { level: "asc" },
    })
  }

  /**
   * Delete a category (soft delete)
   * @param id - Category ID
   * @returns Updated category
   */
  async delete(id: string) {
    // Check if category has children
    const childrenCount = await prisma.Category.count({
      where: { parentId: id, isActive: true },
    })

    if (childrenCount > 0) {
      throw new Error("Cannot delete a category with active children")
    }

    // Check if category has products
    const productsCount = await prisma.Product.count({
      where: { category: id, isActive: true },
    })

    if (productsCount > 0) {
      throw new Error("Cannot delete a category with active products")
    }

    // Soft delete the category
    return prisma.Category.update({
      where: { id },
      data: { isActive: false },
    })
  }

  /**
   * Hard delete a category
   * @param id - Category ID
   * @returns Deleted category
   */
  async hardDelete(id: string) {
    // Check if category has children
    const childrenCount = await prisma.Category.count({
      where: { parentId: id },
    })

    if (childrenCount > 0) {
      throw new Error("Cannot delete a category with children")
    }

    // Check if category has products
    const productsCount = await prisma.Product.count({
      where: { category: id },
    })

    if (productsCount > 0) {
      throw new Error("Cannot delete a category with products")
    }

    // Hard delete the category
    return prisma.Category.delete({
      where: { id },
    })
  }

  /**
   * Bulk update categories
   * @param ids - Category IDs
   * @param data - Updates for the categories
   * @returns Number of updated categories
   */
  async bulkUpdate(ids: string[], data: Partial<UpdateCategoryDto>) {
    // Exclude parentId from bulk updates to avoid hierarchy issues
    const { parentId, ...updateData } = data

    const result = await prisma.Category.updateMany({
      where: {
        id: { in: ids },
      },
      data: updateData,
    })

    return result.count
  }

  /**
   * Check if a slug is already in use
   * @param slug - Category slug
   * @param excludeId - Category ID to exclude from check
   * @returns True if slug is available, false otherwise
   */
  async isSlugAvailable(slug: string, excludeId?: string) {
    const where: any = { slug }

    if (excludeId) {
      where.id = { not: excludeId }
    }

    const count = await prisma.Category.count({ where })
    return count === 0
  }
}

