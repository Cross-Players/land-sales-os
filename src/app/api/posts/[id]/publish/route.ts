import { NextRequest } from "next/server";
import { postService } from "@/lib/db/post.service";
import { apiResponse, apiError, apiNotFound } from "@/lib/utils/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/posts/[id]/publish - Publish a post to Facebook
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get the post
    const post = await postService.getById(id);
    if (!post) {
      return apiNotFound("Post not found");
    }

    // Check if post is ready to publish
    if (post.status === "PENDING_AI") {
      return apiError("Post is still being processed by AI. Please wait.", 400);
    }

    if (post.status !== "READY" && post.status !== "DRAFT") {
      return apiError(`Cannot publish post with status: ${post.status}`, 400);
    }

    // TODO: Implement Facebook publishing
    // 1. Get Facebook page token
    // 2. Upload assets to Facebook
    // 3. Create Facebook post
    // 4. Update platform sync record
    console.log("Publishing post to Facebook:", id);

    // For now, just update status to PUBLISHED
    const updatedPost = await postService.updateStatus(id, "PUBLISHED");

    return apiResponse({
      post: updatedPost,
      message: "Post published successfully",
    });
  } catch (error) {
    console.error("Error publishing post:", error);
    return apiError("Failed to publish post", 500);
  }
}
