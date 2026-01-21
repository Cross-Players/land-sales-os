# Phase 3: AI Automation Workflow (n8n)

### 🤖 n8n Workflow Design

#### Workflow Trigger
- [ ] **Webhook Trigger Node**: 
  - Method: POST
  - Authentication: Header-based API key
  - Path: `/generate-content`
  - Accept JSON payload

#### Input Schema (from NextJS API)
```typescript
{
  postId: string;
  projectDetails: {
    name: string;
    price: number;
    location: string;
    features: string[];
  };
  useAiImage: boolean;
  useAiVideo: boolean;
  useAiText: boolean;
  aiPromptOverride?: string;
  manualAssets?: Array<{
    url: string;
    type: 'IMG' | 'VID';
  }>;
}
```

#### Workflow Nodes

**1. Switch Node - Route by AI Flags**
- [ ] Check `use_ai_image`, `use_ai_video`, `use_ai_text` flags
- [ ] Route to appropriate AI generation nodes
- [ ] Handle all combinations (image only, video only, text only, all, none)

**2. Gemini Node - Text Generation**
- [ ] Trigger when `use_ai_text` is true
- [ ] Build prompt from project details:
  ```
  Generate engaging real estate marketing copy for:
  - Project: {name}
  - Price: ${price}
  - Location: {location}
  - Features: {features.join(', ')}
  
  {aiPromptOverride ? `Additional instructions: ${aiPromptOverride}` : ''}
  
  Style: Professional, compelling, highlight key selling points.
  Length: 2-3 paragraphs, suitable for social media.
  ```
- [ ] Configure Gemini API:
  - Model: `gemini-pro` or `gemini-1.5-pro`
  - Temperature: 0.7
  - Max tokens: 500
- [ ] Store generated text in workflow data

**3. Gemini Vision/Image Generation Node**
- [ ] Trigger when `use_ai_image` is true
- [ ] Build image generation prompt:
  ```
  Generate a high-quality real estate marketing image for:
  - Project: {name}
  - Location: {location}
  - Features: {features.join(', ')}
  
  {aiPromptOverride ? `Style: ${aiPromptOverride}` : 'Style: Modern, professional, appealing'}
  
  Requirements:
  - Landscape orientation (16:9)
  - High resolution (1920x1080 minimum)
  - Professional real estate photography style
  ```
- [ ] Use Gemini image generation or integrate with image generation API
- [ ] Download generated image
- [ ] Upload to Supabase Storage bucket `ai-generated-content`
- [ ] Store URL in workflow data

**4. Veo3 Node - Video Generation**
- [ ] Trigger when `use_ai_video` is true
- [ ] Build video generation prompt:
  ```
  Create a 5-10 second real estate highlight video for:
  - Project: {name}
  - Location: {location}
  - Key Features: {features.slice(0, 3).join(', ')}
  
  {aiPromptOverride ? `Style: ${aiPromptOverride}` : 'Style: Dynamic, modern, showcasing property'}
  
  Requirements:
  - Duration: 5-10 seconds
  - Resolution: 1080p
  - Aspect ratio: 16:9 (landscape) or 9:16 (vertical for TikTok)
  - Smooth transitions, professional quality
  ```
- [ ] Configure Veo3 API:
  - Model: `veo-3` (or available video generation model)
  - Duration: 5-10 seconds
  - Resolution: 1080p
- [ ] **Handle Long Processing Time**:
  - Veo3 can take 5-10 minutes
  - Use async job pattern or polling
  - Store job ID and poll for completion
- [ ] Download generated video
- [ ] Upload to Supabase Storage bucket `ai-generated-content`
- [ ] Store URL and metadata (duration, file size) in workflow data

**5. Data Transformation Node**
- [ ] Combine all generated content:
  - Manual assets (if any)
  - AI-generated text
  - AI-generated images
  - AI-generated videos
- [ ] Format for NextJS API callback:
  ```typescript
  {
    postId: string;
    generatedContent: {
      text?: string;
      images?: Array<{
        url: string;
        prompt: string;
      }>;
      videos?: Array<{
        url: string;
        prompt: string;
        duration: number;
      }>;
    };
    status: 'success' | 'partial' | 'failed';
    errors?: Array<{
      type: 'text' | 'image' | 'video';
      message: string;
    }>;
  }
  ```
- [ ] Handle partial failures (e.g., text succeeded but video failed)

**6. HTTP Request Node - Callback to NextJS**
- [ ] POST to `{NEXT_PUBLIC_APP_URL}/api/webhooks/n8n`
- [ ] Headers:
  - `Content-Type: application/json`
  - `X-API-Key: {N8N_API_KEY}` (for authentication)
- [ ] Body: Transformed payload from previous node
- [ ] Handle response and log success/failure

### 🛡️ Error Handling & Reliability

**7. Error Handling Nodes**
- [ ] Add "On Error" workflows for each AI generation node
- [ ] Implement retry logic:
  - Max retries: 3
  - Exponential backoff: 2s, 4s, 8s
- [ ] Log errors to n8n execution log
- [ ] Send error details in callback if generation fails

**8. Timeout Handling**
- [ ] Set workflow timeout: 15 minutes (for Veo3 video generation)
- [ ] Handle timeout gracefully:
  - Mark as partial failure
  - Return what was successfully generated
  - Include timeout error in callback

**9. Status Tracking**
- [ ] Add Set Node to track generation progress
- [ ] Store intermediate statuses:
  - `processing_text`
  - `processing_image`
  - `processing_video`
  - `completed`
  - `failed`

### 🔐 Environment Variables (n8n)
- [ ] Configure in n8n settings:
  ```
  GEMINI_API_KEY=
  VEO3_API_KEY=
  SUPABASE_URL=
  SUPABASE_SERVICE_ROLE_KEY=
  NEXTJS_WEBHOOK_URL=
  N8N_API_KEY=
  ```

### 📊 Workflow Testing
- [ ] Test with `use_ai_text` only
- [ ] Test with `use_ai_image` only
- [ ] Test with `use_ai_video` only
- [ ] Test with all AI flags enabled
- [ ] Test with manual assets + AI generation
- [ ] Test error scenarios (invalid API keys, network failures)
- [ ] Test timeout scenarios (long video generation)

### 🔄 Workflow Optimization
- [ ] Run AI generations in parallel where possible (text + image simultaneously)
- [ ] Cache common prompts/templates
- [ ] Monitor API costs and usage
- [ ] Add cost tracking to workflow (log to database)
