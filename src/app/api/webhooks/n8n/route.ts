import { NextRequest } from "next/server";
import { postService } from "@/lib/db/post.service";
import { assetService } from "@/lib/db/asset.service";
import { n8nWebhookSchema } from "@/lib/validations/webhook";
import { apiResponse, apiError, apiUnauthorized, parseBody } from "@/lib/utils/api-response";

// Verify API key from n8n
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.N8N_API_KEY;

  // Skip verification if API key is not configured (development)
  if (!expectedKey) {
    console.warn("N8N_API_KEY not configured, skipping verification");
    return true;
  }

  return apiKey === expectedKey;
}

// POST /api/webhooks/n8n - Receive AI-generated content from n8n
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    if (!verifyApiKey(request)) {
      return apiUnauthorized("Invalid API key");
    }

    // Parse and validate request body
    const { data, error } = await parseBody(request, n8nWebhookSchema);
    if (error) {
      return apiError(error);
    }

    const { postId, generatedContent, status, errors } = data!;

    // Get the post
    const post = await postService.getById(postId);
    if (!post) {
      return apiError("Post not found", 404);
    }

    // Check if post is waiting for AI
    if (post.status !== "PENDING_AI") {
      return apiError(`Post is not pending AI generation. Current status: ${post.status}`, 400);
    }

    // Handle failed generation
    if (status === "failed") {
      await postService.updateStatus(postId, "FAILED");
      console.error("AI generation failed for post:", postId, errors);
      return apiResponse({
        message: "AI generation failed",
        errors,
      });
    }

    // Process generated content
    const assetsToCreate = [];

    // Process generated images
    if (generatedContent.images && generatedContent.images.length > 0) {
      for (let i = 0; i < generatedContent.images.length; i++) {
        const img = generatedContent.images[i];
        assetsToCreate.push({
          postId,
          url: img.url,
          type: "IMG" as const,
          source: "AI" as const,
          order: i,
          fileName: `ai-generated-image-${i + 1}.png`,
        });
      }
    }

    // Process generated videos
    if (generatedContent.videos && generatedContent.videos.length > 0) {
      for (let i = 0; i < generatedContent.videos.length; i++) {
        const vid = generatedContent.videos[i];
        assetsToCreate.push({
          postId,
          url: vid.url,
          type: "VID" as const,
          source: "AI" as const,
          order: 100 + i, // Videos after images
          fileName: `ai-generated-video-${i + 1}.mp4`,
          duration: vid.duration,
        });
      }
    }

    // Create assets in database
    if (assetsToCreate.length > 0) {
      await assetService.createMany(assetsToCreate);
    }

    // Update post with generated text (if any)
    if (generatedContent.text) {
      await postService.update(postId, {
        description: generatedContent.text,
      });
    }

    // Update post status based on generation result
    const newStatus = status === "success" ? "READY" : "READY"; // Even partial success is READY
    await postService.updateStatus(postId, newStatus);

    console.log(`AI generation completed for post ${postId}:`, {
      status,
      assetsCreated: assetsToCreate.length,
      hasText: !!generatedContent.text,
    });

    return apiResponse({
      message: "AI content processed successfully",
      assetsCreated: assetsToCreate.length,
    });
  } catch (error) {
    console.error("Error processing n8n webhook:", error);
    return apiError("Failed to process webhook", 500);
  }
}
