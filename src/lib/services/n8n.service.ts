import type { ProjectDetails, Asset } from "@/types";
import type { Post as PrismaPost, Asset as PrismaAsset } from "@prisma/client";

// Frame types for AI video generation in n8n
export interface VideoFrame {
  copy: "Video-Frame";
  "V-Caption": string;
  "V-Voice": string;
  "V-Src": string;
}

export interface ImageFrame {
  copy: "Image-Frame";
  "I-Caption": string;
  "I-Voice": string;
  "I-Src": string;
}

export type FrameItem = VideoFrame | ImageFrame;

// n8n Service - Handles communication with n8n workflows
export const n8nService = {
  /**
   * Get the n8n webhook URL from environment or use default
   */
  getWebhookUrl(): string {
    return (
      process.env.N8N_WEBHOOK_URL ||
      "https://primary-production-64e7.up.railway.app/webhook-test/facebook-auto-post"
    );
  },

  /**
   * Build frames array from post assets for n8n AI video generation
   * Maps uploaded media (Supabase URLs) into frames format expected by n8n
   */
  buildFramesFromAssets(
    assets: Array<PrismaAsset | Asset>,
    projectDetails: ProjectDetails
  ): FrameItem[] {
    const frames: FrameItem[] = [];

    // Sort assets by order, then by type (images first, then videos)
    const sortedAssets = [...assets].sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      // Images (IMG) come before videos (VID)
      return a.type === "IMG" ? -1 : 1;
    });

    // Default caption/voice from project details
    const defaultCaption = `${projectDetails.name} - ${projectDetails.location}`;
    const defaultVoice = "default";

    for (const asset of sortedAssets) {
      if (asset.type === "VID") {
        frames.push({
          copy: "Video-Frame",
          "V-Caption": defaultCaption,
          "V-Voice": defaultVoice,
          "V-Src": asset.url,
        } as VideoFrame);
      } else if (asset.type === "IMG") {
        frames.push({
          copy: "Image-Frame",
          "I-Caption": defaultCaption,
          "I-Voice": defaultVoice,
          "I-Src": asset.url,
        } as ImageFrame);
      }
    }

    return frames;
  },

  /**
   * Trigger Facebook auto post workflow in n8n
   * Sends post data with frames (media URLs) for AI generation and Facebook publishing
   */
  async triggerFacebookAutoPost(
    post: PrismaPost & { assets?: PrismaAsset[] },
    options?: { manualAssetUrls?: string[] }
  ): Promise<boolean> {
    const webhookUrl = this.getWebhookUrl();
    const apiKey = process.env.N8N_API_KEY;

    console.log("n8nService.triggerFacebookAutoPost called:", {
      postId: post.id,
      webhookUrl,
      hasApiKey: !!apiKey,
      useAiImage: post.useAiImage,
      useAiVideo: post.useAiVideo,
      useAiText: post.useAiText,
      assetsCount: post.assets?.length || 0,
    });

    if (!webhookUrl) {
      console.warn("N8N_WEBHOOK_URL not configured, skipping n8n trigger");
      return false;
    }

    // Cast projectDetails from JsonValue to ProjectDetails
    // Safe because we validate the structure when creating posts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectDetails = post.projectDetails as any as ProjectDetails;

    // Build frames from post assets or manual asset URLs
    let frames: FrameItem[] = [];

    if (post.assets && post.assets.length > 0) {
      frames = this.buildFramesFromAssets(post.assets, projectDetails);
    } else if (options?.manualAssetUrls && options.manualAssetUrls.length > 0) {
      // Build frames directly from manual URLs
      const defaultCaption = `${projectDetails.name} - ${projectDetails.location}`;
      const defaultVoice = "default";

      frames = options.manualAssetUrls.map((url) => {
        const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i) !== null;
        if (isVideo) {
          return {
            copy: "Video-Frame",
            "V-Caption": defaultCaption,
            "V-Voice": defaultVoice,
            "V-Src": url,
          } as VideoFrame;
        } else {
          return {
            copy: "Image-Frame",
            "I-Caption": defaultCaption,
            "I-Voice": defaultVoice,
            "I-Src": url,
          } as ImageFrame;
        }
      });
    }

    // Build payload with frames
    const payload = {
      postId: post.id,
      projectDetails,
      useAiImage: post.useAiImage,
      useAiVideo: post.useAiVideo,
      useAiText: post.useAiText,
      aiPromptOverride: post.aiPromptOverride || undefined,
      frames,
    };

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (apiKey) {
        headers["X-API-Key"] = apiKey;
        console.log("Sending API key in header:", {
          headerName: "X-API-Key",
          keyLength: apiKey.length,
          keyPrefix: apiKey.substring(0, 8) + "...",
        });
      } else {
        console.warn("No API key configured - request may fail authentication");
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("n8n webhook failed:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          webhookUrl,
          hasApiKey: !!apiKey,
        });
        return false;
      }

      console.log("n8n Facebook auto post triggered for post:", post.id);
      return true;
    } catch (error) {
      console.error("Error triggering n8n workflow:", error);
      return false;
    }
  },

  /**
   * @deprecated Use triggerFacebookAutoPost instead
   * This method is kept for backward compatibility
   */
  async triggerAiGeneration(post: PrismaPost, manualAssetUrls?: string[]): Promise<boolean> {
    console.warn("triggerAiGeneration is deprecated, use triggerFacebookAutoPost instead");
    return this.triggerFacebookAutoPost(post, { manualAssetUrls });
  },

  /**
   * Check workflow status (if n8n supports it)
   * Currently not implemented - we rely on webhook callbacks
   */
  async checkWorkflowStatus(executionId: string): Promise<string | null> {
    console.log("Checking workflow status:", executionId);
    return null;
  },
};

export default n8nService;
