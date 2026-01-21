// API Request/Response types

import type { Post, Asset, ProjectDetails, PostStatus } from "./database";

// Generic API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============ POST API ============

// Create Post Request
export interface CreatePostRequest {
  title: string;
  description?: string;
  projectDetails: ProjectDetails;
  useAiImage: boolean;
  useAiVideo: boolean;
  useAiText: boolean;
  aiPromptOverride?: string;
}

// Update Post Request
export interface UpdatePostRequest {
  title?: string;
  description?: string;
  projectDetails?: ProjectDetails;
  useAiImage?: boolean;
  useAiVideo?: boolean;
  useAiText?: boolean;
  aiPromptOverride?: string;
}

// List Posts Query Params
export interface ListPostsParams extends PaginationParams {
  status?: PostStatus | PostStatus[];
  search?: string;
}

// Post with relations for detail view
export interface PostDetail extends Post {
  assets: Asset[];
}

// Create Post Response
export type CreatePostResponse = ApiResponse<Post>;

// Get Post Response
export type GetPostResponse = ApiResponse<PostDetail>;

// List Posts Response
export type ListPostsResponse = ApiResponse<PaginatedResponse<Post>>;

// ============ ASSET API ============

// Upload Asset Request (multipart form data)
export interface UploadAssetRequest {
  postId: string;
  type: "IMG" | "VID";
  source: "MANUAL";
  order?: number;
}

// ============ WEBHOOK API ============

// n8n Webhook Payload
export interface N8nWebhookPayload {
  postId: string;
  generatedContent: {
    text?: string;
    images?: Array<{
      url: string;
      prompt: string;
    }>;
    videos?: Array<{
      url: string;
      prompt: string;
      duration: number;
    }>;
  };
  status: "success" | "partial" | "failed";
  errors?: Array<{
    type: "text" | "image" | "video";
    message: string;
  }>;
}

// n8n Trigger Payload (sent to n8n)
export interface N8nTriggerPayload {
  postId: string;
  projectDetails: ProjectDetails;
  useAiImage: boolean;
  useAiVideo: boolean;
  useAiText: boolean;
  aiPromptOverride?: string;
  manualAssets?: Array<{
    url: string;
    type: "IMG" | "VID";
  }>;
}

// ============ FACEBOOK API ============

// Facebook Post Payload
export interface FacebookPostPayload {
  message: string;
  mediaUrls?: string[];
  link?: string;
}

// Facebook Post Response
export interface FacebookPostResponse {
  id: string;
  postId: string;
}

// Engagement Data
export interface EngagementData {
  likes: number;
  comments: number;
  shares: number;
  views: number;
}
