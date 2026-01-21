"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Descriptions,
  Button,
  Space,
  Spin,
  Alert,
  Divider,
  Image,
  message,
  Tag,
  Empty,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { usePost, useDeletePost, usePublishPost, useRegeneratePost } from "@/hooks/usePosts";
import { PostStatusBadge } from "@/components/ui/PostStatusBadge";
import {
  showDeleteConfirm,
  showPublishConfirm,
  showRegenerateConfirm,
} from "@/components/ui/ConfirmModal";
import type { ProjectDetails } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PostDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: post, isLoading, error, refetch } = usePost(id);
  const deleteMutation = useDeletePost();
  const publishMutation = usePublishPost();
  const regenerateMutation = useRegeneratePost();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <Alert
        message="Error"
        description="Failed to load post details"
        type="error"
        showIcon
        action={
          <Button onClick={() => router.push("/dashboard/posts")}>Back to Posts</Button>
        }
      />
    );
  }

  const projectDetails = post.projectDetails as ProjectDetails;
  const canEdit = ["DRAFT", "READY", "FAILED"].includes(post.status);
  const canPublish = post.status === "READY";
  const canRegenerate =
    post.status !== "PENDING_AI" && (post.useAiImage || post.useAiVideo || post.useAiText);

  const handleDelete = () => {
    showDeleteConfirm(async () => {
      try {
        await deleteMutation.mutateAsync(id);
        message.success("Post deleted successfully");
        router.push("/dashboard/posts");
      } catch {
        message.error("Failed to delete post");
      }
    });
  };

  const handlePublish = () => {
    showPublishConfirm(async () => {
      try {
        await publishMutation.mutateAsync(id);
        message.success("Post published successfully");
        refetch();
      } catch {
        message.error("Failed to publish post");
      }
    });
  };

  const handleRegenerate = () => {
    showRegenerateConfirm(async () => {
      try {
        await regenerateMutation.mutateAsync(id);
        message.success("AI regeneration started");
        refetch();
      } catch {
        message.error("Failed to regenerate AI content");
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex justify-between items-center">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/dashboard/posts")}>
          Back to Posts
        </Button>
        <Space>
          {canEdit && (
            <Button
              icon={<EditOutlined />}
              onClick={() => router.push(`/dashboard/posts/${id}/edit`)}
            >
              Edit
            </Button>
          )}
          {canRegenerate && (
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRegenerate}
              loading={regenerateMutation.isPending}
            >
              Regenerate AI
            </Button>
          )}
          {canPublish && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handlePublish}
              loading={publishMutation.isPending}
            >
              Publish to Facebook
            </Button>
          )}
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            loading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </Space>
      </div>

      {/* Status Alert */}
      {post.status === "PENDING_AI" && (
        <Alert
          message="AI Generation in Progress"
          description="Your content is being generated. This page will update automatically when complete."
          type="info"
          showIcon
          className="mb-4"
          action={<Button onClick={() => refetch()}>Refresh</Button>}
        />
      )}

      {post.status === "FAILED" && (
        <Alert
          message="Generation Failed"
          description="AI content generation failed. You can try regenerating or edit the post manually."
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      {/* Post Details */}
      <Card title={post.title} extra={<PostStatusBadge status={post.status} />}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Description">
            {post.description || <span className="text-gray-400">No description</span>}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {new Date(post.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Last Updated">
            {new Date(post.updatedAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">Project Details</Divider>

        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Project Name">{projectDetails.name}</Descriptions.Item>
          <Descriptions.Item label="Price">
            ${projectDetails.price?.toLocaleString() || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Location" span={2}>
            {projectDetails.location}
          </Descriptions.Item>
          <Descriptions.Item label="Features" span={2}>
            {projectDetails.features?.length > 0 ? (
              <Space wrap>
                {projectDetails.features.map((f, i) => (
                  <Tag key={i}>{f}</Tag>
                ))}
              </Space>
            ) : (
              <span className="text-gray-400">No features</span>
            )}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">AI Configuration</Divider>

        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="AI Text">
            <Tag color={post.useAiText ? "green" : "default"}>
              {post.useAiText ? "Enabled" : "Disabled"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="AI Image">
            <Tag color={post.useAiImage ? "green" : "default"}>
              {post.useAiImage ? "Enabled" : "Disabled"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="AI Video">
            <Tag color={post.useAiVideo ? "green" : "default"}>
              {post.useAiVideo ? "Enabled" : "Disabled"}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        {post.aiPromptOverride && (
          <>
            <Divider orientation="left">Custom AI Prompt</Divider>
            <p className="bg-gray-50 p-4 rounded">{post.aiPromptOverride}</p>
          </>
        )}

        {/* Assets */}
        <Divider orientation="left">Assets</Divider>

        {post.assets && post.assets.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {post.assets.map((asset) => (
              <Card key={asset.id} size="small" className="text-center">
                {asset.type === "IMG" ? (
                  <Image
                    src={asset.url}
                    alt={asset.fileName || "Asset"}
                    className="max-h-40 object-cover"
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                  />
                ) : (
                  <video src={asset.url} controls className="max-h-40 w-full" />
                )}
                <div className="mt-2">
                  <Tag color={asset.source === "AI" ? "purple" : "blue"}>{asset.source}</Tag>
                  <Tag>{asset.type}</Tag>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Empty description="No assets yet" />
        )}
      </Card>
    </div>
  );
}
