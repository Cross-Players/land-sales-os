import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { n8nUpdateSchema } from "@/lib/validations/webhook";
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

// POST /api/webhooks/n8n/update - General n8n update endpoint
// Handles AI content generation results + Facebook publish data in one call
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    if (!verifyApiKey(request)) {
      return apiUnauthorized("Invalid API key");
    }

    // Parse and validate request body
    const { data, error } = await parseBody(request, n8nUpdateSchema);
    if (error) {
      return apiError(error);
    }

    const {
      postId,
      generatedContent,
      facebookData,
      status,
      postStatus,
      description,
      errors,
    } = data!;

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { assets: true, platformSyncs: true },
    });

    if (!post) {
      return apiError("Post not found", 404);
    }

    // Determine current order for new assets
    const currentMaxOrder = post.assets.reduce((max, asset) => Math.max(max, asset.order), 0);
    let assetOrder = currentMaxOrder + 1;

    // Use a transaction for all updates
    await prisma.$transaction(async (tx) => {
      // 1. Create assets for AI generated content
      const assetsToCreate = [];

      // Process generated images
      if (generatedContent?.images) {
        for (const img of generatedContent.images) {
          assetsToCreate.push({
            postId,
            url: img.url,
            type: "IMG" as const,
            source: "AI" as const,
            order: assetOrder++,
            fileName: `ai-generated-image-${assetOrder}.png`,
          });
        }
      }

      // Process generated videos
      if (generatedContent?.videos) {
        for (const vid of generatedContent.videos) {
          assetsToCreate.push({
            postId,
            url: vid.url,
            type: "VID" as const,
            source: "AI" as const,
            order: assetOrder++,
            fileName: `ai-generated-video-${assetOrder}.mp4`,
            duration: vid.duration || undefined,
          });
        }
      }

      // Batch create assets
      if (assetsToCreate.length > 0) {
        await tx.asset.createMany({
          data: assetsToCreate,
        });
      }

      // 2. Update post description if provided
      if (description) {
        await tx.post.update({
          where: { id: postId },
          data: { description },
        });
      }

      // 3. Handle Facebook publish data
      if (facebookData) {
        const syncStatus = facebookData.status === "success" ? "SYNCED" : "FAILED";
        const newPostStatus = postStatus || (facebookData.status === "success" ? "PUBLISHED" : "FAILED");

        // Update post status
        await tx.post.update({
          where: { id: postId },
          data: { status: newPostStatus },
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
            externalId: facebookData.postId,
            externalUrl: facebookData.postUrl,
            syncStatus,
            lastSyncedAt: new Date(),
          },
          update: {
            externalId: facebookData.postId,
            externalUrl: facebookData.postUrl,
            syncStatus,
            lastSyncedAt: new Date(),
            syncError: facebookData.status === "failed" ? "Facebook publishing failed" : null,
          },
        });
      } else if (postStatus) {
        // Update post status if no Facebook data but status is provided
        await tx.post.update({
          where: { id: postId },
          data: { status: postStatus },
        });
      } else if (status === "success") {
        // If no explicit status but generation succeeded, set to READY
        await tx.post.update({
          where: { id: postId },
          data: { status: "READY" },
        });
      } else if (status === "failed") {
        // Generation failed
        await tx.post.update({
          where: { id: postId },
          data: { status: "FAILED" },
        });
      }

      // 4. Log any errors
      if (errors && errors.length > 0) {
        console.error("n8n update errors:", errors);
      }
    });

    console.log(`n8n update processed for post ${postId}:`, {
      status,
      imagesCount: generatedContent?.images?.length || 0,
      videosCount: generatedContent?.videos?.length || 0,
      hasFacebookData: !!facebookData,
    });

    return apiResponse({
      success: true,
      message: "Post updated successfully",
      data: {
        postId,
        status: postStatus || (facebookData?.status === "success" ? "PUBLISHED" : status),
        assetsCreated: (generatedContent?.images?.length || 0) + (generatedContent?.videos?.length || 0),
        facebookPublished: !!facebookData && facebookData.status === "success",
      },
    });
  } catch (error) {
    console.error("Error processing n8n update webhook:", error);
    return apiError("Failed to process update", 500);
  }
}

// GET /api/webhooks/n8n/update - Health check
export async function GET() {
  return apiResponse({
    success: true,
    message: "n8n update webhook is running",
    timestamp: new Date().toISOString(),
  });
}
