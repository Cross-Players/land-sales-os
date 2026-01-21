import { NextRequest } from "next/server";
import { postService } from "@/lib/db/post.service";
import { assetService } from "@/lib/db/asset.service";
import { apiResponse, apiError, apiNotFound } from "@/lib/utils/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/posts/[id]/regenerate - Regenerate AI content for a post
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get the post
    const post = await postService.getById(id);
    if (!post) {
      return apiNotFound("Post not found");
    }

    // Check if post has AI flags enabled
    if (!post.useAiImage && !post.useAiVideo && !post.useAiText) {
      return apiError("Post does not have any AI generation enabled", 400);
    }

    // Check if post is in a state that allows regeneration
    if (post.status === "PENDING_AI") {
      return apiError("AI generation is already in progress", 400);
    }

    // Delete existing AI-generated assets
    await assetService.deleteBySource(id, "AI");

    // Update post status to PENDING_AI
    const updatedPost = await postService.updateStatus(id, "PENDING_AI");

    // TODO: Trigger n8n webhook for regeneration
    // await triggerN8nWorkflow(updatedPost);
    console.log("AI regeneration triggered for post:", id);

    return apiResponse({
      post: updatedPost,
      message: "AI regeneration started",
    });
  } catch (error) {
    console.error("Error regenerating AI content:", error);
    return apiError("Failed to regenerate AI content", 500);
  }
}
