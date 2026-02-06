"use client";

import { App } from "antd";
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

// Hook to get context-aware confirm modal functions
export function useConfirmModal() {
  const { modal } = App.useApp();

  const showConfirmModal = ({
    title,
    content,
    okText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    danger = false,
  }: ConfirmModalOptions) => {
    modal.confirm({
      title,
      icon: <ExclamationCircleOutlined />,
      content,
      okText,
      cancelText,
      okButtonProps: { danger },
      onOk: async () => {
        try {
          await onConfirm();
        } catch (error) {
          // Error is already handled in the onConfirm callback
          // Just prevent it from bubbling up to Modal
          console.error("Confirm action error:", error);
        }
      },
      onCancel,
    });
  };

  const showDeleteConfirm = (onConfirm: () => void | Promise<void>) => {
    showConfirmModal({
      title: "Delete Post",
      content: "Are you sure you want to delete this post? This action cannot be undone.",
      okText: "Delete",
      danger: true,
      onConfirm,
    });
  };

  const showPublishConfirm = (onConfirm: () => void | Promise<void>) => {
    showConfirmModal({
      title: "Publish Post",
      content: "Are you sure you want to publish this post to Facebook?",
      okText: "Publish",
      onConfirm,
    });
  };

  const showRegenerateConfirm = (onConfirm: () => void | Promise<void>) => {
    showConfirmModal({
      title: "Regenerate AI Content",
      content:
        "This will replace existing AI-generated content with new content. Do you want to continue?",
      okText: "Regenerate",
      onConfirm,
    });
  };

  return {
    showConfirmModal,
    showDeleteConfirm,
    showPublishConfirm,
    showRegenerateConfirm,
  };
}
