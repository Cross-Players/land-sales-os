"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Checkbox,
  Button,
  Space,
  Divider,
  App,
  Alert,
  Upload,
  Image,
  Radio,
  Spin,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import {
  SaveOutlined,
  SendOutlined,
  RobotOutlined,
  PlusOutlined,
  InboxOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { usePost, useUpdatePost } from "@/hooks/usePosts";
import type { CreatePostRequest, ProjectDetails } from "@/types";

const { TextArea } = Input;
const { Dragger } = Upload;

interface FormValues {
  title: string;
  description?: string;
  projectName: string;
  price: number;
  location: string;
  features: string[];
  useAiText: boolean;
  useAiImage: boolean;
  useAiVideo: boolean;
  aiPromptOverride?: string;
  mediaMode: "manual" | "ai" | "both";
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const { data: post, isLoading, error } = usePost(id);
  const updateMutation = useUpdatePost();

  const [useAiText, setUseAiText] = useState(false);
  const [useAiImage, setUseAiImage] = useState(false);
  const [useAiVideo, setUseAiVideo] = useState(false);
  const [mediaMode, setMediaMode] = useState<"manual" | "ai" | "both">("manual");

  // File lists for uploads
  const [imageFiles, setImageFiles] = useState<UploadFile[]>([]);
  const [videoFiles, setVideoFiles] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  // Load existing post data into form
  useEffect(() => {
    if (post) {
      const projectDetails = post.projectDetails as ProjectDetails;
      const hasAiFeatures = post.useAiImage || post.useAiVideo || post.useAiText;
      const hasAssets = post.assets && post.assets.length > 0;

      // Determine media mode
      let initialMediaMode: "manual" | "ai" | "both" = "manual";
      if (hasAiFeatures && hasAssets) {
        initialMediaMode = "both";
      } else if (hasAiFeatures) {
        initialMediaMode = "ai";
      } else if (hasAssets) {
        initialMediaMode = "manual";
      }

      setMediaMode(initialMediaMode);
      setUseAiText(post.useAiText);
      setUseAiImage(post.useAiImage);
      setUseAiVideo(post.useAiVideo);

      // Load existing assets into file lists
      if (post.assets) {
        const existingImages = post.assets
          .filter((asset) => asset.type === "IMG")
          .map((asset, index) => ({
            uid: asset.id,
            name: asset.fileName || `image-${index + 1}`,
            status: "done" as const,
            url: asset.url,
          }));
        setImageFiles(existingImages);

        const existingVideos = post.assets
          .filter((asset) => asset.type === "VID")
          .map((asset, index) => ({
            uid: asset.id,
            name: asset.fileName || `video-${index + 1}`,
            status: "done" as const,
            url: asset.url,
          }));
        setVideoFiles(existingVideos);
      }

      // Set form values
      form.setFieldsValue({
        title: post.title,
        description: post.description || undefined,
        projectName: projectDetails.name,
        price: projectDetails.price,
        location: projectDetails.location,
        features: projectDetails.features || [],
        useAiText: post.useAiText,
        useAiImage: post.useAiImage,
        useAiVideo: post.useAiVideo,
        aiPromptOverride: post.aiPromptOverride || undefined,
        mediaMode: initialMediaMode,
      });
    }
  }, [post, form]);

  const hasAiFeatures = useAiText || useAiImage || useAiVideo;
  const _hasManualMedia = imageFiles.length > 0 || videoFiles.length > 0;

  // Get base64 for preview
  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  // Image upload props
  const imageUploadProps: UploadProps = {
    name: "images",
    multiple: true,
    fileList: imageFiles,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("You can only upload image files!");
        return Upload.LIST_IGNORE;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error("Image must be smaller than 10MB!");
        return Upload.LIST_IGNORE;
      }
      return false; // Prevent auto upload
    },
    onChange: ({ fileList }) => setImageFiles(fileList),
    onPreview: handlePreview,
    listType: "picture-card",
    accept: "image/*",
  };

  // Video upload props
  const videoUploadProps: UploadProps = {
    name: "videos",
    multiple: true,
    fileList: videoFiles,
    beforeUpload: (file) => {
      const isVideo = file.type.startsWith("video/");
      if (!isVideo) {
        message.error("You can only upload video files!");
        return Upload.LIST_IGNORE;
      }
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        message.error("Video must be smaller than 50MB!");
        return Upload.LIST_IGNORE;
      }
      return false; // Prevent auto upload
    },
    onChange: ({ fileList }) => setVideoFiles(fileList),
    accept: "video/*",
  };

  // Upload files to the server
  const uploadFiles = async (postId: string, files: UploadFile[], type: "image" | "video") => {
    const filesToUpload = files.filter(f => f.originFileObj); // Only new files, not existing ones
    if (filesToUpload.length === 0) return;

    const formData = new FormData();
    formData.append("postId", postId);
    formData.append("type", type);
    
    for (const file of filesToUpload) {
      if (file.originFileObj) {
        formData.append("files", file.originFileObj);
      }
    }

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to upload ${type}s`);
    }

    return response.json();
  };

  const handleSubmit = async (values: FormValues, triggerAi: boolean) => {
    try {
      const projectDetails: ProjectDetails = {
        name: values.projectName,
        price: values.price,
        location: values.location,
        features: values.features || [],
      };

      // Determine AI flags based on media mode
      const shouldUseAiImage = triggerAi && (mediaMode === "ai" || mediaMode === "both") && values.useAiImage;
      const shouldUseAiVideo = triggerAi && (mediaMode === "ai" || mediaMode === "both") && values.useAiVideo;

      const postData: Partial<CreatePostRequest> = {
        title: values.title,
        description: values.description,
        projectDetails,
        useAiText: triggerAi ? values.useAiText : false,
        useAiImage: shouldUseAiImage,
        useAiVideo: shouldUseAiVideo,
        aiPromptOverride: values.aiPromptOverride,
      };

      await updateMutation.mutateAsync({ id, data: postData });

      // Upload new files (files with originFileObj are new uploads)
      const newImages = imageFiles.filter(f => f.originFileObj);
      const newVideos = videoFiles.filter(f => f.originFileObj);
      
      if (newImages.length > 0 || newVideos.length > 0) {
        try {
          if (newImages.length > 0) {
            await uploadFiles(id, newImages, "image");
            console.log(`Uploaded ${newImages.length} new images for post ${id}`);
          }
          
          if (newVideos.length > 0) {
            await uploadFiles(id, newVideos, "video");
            console.log(`Uploaded ${newVideos.length} new videos for post ${id}`);
          }
        } catch (uploadError) {
          console.error("Error uploading files:", uploadError);
          message.warning("Post updated but some files failed to upload");
        }
      }

      if (triggerAi && hasAiFeatures) {
        message.success("Post updated! AI generation started...");
      } else {
        message.success("Post updated successfully");
      }

      router.push(`/dashboard/posts/${id}`);
    } catch {
      message.error("Failed to update post");
    }
  };

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
        description="Failed to load post. It may have been deleted or you don't have permission to edit it."
        type="error"
        showIcon
        action={
          <Button onClick={() => router.push("/dashboard/posts")}>Back to Posts</Button>
        }
      />
    );
  }

  // Check if post can be edited
  const canEdit = ["DRAFT", "READY", "FAILED"].includes(post.status);
  if (!canEdit) {
    return (
      <Alert
        message="Cannot Edit Post"
        description={`Posts with status "${post.status}" cannot be edited. Only DRAFT, READY, or FAILED posts can be edited.`}
        type="warning"
        showIcon
        action={
          <Space>
            <Button onClick={() => router.push(`/dashboard/posts/${id}`)}>View Post</Button>
            <Button onClick={() => router.push("/dashboard/posts")}>Back to Posts</Button>
          </Space>
        }
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(`/dashboard/posts/${id}`)}>
            Back to Post
          </Button>
        </div>

        <Card title="Edit Post">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              useAiText: false,
              useAiImage: false,
              useAiVideo: false,
              features: [],
              mediaMode: "manual",
            }}
          >
            {/* Basic Info */}
            <Divider orientation="left">Post Information</Divider>

            <Form.Item
              name="title"
              label="Post Title"
              rules={[{ required: true, message: "Please enter a title" }]}
            >
              <Input placeholder="Enter post title" maxLength={200} showCount />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea
                placeholder="Enter post description (optional, can be AI generated)"
                rows={4}
                maxLength={2000}
                showCount
              />
            </Form.Item>

            {/* Project Details */}
            <Divider orientation="left">Project Details</Divider>

            <Form.Item
              name="projectName"
              label="Project Name"
              rules={[{ required: true, message: "Please enter project name" }]}
            >
              <Input placeholder="e.g., Luxury Villa in District 2" maxLength={200} />
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="price"
                label="Price (USD)"
                rules={[{ required: true, message: "Please enter price" }]}
              >
                <InputNumber<number>
                  placeholder="Enter price"
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, "") || 0)}
                />
              </Form.Item>

              <Form.Item
                name="location"
                label="Location"
                rules={[{ required: true, message: "Please enter location" }]}
              >
                <Input placeholder="e.g., Ho Chi Minh City, Vietnam" maxLength={500} />
              </Form.Item>
            </div>

            <Form.Item name="features" label="Features">
              <Select
                mode="tags"
                placeholder="Add features (press Enter to add)"
                tokenSeparators={[","]}
                options={[
                  { value: "Swimming Pool", label: "Swimming Pool" },
                  { value: "Garden", label: "Garden" },
                  { value: "Parking", label: "Parking" },
                  { value: "Security", label: "Security" },
                  { value: "Gym", label: "Gym" },
                  { value: "Near School", label: "Near School" },
                  { value: "Near Hospital", label: "Near Hospital" },
                ]}
              />
            </Form.Item>

            {/* Media Section */}
            <Divider orientation="left">
              <Space>
                <PictureOutlined />
                Media Content
              </Space>
            </Divider>

            <Form.Item name="mediaMode" label="Media Mode">
              <Radio.Group
                onChange={(e) => setMediaMode(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="manual">Manual Upload Only</Radio.Button>
                <Radio.Button value="ai">AI Generated Only</Radio.Button>
                <Radio.Button value="both">Both (Upload + AI)</Radio.Button>
              </Radio.Group>
            </Form.Item>

            {/* Manual Upload Section */}
            {(mediaMode === "manual" || mediaMode === "both") && (
              <div className="mb-6">
                <Alert
                  message="Upload Media Files"
                  description={
                    mediaMode === "both"
                      ? "Upload your images/videos. AI will also generate additional content."
                      : "Upload images and videos for your post."
                  }
                  type="info"
                  showIcon
                  className="mb-4"
                />

                {/* Image Upload */}
                <div className="mb-4">
                  <label className="block mb-2 font-medium">
                    <PictureOutlined className="mr-2" />
                    Images (max 10MB each)
                  </label>
                  <Upload {...imageUploadProps}>
                    {imageFiles.length >= 8 ? null : (
                      <div>
                        <PlusOutlined />
                        <div className="mt-2">Upload</div>
                      </div>
                    )}
                  </Upload>
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block mb-2 font-medium">
                    <VideoCameraOutlined className="mr-2" />
                    Videos (max 50MB each)
                  </label>
                  <Dragger {...videoUploadProps} className="mb-4">
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag video files to upload</p>
                    <p className="ant-upload-hint">Support MP4, MOV, AVI. Max 50MB per file.</p>
                  </Dragger>
                </div>
              </div>
            )}

            {/* AI Generation Section */}
            {(mediaMode === "ai" || mediaMode === "both") && (
              <>
                <Divider orientation="left">
                  <Space>
                    <RobotOutlined />
                    AI Generation Options
                  </Space>
                </Divider>

                <Alert
                  message="AI Content Generation"
                  description={
                    mediaMode === "both"
                      ? "AI will generate content in addition to your uploads. Uploaded media can serve as style reference."
                      : "AI will generate all media content based on project details."
                  }
                  type="info"
                  showIcon
                  className="mb-4"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Form.Item name="useAiText" valuePropName="checked" className="mb-0">
                    <Checkbox onChange={(e) => setUseAiText(e.target.checked)}>
                      Generate AI Marketing Copy
                    </Checkbox>
                  </Form.Item>

                  <Form.Item name="useAiImage" valuePropName="checked" className="mb-0">
                    <Checkbox onChange={(e) => setUseAiImage(e.target.checked)}>
                      Generate AI Image
                    </Checkbox>
                  </Form.Item>

                  <Form.Item name="useAiVideo" valuePropName="checked" className="mb-0">
                    <Checkbox onChange={(e) => setUseAiVideo(e.target.checked)}>
                      Generate AI Video
                    </Checkbox>
                  </Form.Item>
                </div>

                {hasAiFeatures && (
                  <Form.Item name="aiPromptOverride" label="Custom AI Instructions (Optional)">
                    <TextArea
                      placeholder="Add custom instructions for AI generation. E.g., 'Focus on the swimming pool' or 'Create a luxury feel'"
                      rows={3}
                      maxLength={1000}
                      showCount
                    />
                  </Form.Item>
                )}

                {useAiVideo && (
                  <Alert
                    message="Video Generation Notice"
                    description="AI video generation may take 5-10 minutes to complete."
                    type="warning"
                    showIcon
                    className="mb-4"
                  />
                )}
              </>
            )}

            {/* Actions */}
            <Divider />

            <Form.Item className="mb-0">
              <Space wrap>
                <Button
                  icon={<SaveOutlined />}
                  onClick={() => form.validateFields().then((values) => handleSubmit(values, false)).catch(() => {})}
                  loading={updateMutation.isPending}
                >
                  Save Changes
                </Button>

                {(mediaMode === "ai" || mediaMode === "both") && hasAiFeatures && (
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => form.validateFields().then((values) => handleSubmit(values, true)).catch(() => {})}
                    loading={updateMutation.isPending}
                  >
                    Save & Regenerate AI
                  </Button>
                )}

                <Button onClick={() => router.push(`/dashboard/posts/${id}`)}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* Image Preview Modal */}
        {previewImage && (
          <Image
            wrapperStyle={{ display: "none" }}
            preview={{
              visible: previewOpen,
              onVisibleChange: (visible) => setPreviewOpen(visible),
              afterOpenChange: (visible) => !visible && setPreviewImage(""),
            }}
            src={previewImage}
            alt="Preview"
          />
        )}
    </div>
  );
}
