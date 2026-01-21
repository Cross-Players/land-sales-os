import type { Post, ProjectDetails, N8nTriggerPayload } from "@/types";

// n8n Service - Handles communication with n8n workflows
export const n8nService = {
  // Trigger AI generation workflow
  async triggerAiGeneration(post: Post, manualAssetUrls?: string[]): Promise<boolean> {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    const apiKey = process.env.N8N_API_KEY;

    if (!webhookUrl) {
      console.warn("N8N_WEBHOOK_URL not configured, skipping AI generation");
      return false;
    }

    const projectDetails = post.projectDetails as ProjectDetails;

    const payload: N8nTriggerPayload = {
      postId: post.id,
      projectDetails,
      useAiImage: post.useAiImage,
      useAiVideo: post.useAiVideo,
      useAiText: post.useAiText,
      aiPromptOverride: post.aiPromptOverride || undefined,
      manualAssets: manualAssetUrls?.map((url) => ({
        url,
        type: url.match(/\.(mp4|mov|avi|webm)$/i) ? ("VID" as const) : ("IMG" as const),
      })),
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey && { "X-API-Key": apiKey }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("n8n webhook failed:", response.status, await response.text());
        return false;
      }

      console.log("n8n workflow triggered for post:", post.id);
      return true;
    } catch (error) {
      console.error("Error triggering n8n workflow:", error);
      return false;
    }
  },

  // Check workflow status (if n8n supports it)
  async checkWorkflowStatus(executionId: string): Promise<string | null> {
    // This would require n8n API access
    // For now, we rely on the webhook callback
    console.log("Checking workflow status:", executionId);
    return null;
  },
};

export default n8nService;
