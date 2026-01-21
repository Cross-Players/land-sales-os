// Database types matching Prisma schema
// These types are used across the application

export type PostStatus = "DRAFT" | "PENDING_AI" | "READY" | "PUBLISHED" | "FAILED";

export type AssetType = "IMG" | "VID";

export type AssetSource = "MANUAL" | "AI";

export type ProcessingStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type Platform = "FACEBOOK" | "INSTAGRAM" | "TIKTOK";

export type SyncStatus = "PENDING" | "SYNCING" | "SYNCED" | "FAILED";

export type QueueStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

export type GenerationType = "TEXT" | "IMAGE" | "VIDEO";

export type GenerationStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

// Project Details JSON structure
export interface ProjectDetails {
  name: string;
  price: number;
  location: string;
  features: string[];
}

// Post model
export interface Post {
  id: string;
  title: string;
  description: string | null;
  projectDetails: ProjectDetails;
  status: PostStatus;
  useAiImage: boolean;
  useAiVideo: boolean;
  useAiText: boolean;
  aiPromptOverride: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  assets?: Asset[];
  platformSyncs?: PlatformSync[];
  publishingQueue?: PublishingQueue | null;
  aiGenerationLogs?: AiGenerationLog[];
}

// Asset model
export interface Asset {
  id: string;
  postId: string;
  url: string;
  type: AssetType;
  source: AssetSource;
  order: number;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  processingStatus: ProcessingStatus;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Platform Sync model
export interface PlatformSync {
  id: string;
  postId: string;
  platform: Platform;
  externalId: string | null;
  syncStatus: SyncStatus;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  syncError: string | null;
  retryCount: number;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Publishing Queue model
export interface PublishingQueue {
  id: string;
  postId: string;
  status: QueueStatus;
  scheduledAt: Date;
  processedAt: Date | null;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

// AI Generation Log model
export interface AiGenerationLog {
  id: string;
  postId: string;
  generationType: GenerationType;
  prompt: string | null;
  resultUrl: string | null;
  cost: number | null;
  duration: number | null;
  tokensUsed: number | null;
  status: GenerationStatus;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}
