import { NextRequest } from "next/server";
import { postService } from "@/lib/db/post.service";
import { createPostSchema, listPostsQuerySchema } from "@/lib/validations/post";
import { apiResponse, apiError, parseBody } from "@/lib/utils/api-response";
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

    // If AI generation is needed, trigger n8n webhook
    if (post.useAiImage || post.useAiVideo || post.useAiText) {
      // TODO: Trigger n8n webhook
      // await triggerN8nWorkflow(post);
      console.log("AI generation requested, should trigger n8n for post:", post.id);
    }

    return apiResponse(post, 201);
  } catch (error) {
    console.error("Error creating post:", error);
    return apiError("Failed to create post", 500);
  }
}
