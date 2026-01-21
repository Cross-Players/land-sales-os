import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Post, ListPostsParams, PaginatedResponse, CreatePostRequest } from "@/types";

// API functions
async function fetchPosts(params: ListPostsParams = {}): Promise<PaginatedResponse<Post>> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.order) searchParams.set("order", params.order);
  if (params.search) searchParams.set("search", params.search);
  if (params.status) {
    const statuses = Array.isArray(params.status) ? params.status : [params.status];
    statuses.forEach((s) => searchParams.append("status", s));
  }

  const response = await fetch(`/api/posts?${searchParams.toString()}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch posts");
  }

  return result.data;
}

async function fetchPost(id: string): Promise<Post> {
  const response = await fetch(`/api/posts/${id}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch post");
  }

  return result.data;
}

async function createPost(data: CreatePostRequest): Promise<Post> {
  const response = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to create post");
  }

  return result.data;
}

async function updatePost(id: string, data: Partial<CreatePostRequest>): Promise<Post> {
  const response = await fetch(`/api/posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to update post");
  }

  return result.data;
}

async function deletePost(id: string): Promise<void> {
  const response = await fetch(`/api/posts/${id}`, {
    method: "DELETE",
  });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to delete post");
  }
}

async function publishPost(id: string): Promise<Post> {
  const response = await fetch(`/api/posts/${id}/publish`, {
    method: "POST",
  });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to publish post");
  }

  return result.data.post;
}

async function regeneratePost(id: string): Promise<Post> {
  const response = await fetch(`/api/posts/${id}/regenerate`, {
    method: "POST",
  });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to regenerate post");
  }

  return result.data.post;
}

// Hooks
export function usePosts(params: ListPostsParams = {}) {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: () => fetchPosts(params),
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ["posts", id],
    queryFn: () => fetchPost(id),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePostRequest> }) =>
      updatePost(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts", variables.id] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function usePublishPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishPost,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts", id] });
    },
  });
}

export function useRegeneratePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: regeneratePost,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts", id] });
    },
  });
}
