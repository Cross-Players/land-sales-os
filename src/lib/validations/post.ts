import { z } from "zod";

// Project details schema
export const projectDetailsSchema = z.object({
  name: z.string().min(1, "Project name is required").max(200, "Name must be less than 200 chars"),
  price: z.number().min(0, "Price must be positive"),
  location: z.string().min(1, "Location is required").max(500, "Location must be less than 500 chars"),
  features: z.array(z.string()).default([]),
});

// Create post request schema
export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  projectDetails: projectDetailsSchema,
  useAiImage: z.boolean().default(false),
  useAiVideo: z.boolean().default(false),
  useAiText: z.boolean().default(false),
  aiPromptOverride: z.string().max(1000, "Prompt must be less than 1000 characters").optional(),
});

// Update post request schema
export const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  projectDetails: projectDetailsSchema.optional(),
  useAiImage: z.boolean().optional(),
  useAiVideo: z.boolean().optional(),
  useAiText: z.boolean().optional(),
  aiPromptOverride: z.string().max(1000).optional(),
});

// Query params for listing posts
export const listPostsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z
    .enum(["createdAt", "updatedAt", "title", "status"])
    .nullish()
    .transform((val) => val ?? "createdAt"),
  order: z
    .enum(["asc", "desc"])
    .nullish()
    .transform((val) => val ?? "desc"),
  status: z
    .union([
      z.enum(["DRAFT", "PENDING_AI", "READY", "PUBLISHED", "FAILED"]),
      z.array(z.enum(["DRAFT", "PENDING_AI", "READY", "PUBLISHED", "FAILED"])),
    ])
    .nullish()
    .transform((val) => val ?? undefined),
  search: z.string().nullish().transform((val) => val ?? undefined),
});

// Type exports
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
