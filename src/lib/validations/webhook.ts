import { z } from "zod";

// n8n AI content webhook payload schema
export const n8nWebhookSchema = z.object({
  postId: z.string().uuid("Invalid post ID"),
  generatedContent: z.object({
    text: z.string().optional(),
    images: z
      .array(
        z.object({
          url: z.string().url("Invalid image URL"),
          prompt: z.string(),
        })
      )
      .optional(),
    videos: z
      .array(
        z.object({
          url: z.string().url("Invalid video URL"),
          prompt: z.string(),
          duration: z.number().min(0),
        })
      )
      .optional(),
  }),
  status: z.enum(["success", "partial", "failed"]),
  errors: z
    .array(
      z.object({
        type: z.enum(["text", "image", "video"]),
        message: z.string(),
      })
    )
    .optional(),
});

export type N8nWebhookInput = z.infer<typeof n8nWebhookSchema>;

// n8n Facebook published callback webhook schema
export const n8nFacebookPublishedSchema = z.object({
  postId: z.string().uuid("Invalid post ID"),
  post_id: z.string().min(1, "Facebook post ID is required"),
  post_url: z.string().url("Invalid post URL"),
  status: z.enum(["success", "failed"], { required_error: "Status is required" }),
});

export type N8nFacebookPublishedInput = z.infer<typeof n8nFacebookPublishedSchema>;

// Comprehensive n8n update schema - handles AI content + Facebook publish in one call
export const n8nUpdateSchema = z.object({
  postId: z.string().uuid("Invalid post ID"),

  // AI generated content
  generatedContent: z.object({
    text: z.string().optional(),
    images: z.array(z.object({
      url: z.string().url("Invalid image URL"),
      prompt: z.string().optional(),
    })).optional(),
    videos: z.array(z.object({
      url: z.string().url("Invalid video URL"),
      prompt: z.string().optional(),
      duration: z.number().min(0).optional(),
      thumbnail: z.string().url("Invalid thumbnail URL").optional(),
    })).optional(),
  }).optional(),

  // Facebook publish data
  facebookData: z.object({
    postId: z.string().min(1, "Facebook post ID is required"),
    postUrl: z.string().url("Invalid Facebook post URL"),
    status: z.enum(["success", "failed"]),
  }).optional(),

  // Overall status
  status: z.enum(["success", "partial", "failed"]),

  // Post status override
  postStatus: z.enum(["DRAFT", "PENDING_AI", "READY", "PUBLISHED", "FAILED"]).optional(),

  // Description update
  description: z.string().optional(),

  // Errors
  errors: z.array(z.object({
    type: z.enum(["text", "image", "video", "facebook"]),
    message: z.string(),
  })).optional(),
});

export type N8nUpdateInput = z.infer<typeof n8nUpdateSchema>;

// Asset creation schema
export const assetSchema = z.object({
  postId: z.string().uuid("Invalid post ID"),
  url: z.string().url("Invalid asset URL"),
  type: z.enum(["IMG", "VID"]),
  source: z.enum(["MANUAL", "AI"]),
  order: z.number().int().min(0).optional(),
  fileName: z.string().optional(),
  fileSize: z.number().int().min(0).optional(),
  mimeType: z.string().optional(),
  width: z.number().int().min(0).optional(),
  height: z.number().int().min(0).optional(),
  duration: z.number().int().min(0).optional(),
});

export type AssetInput = z.infer<typeof assetSchema>;
