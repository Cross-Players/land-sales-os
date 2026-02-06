"use client";

import { Card, Col, Row, Statistic, Table, Tag, Button, Space } from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import type { ColumnsType } from "antd/es/table";
import { useQuery } from "@tanstack/react-query";
import { PostStatus } from "@/types/database";

interface PostSummary {
  id: string;
  title: string;
  status: PostStatus;
  createdAt: string;
}

// Status color mapping
const statusColors: Record<PostStatus, string> = {
  DRAFT: "default",
  PENDING_AI: "processing",
  READY: "success",
  PUBLISHED: "blue",
  FAILED: "error",
};

const columns: ColumnsType<PostSummary> = [
  {
    title: "Title",
    dataIndex: "title",
    key: "title",
    render: (text: string, record: PostSummary) => (
      <Link href={`/dashboard/posts/${record.id}`}>{text}</Link>
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: PostStatus) => (
      <Tag color={statusColors[status]}>{status.replace("_", " ")}</Tag>
    ),
  },
  {
    title: "Created",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (date: string) => new Date(date).toLocaleDateString(),
  },
  {
    title: "Actions",
    key: "actions",
    render: (_: unknown, record: PostSummary) => (
      <Space>
        <Link href={`/dashboard/posts/${record.id}`}>
          <Button type="link" size="small">
            View
          </Button>
        </Link>
        <Link href={`/dashboard/posts/${record.id}/edit`}>
          <Button type="link" size="small">
            Edit
          </Button>
        </Link>
      </Space>
    ),
  },
];

// Mock data for initial display (unused, kept for reference)
const _mockPosts: PostSummary[] = [
  {
    id: "1",
    title: "Luxury Villa in District 2",
    status: "PUBLISHED",
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    title: "Modern Apartment Complex",
    status: "READY",
    createdAt: "2024-01-14T09:00:00Z",
  },
  {
    id: "3",
    title: "Beachfront Property",
    status: "PENDING_AI",
    createdAt: "2024-01-13T08:00:00Z",
  },
  {
    id: "4",
    title: "Commercial Land Plot",
    status: "DRAFT",
    createdAt: "2024-01-12T07:00:00Z",
  },
];

export default function DashboardPage() {
  // Fetch posts data
  const { data: postsData, isLoading } = useQuery<{ items: PostSummary[]; total: number }>({
    queryKey: ["posts", "recent"],
    queryFn: async () => {
      const response = await fetch('/api/posts?limit=100');
      const data = await response.json();
      return data;
    },
  });

  const posts = postsData?.items || [];

  // Calculate stats
  const totalPosts = postsData?.total || 0;
  const publishedPosts = posts.filter((p) => p.status === "PUBLISHED").length;
  const pendingPosts = posts.filter((p) => p.status === "PENDING_AI").length;
  const draftPosts = posts.filter((p) => p.status === "DRAFT").length;

  return (
    <div>
      {/* Stats Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Posts"
              value={totalPosts}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Published"
              value={publishedPosts}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending AI"
              value={pendingPosts}
              prefix={<RobotOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Drafts"
              value={draftPosts}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#8c8c8c" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Posts Table */}
      <Card
        title="Recent Posts"
        extra={
          <Link href="/dashboard/posts/create">
            <Button type="primary" icon={<PlusOutlined />}>
              Create Post
            </Button>
          </Link>
        }
      >
        <Table
          columns={columns}
          dataSource={posts}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
}
