"use client";

import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

interface ConfirmModalOptions {
  title: string;
  content: string;
  okText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  danger?: boolean;
}

export function showConfirmModal({
  title,
  content,
  okText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmModalOptions) {
  Modal.confirm({
    title,
    icon: <ExclamationCircleOutlined />,
    content,
    okText,
    cancelText,
    okButtonProps: { danger },
    onOk: onConfirm,
    onCancel,
  });
}

export function showDeleteConfirm(onConfirm: () => void | Promise<void>) {
  showConfirmModal({
    title: "Delete Post",
    content: "Are you sure you want to delete this post? This action cannot be undone.",
    okText: "Delete",
    danger: true,
    onConfirm,
  });
}

export function showPublishConfirm(onConfirm: () => void | Promise<void>) {
  showConfirmModal({
    title: "Publish Post",
    content: "Are you sure you want to publish this post to Facebook?",
    okText: "Publish",
    onConfirm,
  });
}

export function showRegenerateConfirm(onConfirm: () => void | Promise<void>) {
  showConfirmModal({
    title: "Regenerate AI Content",
    content:
      "This will replace existing AI-generated content with new content. Do you want to continue?",
    okText: "Regenerate",
    onConfirm,
  });
}
