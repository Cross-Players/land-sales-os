import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { n8nFacebookPublishedSchema } from "@/lib/validations/webhook";
import { apiResponse, apiError, apiUnauthorized, apiNotFound, parseBody } from "@/lib/utils/api-response";

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

// POST /api/webhooks/n8n/facebook-published - Receive Facebook publish callback from n8n
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    if (!verifyApiKey(request)) {
      return apiUnauthorized("Invalid API key");
    }

    // Parse and validate request body
    const { data, error } = await parseBody(request, n8nFacebookPublishedSchema);
    if (error) {
      return apiError(error);
    }

    const { postId, post_id: facebookPostId, post_url: facebookPostUrl, status } = data!;

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return apiNotFound("Post not found");
    }

    // Check if post is in an allowed state (only update waiting posts)
    if (post.status !== "PENDING_AI" && post.status !== "READY" && post.status !== "DRAFT") {
      return apiError(`Post is not in a publishable state. Current status: ${post.status}`, 400);
    }

    // Use a transaction to update Post and PlatformSync together
    await prisma.$transaction(async (tx) => {
      // Update post status based on Facebook publish result
      const newStatus = status === "success" ? "PUBLISHED" : "FAILED";
      await tx.post.update({
        where: { id: postId },
        data: { status: newStatus },
      });

      // Upsert PlatformSync for Facebook
      await tx.platformSync.upsert({
        where: {
          postId_platform: {
            postId: postId,
            platform: "FACEBOOK",
          },
        },
        create: {
          postId: postId,
          platform: "FACEBOOK",
          externalId: facebookPostId,
          externalUrl: facebookPostUrl,
          syncStatus: status === "success" ? "SYNCED" : "FAILED",
          lastSyncedAt: new Date(),
        },
        update: {
          externalId: facebookPostId,
          externalUrl: facebookPostUrl,
          syncStatus: status === "success" ? "SYNCED" : "FAILED",
          lastSyncedAt: new Date(),
          syncError: status === "failed" ? "Facebook publishing failed" : null,
        },
      });
    });

    console.log(`Facebook publish callback processed for post ${postId}:`, {
      status,
      facebookPostId,
      facebookPostUrl,
    });

    return apiResponse({
      success: true,
      message: "Post published status updated",
      data: {
        postId,
        status: status === "success" ? "PUBLISHED" : "FAILED",
      },
    });
  } catch (error) {
    console.error("Error processing Facebook published webhook:", error);
    return apiError("Failed to process webhook", 500);
  }
}
