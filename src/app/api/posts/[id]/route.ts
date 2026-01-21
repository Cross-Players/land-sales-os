import { NextRequest } from "next/server";
import { postService } from "@/lib/db/post.service";
import { updatePostSchema } from "@/lib/validations/post";
import { apiResponse, apiError, apiNotFound, parseBody } from "@/lib/utils/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/posts/[id] - Get a single post by ID
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const post = await postService.getById(id);

    if (!post) {
      return apiNotFound("Post not found");
    }

    return apiResponse(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return apiError("Failed to fetch post", 500);
  }
}

// PUT /api/posts/[id] - Update a post
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if post exists
    const existingPost = await postService.getById(id);
    if (!existingPost) {
      return apiNotFound("Post not found");
    }

    // Can only edit DRAFT or READY posts
    if (!["DRAFT", "READY", "FAILED"].includes(existingPost.status)) {
      return apiError(`Cannot edit post with status: ${existingPost.status}`, 400);
    }

    const { data, error } = await parseBody(request, updatePostSchema);
    if (error) {
      return apiError(error);
    }

    const post = await postService.update(id, data!);
    return apiResponse(post);
  } catch (error) {
    console.error("Error updating post:", error);
    return apiError("Failed to update post", 500);
  }
}

// DELETE /api/posts/[id] - Soft delete a post
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if post exists
    const existingPost = await postService.getById(id);
    if (!existingPost) {
      return apiNotFound("Post not found");
    }

    await postService.delete(id);
    return apiResponse({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return apiError("Failed to delete post", 500);
  }
}
