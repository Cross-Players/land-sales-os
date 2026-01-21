import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for storage operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_MANUAL = process.env.SUPABASE_STORAGE_BUCKET_MANUAL || "manual-uploads";
const BUCKET_AI = process.env.SUPABASE_STORAGE_BUCKET_AI || "ai-generated-content";

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// Storage Service - Handles file uploads to Supabase Storage
export const storageService = {
  // Upload a file to manual uploads bucket
  async uploadManualFile(
    file: File,
    postId: string,
    options?: { folder?: string }
  ): Promise<UploadResult> {
    const folder = options?.folder || postId;
    const fileName = `${Date.now()}-${file.name}`;
    const path = `${folder}/${fileName}`;

    const { error } = await supabase.storage.from(BUCKET_MANUAL).upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
    });

    if (error) {
      console.error("Upload error:", error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_MANUAL).getPublicUrl(path);

    return {
      url: publicUrl,
      path,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
  },

  // Upload AI-generated content
  async uploadAiContent(
    buffer: Buffer | Blob,
    postId: string,
    fileName: string,
    mimeType: string
  ): Promise<UploadResult> {
    const path = `${postId}/${Date.now()}-${fileName}`;

    const { error } = await supabase.storage.from(BUCKET_AI).upload(path, buffer, {
      contentType: mimeType,
      cacheControl: "3600",
    });

    if (error) {
      console.error("Upload error:", error);
      throw new Error(`Failed to upload AI content: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_AI).getPublicUrl(path);

    return {
      url: publicUrl,
      path,
      fileName,
      fileSize: buffer instanceof Blob ? buffer.size : buffer.length,
      mimeType,
    };
  },

  // Delete a file from storage
  async deleteFile(path: string, bucket: "manual" | "ai" = "manual"): Promise<boolean> {
    const bucketName = bucket === "manual" ? BUCKET_MANUAL : BUCKET_AI;

    const { error } = await supabase.storage.from(bucketName).remove([path]);

    if (error) {
      console.error("Delete error:", error);
      return false;
    }

    return true;
  },

  // Delete all files for a post
  async deletePostFiles(postId: string): Promise<void> {
    // Delete from manual bucket
    const { data: manualFiles } = await supabase.storage.from(BUCKET_MANUAL).list(postId);
    if (manualFiles && manualFiles.length > 0) {
      const paths = manualFiles.map((f) => `${postId}/${f.name}`);
      await supabase.storage.from(BUCKET_MANUAL).remove(paths);
    }

    // Delete from AI bucket
    const { data: aiFiles } = await supabase.storage.from(BUCKET_AI).list(postId);
    if (aiFiles && aiFiles.length > 0) {
      const paths = aiFiles.map((f) => `${postId}/${f.name}`);
      await supabase.storage.from(BUCKET_AI).remove(paths);
    }
  },

  // Get public URL for a file
  getPublicUrl(path: string, bucket: "manual" | "ai" = "manual"): string {
    const bucketName = bucket === "manual" ? BUCKET_MANUAL : BUCKET_AI;
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(path);
    return publicUrl;
  },
};

export default storageService;
