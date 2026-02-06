"use client";

import { useState } from "react";
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
  Typography,
  Tag,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import {
  SaveOutlined,
  SendOutlined,
  RobotOutlined,
  PlusOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  DeleteOutlined,
  DragOutlined,
  CloudUploadOutlined,
  FileImageOutlined,
  FileOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useCreatePost } from "@/hooks/usePosts";
import type { CreatePostRequest, ProjectDetails } from "@/types";

const { TextArea } = Input;
const { Dragger } = Upload;
const { Text } = Typography;

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

interface FrameItem {
  id: string;
  type: "video" | "image";
  file?: UploadFile;
  caption: string;
  voice: string;
}

// Professional Upload Card Component
function UploadCard({
  title,
  icon,
  accept,
  maxSize,
  maxCount,
  fileList,
  onChange,
  onPreview,
  listType = "picture-card",
  children,
}: {
  title: string;
  icon: React.ReactNode;
  accept: string;
  maxSize: number;
  maxCount?: number;
  fileList: UploadFile[];
  onChange: (fileList: UploadFile[]) => void;
  onPreview?: (file: UploadFile) => void;
  listType?: "picture-card" | "text" | "picture";
  children?: React.ReactNode;
}) {
  const { message } = App.useApp();
  const [isDragging, setIsDragging] = useState(false);

  const beforeUpload = (file: File) => {
    const isValidType = accept.includes("image")
      ? file.type.startsWith("image/")
      : file.type.startsWith("video/");
    if (!isValidType) {
      message.error(`Please upload a valid ${accept.includes("image") ? "image" : "video"} file`);
      return Upload.LIST_IGNORE;
    }
    const isValidSize = file.size / 1024 / 1024 < maxSize;
    if (!isValidSize) {
      message.error(`${accept === "image/*" ? "Image" : "Video"} must be smaller than ${maxSize}MB`);
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const uploadProps: UploadProps = {
    accept,
    multiple: listType === "picture-card",
    fileList,
    beforeUpload,
    onChange: ({ fileList }) => onChange(fileList),
    onPreview,
    listType,
    maxCount,
  };

  return (
    <Card
      className={`border-2 transition-all duration-200 hover:shadow-md ${
        isDragging
          ? "border-blue-500 bg-blue-50"
          : fileList.length > 0
            ? "border-green-400"
          : "border-dashed border-gray-300 hover:border-blue-400"
      }`}
      styles={{ body: { padding: "16px" } }}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={() => setIsDragging(false)}
    >
      <div className="mb-3">
        <Space className="text-sm font-medium text-gray-700">
          {icon}
          <span>{title}</span>
          <Tag color="blue">Max {formatFileSize(maxSize * 1024 * 1024)}</Tag>
        </Space>
      </div>
      <Upload {...uploadProps}>
        {children || (
          <div className="py-6">
            <p className="mb-2">
              <CloudUploadOutlined className="text-3xl text-gray-400" />
            </p>
            <p className="text-sm text-gray-600">
              Click or drag {accept.includes("image") ? "images" : "videos"} to upload
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {fileList.length} / {maxCount || 8} file{maxCount !== 1 && "s"}
            </p>
          </div>
        )}
      </Upload>
      {fileList.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <Space size="small">
            <CheckCircleOutlined className="text-green-500" />
            <Text type="secondary" className="text-xs">
              {fileList.length} file{fileList.length !== 1 ? "s" : ""} selected • Total:{" "}
              {formatFileSize(fileList.reduce((acc, f) => acc + (f.size || 0), 0))}
            </Text>
          </Space>
        </div>
      )}
    </Card>
  );
}

function CreatePostContent() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const createMutation = useCreatePost();

  const [useAiText, setUseAiText] = useState(false);
  const [useAiImage, setUseAiImage] = useState(false);
  const [useAiVideo, setUseAiVideo] = useState(false);
  const [mediaMode, setMediaMode] = useState<"manual" | "ai" | "both">("manual");

  // File lists for uploads
  const [imageFiles, setImageFiles] = useState<UploadFile[]>([]);
  const [videoFiles, setVideoFiles] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  // Frames for AI video generation
  const [frames, setFrames] = useState<FrameItem[]>([]);

  const hasAiFeatures = useAiText || useAiImage || useAiVideo;
  const hasManualMedia = imageFiles.length > 0 || videoFiles.length > 0;
  const hasFrames = frames.length > 0;

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

  // Frame management
  const addFrame = (type: "video" | "image") => {
    const newFrame: FrameItem = {
      id: `frame-${Date.now()}-${Math.random()}`,
      type,
      caption: "",
      voice: "default",
    };
    setFrames([...frames, newFrame]);
  };

  const removeFrame = (id: string) => {
    setFrames(frames.filter((f) => f.id !== id));
  };

  const updateFrame = (id: string, updates: Partial<FrameItem>) => {
    setFrames(frames.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleFrameFileChange = (frameId: string, file: UploadFile | null) => {
    if (file) {
      updateFrame(frameId, { file });
    }
  };

  // Upload files to the server
  const uploadFiles = async (postId: string, files: UploadFile[], type: "image" | "video") => {
    const filesToUpload = files.filter((f) => f.originFileObj);
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

  // Upload frames as assets with metadata
  const uploadFrames = async (postId: string) => {
    const framesWithFiles = frames.filter((f) => f.file?.originFileObj);

    for (let i = 0; i < framesWithFiles.length; i++) {
      const frame = framesWithFiles[i];
      if (!frame.file?.originFileObj) continue;

      const formData = new FormData();
      formData.append("postId", postId);
      formData.append("type", frame.type === "video" ? "VID" : "IMG");
      formData.append("files", frame.file.originFileObj);
      formData.append("caption", frame.caption);
      formData.append("voice", frame.voice);
      formData.append("order", i.toString());

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to upload frame ${i + 1}: ${error.error}`);
      }
    }

    return framesWithFiles.length;
  };

  const handleSubmit = async (values: FormValues, triggerAi: boolean) => {
    try {
      const projectDetails: ProjectDetails = {
        name: values.projectName,
        price: values.price,
        location: values.location,
        features: values.features || [],
      };

      const shouldUseAiImage = triggerAi && (mediaMode === "ai" || mediaMode === "both") && values.useAiImage;
      const shouldUseAiVideo = triggerAi && (mediaMode === "ai" || mediaMode === "both") && values.useAiVideo;
      const shouldUseAiText = triggerAi ? values.useAiText : false;

      const postData: CreatePostRequest = {
        title: values.title,
        description: values.description,
        projectDetails,
        useAiText: shouldUseAiText,
        useAiImage: shouldUseAiImage,
        useAiVideo: shouldUseAiVideo,
        aiPromptOverride: values.aiPromptOverride,
      };

      const post = await createMutation.mutateAsync(postData);

      const uploadPromises: Promise<void>[] = [];

      if (hasManualMedia) {
        if (imageFiles.length > 0) {
          uploadPromises.push(
            uploadFiles(post.id, imageFiles, "image").then(() => {
              console.log(`Uploaded ${imageFiles.length} images for post ${post.id}`);
            })
          );
        }

        if (videoFiles.length > 0) {
          uploadPromises.push(
            uploadFiles(post.id, videoFiles, "video").then(() => {
              console.log(`Uploaded ${videoFiles.length} videos for post ${post.id}`);
            })
          );
        }
      }

      if (hasFrames) {
        uploadPromises.push(
          uploadFrames(post.id).then((count) => {
            console.log(`Uploaded ${count} frames for AI video generation`);
          })
        );
      }

      const results = await Promise.allSettled(uploadPromises);
      const failedUploads = results.filter((r) => r.status === "rejected");

      if (failedUploads.length > 0) {
        console.error("Some uploads failed:", failedUploads);
        message.warning("Post created but some files failed to upload");
      }

      if (triggerAi && hasAiFeatures) {
        message.success("Post created! AI generation started...");
      } else if (hasManualMedia || hasFrames) {
        message.success("Post created with media");
      } else {
        message.success("Post saved as draft");
      }

      router.push(`/dashboard/posts/${post.id}`);
    } catch {
      message.error("Failed to create post");
    }
  };

  // Frame Upload Card Component
  const FrameUploadCard = ({ frame, index }: { frame: FrameItem; index: number }) => {
    const [isDragging, setIsDragging] = useState(false);

    const uploadProps: UploadProps = {
      accept: frame.type === "video" ? "video/*" : "image/*",
      maxCount: 1,
      fileList: frame.file ? [frame.file] : [],
      beforeUpload: (file) => {
        const isValidType = frame.type === "video"
          ? file.type.startsWith("video/")
          : file.type.startsWith("image/");
        if (!isValidType) {
          message.error(`Please upload a ${frame.type} file`);
          return Upload.LIST_IGNORE;
        }
        const maxSize = frame.type === "video" ? 50 : 10;
        const isValidSize = file.size / 1024 / 1024 < maxSize;
        if (!isValidSize) {
          message.error(`File must be smaller than ${maxSize}MB`);
          return Upload.LIST_IGNORE;
        }
        handleFrameFileChange(frame.id, { ...file, status: "done" } as UploadFile);
        return false;
      },
      onRemove: () => updateFrame(frame.id, { file: undefined }),
      listType: frame.type === "image" ? "picture-card" : "text",
    };

    return (
      <Card
        size="small"
        className={`mb-3 transition-all duration-200 ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200"
        }`}
        styles={{ body: { padding: "12px" } }}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={() => setIsDragging(false)}
      >
        <div className="flex items-start justify-between mb-2">
          <Space>
            <Tag
              icon={frame.type === "video" ? <VideoCameraOutlined /> : <PictureOutlined />}
              color={frame.type === "video" ? "purple" : "blue"}
            >
              Frame {index + 1}
            </Tag>
            {frame.file && (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Uploaded
              </Tag>
            )}
          </Space>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeFrame(frame.id)}
          >
            Remove
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
              }`}
            >
              <Upload {...uploadProps}>
                {frame.file ? null : (
                  <div>
                    <CloudUploadOutlined className="text-2xl text-gray-400 mb-1" />
                    <div className="text-xs text-gray-500">
                      Click or drag to upload {frame.type}
                    </div>
                  </div>
                )}
              </Upload>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Caption</label>
              <Input
                placeholder="e.g., 'Luxury living room with city view'"
                value={frame.caption}
                onChange={(e) => updateFrame(frame.id, { caption: e.target.value })}
                maxLength={200}
                size="small"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Voice</label>
              <Select
                value={frame.voice}
                onChange={(value) => updateFrame(frame.id, { voice: value })}
                options={[
                  { value: "default", label: "Default Voice" },
                  { value: "male", label: "Male Voice" },
                  { value: "female", label: "Female Voice" },
                  { value: "energetic", label: "Energetic" },
                  { value: "calm", label: "Calm & Professional" },
                ]}
                size="small"
              />
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <Card title="Create New Post" className="shadow-sm">
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
          <Divider orientation="left" className="text-base font-medium">
            Post Information
          </Divider>

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
          <Divider orientation="left" className="text-base font-medium">
            Project Details
          </Divider>

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
          <Divider orientation="left" className="text-base font-medium">
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
              className="w-full"
            >
              <Radio.Button value="manual" className="w-1/3 text-center">
                Manual Upload
              </Radio.Button>
              <Radio.Button value="ai" className="w-1/3 text-center">
                AI Generated
              </Radio.Button>
              <Radio.Button value="both" className="w-1/3 text-center">
                Both
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          {/* Manual Upload Section */}
          {(mediaMode === "manual" || mediaMode === "both") && (
            <div className="space-y-4 mb-6">
              <Alert
                message="Upload Media Files"
                description={
                  mediaMode === "both"
                    ? "Upload your images/videos. AI will also generate additional content."
                    : "Upload images and videos for your post."
                }
                type="info"
                showIcon
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image Upload */}
                <UploadCard
                  title="Images"
                  icon={<FileImageOutlined />}
                  accept="image/*"
                  maxSize={10}
                  maxCount={8}
                  fileList={imageFiles}
                  onChange={setImageFiles}
                  onPreview={handlePreview}
                  listType="picture-card"
                >
                  {imageFiles.length >= 8 ? null : (
                    <button
                      type="button"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
                    >
                      <PlusOutlined className="text-2xl text-gray-400 mb-2" />
                      <Text type="secondary">Upload Image</Text>
                    </button>
                  )}
                </UploadCard>

                {/* Video Upload */}
                <UploadCard
                  title="Videos"
                  icon={<FileOutlined />}
                  accept="video/*"
                  maxSize={50}
                  fileList={videoFiles}
                  onChange={setVideoFiles}
                  listType="text"
                >
                  <Dragger
                    accept="video/*"
                    fileList={videoFiles}
                    beforeUpload={(file) => {
                      const isVideo = file.type.startsWith("video/");
                      if (!isVideo) {
                        message.error("Please upload a video file");
                        return Upload.LIST_IGNORE;
                      }
                      const isLt50M = file.size / 1024 / 1024 < 50;
                      if (!isLt50M) {
                        message.error("Video must be smaller than 50MB");
                        return Upload.LIST_IGNORE;
                      }
                      return false;
                    }}
                    onChange={({ fileList }) => setVideoFiles(fileList)}
                    showUploadList={false}
                  >
                    <p className="mb-1">
                      <CloudUploadOutlined className="text-3xl text-gray-400" />
                    </p>
                    <p className="text-sm text-gray-600">Click or drag videos to upload</p>
                    <p className="text-xs text-gray-400">MP4, MOV, AVI • Max 50MB each</p>
                  </Dragger>
                </UploadCard>
              </div>
            </div>
          )}

          {/* AI Generation Section */}
          {(mediaMode === "ai" || mediaMode === "both") && (
            <>
              <Divider orientation="left" className="text-base font-medium">
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

              {/* AI Video Frames Upload */}
              {useAiVideo && (
                <>
                  <Divider orientation="left" className="text-base font-medium">
                    <Space>
                      <VideoCameraOutlined />
                      AI Video Frames
                    </Space>
                  </Divider>

                  <Alert
                    message="Upload Frames for AI Video Generation"
                    description="Add video or image frames that will be used by n8n to generate the AI video. Each frame can have a custom caption and voice setting."
                    type="info"
                    showIcon
                  />

                  <Space className="my-4">
                    <Button
                      icon={<VideoCameraOutlined />}
                      onClick={() => addFrame("video")}
                      className="bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      Add Video Frame
                    </Button>
                    <Button
                      icon={<PictureOutlined />}
                      onClick={() => addFrame("image")}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Add Image Frame
                    </Button>
                  </Space>

                  {frames.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <Space>
                          <DragOutlined />
                          <Text strong>Frames ({frames.length})</Text>
                        </Space>
                        <Text type="secondary" className="text-xs">
                          Frames processed in order
                        </Text>
                      </div>
                      {frames.map((frame, index) => (
                        <FrameUploadCard key={frame.id} frame={frame} index={index} />
                      ))}
                    </div>
                  )}

                  {useAiVideo && !hasFrames && (
                    <Alert
                      message="No Frames Added"
                      description="AI video generation works best with uploaded frames. You can still proceed, but the video will be generated based on project details only."
                      type="warning"
                      showIcon
                      className="mt-4"
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* Actions */}
          <Divider />

          <Form.Item className="mb-0">
            <Space wrap>
              <Button
                icon={<SaveOutlined />}
                onClick={() =>
                  form.validateFields().then((values) => handleSubmit(values, false)).catch(() => {})
                }
                loading={createMutation.isPending}
              >
                Save as Draft
              </Button>

              {(mediaMode === "ai" || mediaMode === "both") && hasAiFeatures && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() =>
                    form.validateFields().then((values) => handleSubmit(values, true)).catch(() => {})
                  }
                  loading={createMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  Save & Generate AI
                </Button>
              )}

              {mediaMode === "manual" && hasManualMedia && (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={() =>
                    form.validateFields().then((values) => handleSubmit(values, false)).catch(() => {})
                  }
                  loading={createMutation.isPending}
                >
                  Save with Media
                </Button>
              )}

              <Button onClick={() => router.back()}>Cancel</Button>
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

export default function CreatePostPage() {
  return <CreatePostContent />;
}
