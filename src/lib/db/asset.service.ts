import { prisma } from "./prisma";
import type { Asset, AssetType, AssetSource, ProcessingStatus } from "@prisma/client";

export interface CreateAssetInput {
  postId: string;
  url: string;
  type: AssetType;
  source: AssetSource;
  order?: number;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface UpdateAssetInput {
  url?: string;
  order?: number;
  processingStatus?: ProcessingStatus;
  errorMessage?: string;
  width?: number;
  height?: number;
  duration?: number;
}

// Asset Service - All database operations for assets
export const assetService = {
  // Create a new asset
  async create(data: CreateAssetInput): Promise<Asset> {
    return prisma.asset.create({
      data: {
        postId: data.postId,
        url: data.url,
        type: data.type,
        source: data.source,
        order: data.order ?? 0,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        width: data.width,
        height: data.height,
        duration: data.duration,
        processingStatus: "COMPLETED",
      },
    });
  },

  // Create multiple assets
  async createMany(assets: CreateAssetInput[]): Promise<number> {
    const result = await prisma.asset.createMany({
      data: assets.map((a, index) => ({
        postId: a.postId,
        url: a.url,
        type: a.type,
        source: a.source,
        order: a.order ?? index,
        fileName: a.fileName,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
        width: a.width,
        height: a.height,
        duration: a.duration,
        processingStatus: "COMPLETED" as ProcessingStatus,
      })),
    });
    return result.count;
  },

  // Get asset by ID
  async getById(id: string): Promise<Asset | null> {
    return prisma.asset.findUnique({
      where: { id },
    });
  },

  // Get assets by post ID
  async getByPostId(postId: string): Promise<Asset[]> {
    return prisma.asset.findMany({
      where: { postId },
      orderBy: { order: "asc" },
    });
  },

  // Update an asset
  async update(id: string, data: UpdateAssetInput): Promise<Asset> {
    return prisma.asset.update({
      where: { id },
      data,
    });
  },

  // Delete an asset
  async delete(id: string): Promise<Asset> {
    return prisma.asset.delete({
      where: { id },
    });
  },

  // Delete all assets for a post
  async deleteByPostId(postId: string): Promise<number> {
    const result = await prisma.asset.deleteMany({
      where: { postId },
    });
    return result.count;
  },

  // Delete assets by source (useful for regenerating AI assets)
  async deleteBySource(postId: string, source: AssetSource): Promise<number> {
    const result = await prisma.asset.deleteMany({
      where: { postId, source },
    });
    return result.count;
  },

  // Update asset order
  async updateOrder(id: string, order: number): Promise<Asset> {
    return prisma.asset.update({
      where: { id },
      data: { order },
    });
  },

  // Reorder assets
  async reorderAssets(postId: string, assetIds: string[]): Promise<void> {
    const updates = assetIds.map((id, index) =>
      prisma.asset.update({
        where: { id },
        data: { order: index },
      })
    );
    await prisma.$transaction(updates);
  },
};

export default assetService;
