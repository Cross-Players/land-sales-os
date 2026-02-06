import { NextRequest } from "next/server";
import { postService } from "@/lib/db/post.service";
import { n8nService } from "@/lib/services/n8n.service";
import { apiResponse, apiError, apiNotFound } from "@/lib/utils/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/posts/[id]/publish - Trigger n8n workflow to publish a post to Facebook
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get the post with assets
    const post = await postService.getById(id, { includeAssets: true });
    if (!post) {
      return apiNotFound("Post not found");
    }

    // Check if post is ready to publish
    // Allow publishing from DRAFT, READY, or re-triggering from PENDING_AI
    if (post.status === "PUBLISHED") {
      return apiError("Post has already been published", 400);
    }

    console.log("Triggering n8n Facebook auto post for:", { postId: id, status: post.status });

    // Trigger n8n workflow with post and assets
    // n8n will handle AI content generation and Facebook publishing
    const triggered = await n8nService.triggerFacebookAutoPost(post);

    if (!triggered) {
      return apiError(
        "Failed to trigger n8n workflow. Please check N8N_WEBHOOK_URL configuration.",
        500
      );
    }

    // Update post status to PENDING_AI to indicate n8n is processing
    // (The actual status will be updated by the n8n callback webhook)
    await postService.updateStatus(id, "PENDING_AI");

    return apiResponse({
      message: "Publish triggered successfully via n8n",
      post: {
        id: post.id,
        status: "PENDING_AI",
      },
    });
  } catch (error) {
    console.error("Error triggering publish:", error);
    return apiError("Failed to trigger publish", 500);
  }
}
