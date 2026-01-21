import { prisma } from "./prisma";
import type { Prisma, Post, PostStatus } from "@prisma/client";
import type { ProjectDetails, PaginationParams, PaginatedResponse } from "@/types";

export interface ListPostsOptions extends PaginationParams {
  status?: PostStatus | PostStatus[];
  search?: string;
  includeDeleted?: boolean;
}

export interface CreatePostInput {
  title: string;
  description?: string;
  projectDetails: ProjectDetails;
  useAiImage?: boolean;
  useAiVideo?: boolean;
  useAiText?: boolean;
  aiPromptOverride?: string;
}

export interface UpdatePostInput {
  title?: string;
  description?: string;
  projectDetails?: ProjectDetails;
  useAiImage?: boolean;
  useAiVideo?: boolean;
  useAiText?: boolean;
  aiPromptOverride?: string;
  status?: PostStatus;
}

// Post Service - All database operations for posts
export const postService = {
  // Create a new post
  async create(data: CreatePostInput): Promise<Post> {
    return prisma.post.create({
      data: {
        title: data.title,
        description: data.description,
        projectDetails: data.projectDetails as unknown as Prisma.JsonObject,
        useAiImage: data.useAiImage ?? false,
        useAiVideo: data.useAiVideo ?? false,
        useAiText: data.useAiText ?? false,
        aiPromptOverride: data.aiPromptOverride,
        status: data.useAiImage || data.useAiVideo || data.useAiText ? "PENDING_AI" : "DRAFT",
      },
    });
  },

  // Get a single post by ID
  async getById(
    id: string,
    options?: { includeAssets?: boolean; includePlatformSyncs?: boolean }
  ): Promise<Post | null> {
    return prisma.post.findUnique({
      where: { id },
      include: {
        assets: options?.includeAssets ?? true,
        platformSyncs: options?.includePlatformSyncs ?? true,
        aiGenerationLogs: true,
        publishingQueue: true,
      },
    });
  },

  // List posts with pagination and filtering
  async list(options: ListPostsOptions = {}): Promise<PaginatedResponse<Post>> {
    const { page = 1, limit = 20, sortBy = "createdAt", order = "desc", status, search } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.PostWhereInput = {
      deletedAt: options.includeDeleted ? undefined : null,
    };

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Execute query with count
    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          assets: true,
          platformSyncs: true,
        },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Update a post
  async update(id: string, data: UpdatePostInput): Promise<Post> {
    const updateData: Prisma.PostUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.projectDetails !== undefined)
      updateData.projectDetails = data.projectDetails as unknown as Prisma.JsonObject;
    if (data.useAiImage !== undefined) updateData.useAiImage = data.useAiImage;
    if (data.useAiVideo !== undefined) updateData.useAiVideo = data.useAiVideo;
    if (data.useAiText !== undefined) updateData.useAiText = data.useAiText;
    if (data.aiPromptOverride !== undefined) updateData.aiPromptOverride = data.aiPromptOverride;
    if (data.status !== undefined) updateData.status = data.status;

    return prisma.post.update({
      where: { id },
      data: updateData,
    });
  },

  // Soft delete a post
  async delete(id: string): Promise<Post> {
    return prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  // Hard delete a post (use with caution)
  async hardDelete(id: string): Promise<Post> {
    return prisma.post.delete({
      where: { id },
    });
  },

  // Update post status
  async updateStatus(id: string, status: PostStatus): Promise<Post> {
    return prisma.post.update({
      where: { id },
      data: { status },
    });
  },

  // Get posts by status
  async getByStatus(status: PostStatus): Promise<Post[]> {
    return prisma.post.findMany({
      where: { status, deletedAt: null },
      include: {
        assets: true,
      },
    });
  },

  // Count posts by status
  async countByStatus(): Promise<Record<PostStatus, number>> {
    const counts = await prisma.post.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { status: true },
    });

    const result: Record<PostStatus, number> = {
      DRAFT: 0,
      PENDING_AI: 0,
      READY: 0,
      PUBLISHED: 0,
      FAILED: 0,
    };

    counts.forEach((c) => {
      result[c.status] = c._count.status;
    });

    return result;
  },
};

export default postService;
