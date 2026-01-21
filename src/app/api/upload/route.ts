import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/utils/api-response";

// POST /api/upload - Handle file uploads
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const postId = formData.get("postId") as string;
    const type = formData.get("type") as "image" | "video";

    if (!files || files.length === 0) {
      return apiError("No files provided", 400);
    }

    if (!postId) {
      return apiError("Post ID is required", 400);
    }

    const uploadedAssets: Array<{
      url: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      type: "IMG" | "VID";
    }> = [];

    for (const file of files) {
      // Validate file type
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (type === "image" && !isImage) {
        return apiError(`File ${file.name} is not an image`, 400);
      }

      if (type === "video" && !isVideo) {
        return apiError(`File ${file.name} is not a video`, 400);
      }

      // Validate file size
      const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024; // 10MB for images, 50MB for videos
      if (file.size > maxSize) {
        return apiError(
          `File ${file.name} is too large. Max size: ${isImage ? "10MB" : "50MB"}`,
          400
        );
      }

      // TODO: Upload to Supabase Storage
      // For now, create a placeholder URL
      // In production, you would:
      // 1. Upload file to Supabase Storage
      // 2. Get the public URL
      // 3. Save asset record to database

      const placeholderUrl = `https://placeholder.com/${postId}/${Date.now()}-${file.name}`;

      uploadedAssets.push({
        url: placeholderUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        type: isImage ? "IMG" : "VID",
      });

      console.log(`File uploaded: ${file.name} (${file.size} bytes) for post ${postId}`);
    }

    return apiResponse({
      message: `${uploadedAssets.length} file(s) uploaded successfully`,
      assets: uploadedAssets,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return apiError("Failed to upload files", 500);
  }
}

// Configure body size limit for uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
