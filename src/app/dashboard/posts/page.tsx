"use client";

import { useState } from "react";
import { Table, Card, Button, Space, Input, Select, message } from "antd";
import { PlusOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnsType } from "antd/es/table";
import { usePosts, useDeletePost, usePublishPost } from "@/hooks/usePosts";
import { PostStatusBadge } from "@/components/ui/PostStatusBadge";
import { showDeleteConfirm, showPublishConfirm } from "@/components/ui/ConfirmModal";
import type { Post, PostStatus } from "@/types";

const statusOptions = [
  { label: "All", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Pending AI", value: "PENDING_AI" },
  { label: "Ready", value: "READY" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Failed", value: "FAILED" },
];

export default function PostsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "">("");

  const { data, isLoading, refetch } = usePosts({
    page,
    limit: 10,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const deleteMutation = useDeletePost();
  const publishMutation = usePublishPost();

  const handleDelete = (id: string) => {
    showDeleteConfirm(async () => {
      try {
        await deleteMutation.mutateAsync(id);
        message.success("Post deleted successfully");
      } catch {
        message.error("Failed to delete post");
      }
    });
  };

  const handlePublish = (id: string) => {
    showPublishConfirm(async () => {
      try {
        await publishMutation.mutateAsync(id);
        message.success("Post published successfully");
      } catch {
        message.error("Failed to publish post");
      }
    });
  };

  const columns: ColumnsType<Post> = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Post) => (
        <Link href={`/dashboard/posts/${record.id}`} className="text-blue-600 hover:underline">
          {text}
        </Link>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: PostStatus) => <PostStatusBadge status={status} />,
    },
    {
      title: "AI Features",
      key: "ai",
      width: 150,
      render: (_: unknown, record: Post) => {
        const features = [];
        if (record.useAiText) features.push("Text");
        if (record.useAiImage) features.push("Image");
        if (record.useAiVideo) features.push("Video");
        return features.length > 0 ? features.join(", ") : "-";
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 250,
      render: (_: unknown, record: Post) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => router.push(`/dashboard/posts/${record.id}`)}>
            View
          </Button>
          {["DRAFT", "READY", "FAILED"].includes(record.status) && (
            <Button
              type="link"
              size="small"
              onClick={() => router.push(`/dashboard/posts/${record.id}/edit`)}
            >
              Edit
            </Button>
          )}
          {record.status === "READY" && (
            <Button
              type="link"
              size="small"
              onClick={() => handlePublish(record.id)}
              loading={publishMutation.isPending}
            >
              Publish
            </Button>
          )}
          <Button
            type="link"
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
            loading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Posts"
        extra={
          <Link href="/dashboard/posts/create">
            <Button type="primary" icon={<PlusOutlined />}>
              Create Post
            </Button>
          </Link>
        }
      >
        {/* Filters */}
        <div className="mb-4 flex gap-4 flex-wrap">
          <Input
            placeholder="Search posts..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            options={statusOptions}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: 10,
            total: data?.total || 0,
            onChange: setPage,
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} posts`,
          }}
        />
      </Card>
    </div>
  );
}
