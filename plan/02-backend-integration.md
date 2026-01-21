# Phase 2: API & Platform Integration

### 🔑 Facebook API Setup
- [ ] Create Meta Business App in Facebook Developer Console
- [ ] Configure App Permissions:
  - `pages_manage_posts`
  - `pages_read_engagement`
  - `pages_show_list`
- [ ] Setup OAuth flow to obtain Page Access Tokens
- [ ] Store Page Access Tokens securely (encrypted in database or environment)

### 🔌 Facebook Service Implementation
- [ ] Create `/src/lib/services/facebook.service.ts`:
  ```typescript
  class FacebookService {
    // OAuth & Token Management
    getAuthUrl(): string
    handleOAuthCallback(code: string): Promise<{ accessToken: string, pageId: string }>
    refreshToken(token: string): Promise<string>
    
    // Post Operations
    createPost(pageId: string, content: FacebookPostPayload): Promise<FacebookPostResponse>
    updatePost(postId: string, content: Partial<FacebookPostPayload>): Promise<void>
    deletePost(postId: string): Promise<void>
    
    // Media Upload
    uploadImage(pageId: string, imageUrl: string): Promise<string> // Returns attachment_id
    uploadVideo(pageId: string, videoUrl: string, description?: string): Promise<string>
    
    // Engagement
    getPostEngagement(postId: string): Promise<EngagementData>
  }
  ```

- [ ] Handle multi-media upload logic:
  - Support both Supabase Storage URLs and direct file buffers
  - Handle image uploads (single or multiple)
  - Handle video uploads with progress tracking
  - Combine media into single post

- [ ] Implement error handling:
  - Token expiration → Auto-refresh
  - Rate limiting → Queue and retry
  - API errors → Log and return user-friendly messages

### 📡 NextJS API Routes

#### Core Post Endpoints

**1. POST /api/posts**
- [ ] Accept multipart/form-data (form fields + files)
- [ ] Validate input with Zod schema
- [ ] Save post to database with Prisma
- [ ] Handle file uploads:
  - If `use_ai_image` or `use_ai_video` is false: Upload files to Supabase Storage → Save asset URLs
  - If `use_ai_image` or `use_ai_video` is true: Save post with `PENDING_AI` status → Trigger n8n webhook
- [ ] Return created post with status

**Request Schema:**
```typescript
{
  title: string;
  description?: string;
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
  files?: File[]; // Only if not using AI
}
```

**2. GET /api/posts**
- [ ] Support pagination: `?page=1&limit=20`
- [ ] Support filtering: `?status=DRAFT&status=PUBLISHED`
- [ ] Support sorting: `?sortBy=createdAt&order=desc`
- [ ] Return posts with related assets and platform syncs
- [ ] Use Prisma service layer (no direct DB calls in route handler)

**3. GET /api/posts/[id]**
- [ ] Fetch post by ID with all relations
- [ ] Include assets, platform syncs, AI generation logs
- [ ] Return 404 if not found

**4. PUT /api/posts/[id]**
- [ ] Update post fields
- [ ] Handle file replacements
- [ ] Validate status transitions (e.g., can't edit published posts)
- [ ] Return updated post

**5. DELETE /api/posts/[id]**
- [ ] Soft delete (set `deletedAt`)
- [ ] Delete associated assets from storage
- [ ] Cancel any pending publishing queue items
- [ ] Return success status

**6. POST /api/posts/[id]/publish**
- [ ] Validate post is in `READY` status
- [ ] Check if AI generation is complete (if AI flags were set)
- [ ] Create/update publishing queue entry
- [ ] Trigger Facebook post creation
- [ ] Update post status to `PUBLISHED`
- [ ] Create platform sync entries
- [ ] Return published post with Facebook post IDs

**7. POST /api/posts/[id]/regenerate**
- [ ] Reset AI generation flags
- [ ] Set post status to `PENDING_AI`
- [ ] Trigger n8n webhook again
- [ ] Return updated post

**8. GET /api/posts/[id]/sync**
- [ ] Fetch latest engagement data from Facebook
- [ ] Update platform sync records
- [ ] Return updated engagement metrics

#### Webhook Endpoints

**9. POST /api/webhooks/n8n**
- [ ] Authenticate request (API key validation)
- [ ] Validate payload schema
- [ ] Update post with AI-generated content
- [ ] Save generated assets to database
- [ ] Update AI generation logs
- [ ] Change post status from `PENDING_AI` to `READY`
- [ ] Return success status

**Request Schema (from n8n):**
```typescript
{
  postId: string;
  generatedContent: {
    text?: string;
    images?: Array<{ url: string; prompt: string }>;
    videos?: Array<{ url: string; prompt: string; duration: number }>;
  };
  status: 'success' | 'partial' | 'failed';
  errors?: Array<{ type: string; message: string }>;
}
```

#### Facebook Integration Endpoints

**10. GET /api/facebook/pages**
- [ ] List connected Facebook pages
- [ ] Return page ID, name, access token status

**11. POST /api/facebook/connect**
- [ ] Initiate OAuth flow
- [ ] Return authorization URL

**12. GET /api/facebook/callback**
- [ ] Handle OAuth callback
- [ ] Exchange code for access token
- [ ] Fetch user's pages
- [ ] Store page access tokens
- [ ] Redirect to dashboard

### 🗄️ Publishing Queue Implementation
- [ ] Create queue service in `/src/lib/services/publishing-queue.service.ts`
- [ ] Implement queue processing logic:
  - Check for pending items
  - Process in order (FIFO)
  - Handle retries with exponential backoff
  - Update status on completion/failure
- [ ] Create background job processor (or use Next.js API route with cron)
- [ ] Handle Veo3 video generation delay:
  - Queue item waits for AI generation to complete
  - Poll or webhook-based completion check
  - Auto-publish when ready

### 🛡️ Service Layer Pattern
- [ ] **CRITICAL**: All database operations go through service layer
- [ ] Route handlers only: validate input → call service → format response
- [ ] Services handle: business logic → Prisma queries → error handling
- [ ] Example structure:
  ```
  /src/lib/services/
    post.service.ts
    asset.service.ts
    facebook.service.ts
    n8n.service.ts
    storage.service.ts
  ```

### ✅ Validation & Error Handling
- [ ] Create Zod schemas for all API requests in `/src/lib/validations/`
- [ ] Implement consistent error response format:
  ```typescript
  { success: boolean; error?: string; data?: any }
  ```
- [ ] Create custom error classes in `/src/lib/errors/`
- [ ] Add error logging (console for dev, external service for prod)
