"use client";

import { Tag } from "antd";
import {
  EditOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  SendOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { PostStatus } from "@/types";

interface PostStatusBadgeProps {
  status: PostStatus;
}

const statusConfig: Record<
  PostStatus,
  { color: string; icon: React.ReactNode; label: string }
> = {
  DRAFT: {
    color: "default",
    icon: <EditOutlined />,
    label: "Draft",
  },
  PENDING_AI: {
    color: "processing",
    icon: <RobotOutlined />,
    label: "Pending AI",
  },
  READY: {
    color: "success",
    icon: <CheckCircleOutlined />,
    label: "Ready",
  },
  PUBLISHED: {
    color: "blue",
    icon: <SendOutlined />,
    label: "Published",
  },
  FAILED: {
    color: "error",
    icon: <CloseCircleOutlined />,
    label: "Failed",
  },
};

export function PostStatusBadge({ status }: PostStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Tag color={config.color} icon={config.icon}>
      {config.label}
    </Tag>
  );
}

export default PostStatusBadge;
