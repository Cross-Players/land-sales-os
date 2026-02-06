import { NextRequest } from "next/server";
import { postService } from "@/lib/db/post.service";
import { createPostSchema, listPostsQuerySchema } from "@/lib/validations/post";
import { apiResponse, apiError, parseBody } from "@/lib/utils/api-response";
import { n8nService } from "@/lib/services/n8n.service";
import type { PostStatus } from "@prisma/client";

// GET /api/posts - List all posts with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const queryResult = listPostsQuerySchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      sortBy: searchParams.get("sortBy"),
      order: searchParams.get("order"),
      status: searchParams.getAll("status").length > 0 ? searchParams.getAll("status") : undefined,
      search: searchParams.get("search"),
    });

    if (!queryResult.success) {
      return apiError(queryResult.error.message);
    }

    const { page, limit, sortBy, order, status, search } = queryResult.data;

    const result = await postService.list({
      page,
      limit,
      sortBy,
      order,
      status: status as PostStatus | PostStatus[] | undefined,
      search,
    });

    return apiResponse(result);
  } catch (error) {
    console.error("Error listing posts:", error);
    return apiError("Failed to fetch posts", 500);
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const { data, error } = await parseBody(request, createPostSchema);

    if (error) {
      return apiError(error);
    }

    const post = await postService.create(data!);

    // Debug: Log post creation and AI flags
    console.log("Post created:", {
      id: post.id,
      useAiImage: post.useAiImage,
      useAiVideo: post.useAiVideo,
      useAiText: post.useAiText,
      shouldTriggerN8n: post.useAiImage || post.useAiVideo || post.useAiText,
    });

    // If AI generation is needed, trigger n8n webhook
    if (post.useAiImage || post.useAiVideo || post.useAiText) {
      console.log("Triggering n8n workflow for post:", post.id);
      // Update post status to PENDING_AI
      await postService.updateStatus(post.id, "PENDING_AI");

      // Trigger n8n workflow asynchronously
      n8nService.triggerAiGeneration(post).catch((error) => {
        console.error("Failed to trigger n8n workflow:", error);
        // Optionally update post status to FAILED
        postService.updateStatus(post.id, "FAILED").catch(console.error);
      });
    } else {
      console.log("Skipping n8n trigger - no AI flags enabled");
    }

    return apiResponse(post, 201);
  } catch (error) {
    console.error("Error creating post:", error);
    return apiError("Failed to create post", 500);
  }
}
