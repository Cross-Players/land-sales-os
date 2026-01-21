import { z } from "zod";

// n8n webhook payload schema
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
