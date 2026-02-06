import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/utils/api-response";
import { storageService } from "@/lib/services/storage.service";
import { assetService } from "@/lib/db/asset.service";

// Note: Image dimension detection would require a library like 'sharp' for server-side processing
// For now, dimensions are optional and can be added later if needed

// POST /api/upload - Handle file uploads
export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return apiError(
        "Supabase storage is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.",
        500
      );
    }

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
      id: string;
      url: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      type: "IMG" | "VID";
    }> = [];

    // Process each file
    for (let index = 0; index < files.length; index++) {
      const file = files[index];

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

      try {
        // Upload to Supabase Storage
        const uploadResult = await storageService.uploadManualFile(file, postId);

        // Save asset record to database
        // Note: Image dimensions (width/height) can be added later using a library like 'sharp'
        const asset = await assetService.create({
          postId,
          url: uploadResult.url,
          type: isImage ? "IMG" : "VID",
          source: "MANUAL",
          order: index,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType,
          // width and height can be added later if needed
        });

        uploadedAssets.push({
          id: asset.id,
          url: asset.url,
          fileName: asset.fileName || file.name,
          fileSize: asset.fileSize || file.size,
          mimeType: asset.mimeType || file.type,
          type: asset.type,
        });

        console.log(`File uploaded successfully: ${file.name} (${file.size} bytes) for post ${postId}`);
      } catch (uploadError) {
        console.error(`Error uploading file ${file.name}:`, uploadError);
        // If one file fails, we still try to upload others, but return an error
        return apiError(
          `Failed to upload file ${file.name}: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}`,
          500
        );
      }
    }

    return apiResponse({
      message: `${uploadedAssets.length} file(s) uploaded successfully`,
      assets: uploadedAssets,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return apiError(
      `Failed to upload files: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  }
}

// Configure body size limit for uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
