import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

// Helper function to create consistent API responses
export function apiResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

// Helper function to create error responses
export function apiError(message: string, status = 400): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

// Helper function to create not found response
export function apiNotFound(message = "Resource not found"): NextResponse<ApiResponse> {
  return apiError(message, 404);
}

// Helper function to create unauthorized response
export function apiUnauthorized(message = "Unauthorized"): NextResponse<ApiResponse> {
  return apiError(message, 401);
}

// Helper function to create validation error response
export function apiValidationError(errors: Record<string, string[]>): NextResponse<ApiResponse> {
  const message = Object.entries(errors)
    .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
    .join("; ");
  return apiError(message, 400);
}

// Parse and validate request body
export async function parseBody<T>(
  request: Request,
  schema: { parse: (data: unknown) => T }
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { data: null, error: error.message };
    }
    return { data: null, error: "Invalid request body" };
  }
}
