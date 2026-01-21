# Phase 4: Dashboard & UI Components

### 🖥️ Main Dashboard Layout
- [ ] Create root layout with Ant Design theme
- [ ] Setup navigation structure:
  - Sidebar with menu items
  - Header with user info
  - Main content area
- [ ] Configure TailwindCSS for custom styling
- [ ] Setup React Query provider and client

### 📊 Dashboard Home Page
- [ ] **Stats Overview Cards**:
  - Total Posts (with status breakdown)
  - Connected Facebook Pages
  - Posts Published This Month
  - AI Generations Completed
- [ ] **Recent Posts Table**:
  - Columns: Title, Status, Created Date, Actions
  - Filtering by Status (Draft, Published, etc.)
  - Sorting by Date
  - Pagination
  - Quick actions: Edit, Delete, Publish
- [ ] Use Ant Design Table component
- [ ] Fetch data with React Query

### 📝 Post Creation Form

#### Form Structure (Ant Design Form)
- [ ] Use `react-hook-form` with Ant Design components
- [ ] Implement form validation with Zod schemas

#### Project Info Section
- [ ] **Project Info Section**:
  - [ ] Project Name (Input, required, max 200 chars)
  - [ ] Price (InputNumber, required, currency formatting)
  - [ ] Location (Input, required, with autocomplete suggestion)
  - [ ] Features (Select with mode="tags", allow custom tags)
  - [ ] Description (TextArea, optional, max 1000 chars)

#### Media Upload Section
- [ ] **Manual Media Upload**:
  - [ ] Use Ant Design `Upload.Dragger` component
  - [ ] Accept multiple files (images and videos)
  - [ ] File validation:
    - Images: jpg, png, webp (max 10MB each)
    - Videos: mp4, mov (max 50MB each)
  - [ ] Preview uploaded files before submission
  - [ ] Allow remove/reorder files
  - [ ] Show upload progress
  - [ ] Disable when AI toggles are active (see below)

#### AI Automation Toggles Section
- [ ] **AI Toggle Controls**:
  - [ ] `[Checkbox] Generate AI Marketing Copy`
    - When checked: Show preview area for generated text
    - Optional: Show "Custom Prompt" textarea (if `aiPromptOverride` needed)
  - [ ] `[Checkbox] Generate AI Image`
    - When checked: 
      - Hide/disable manual image upload
      - Show "Image Style Prompt" textarea (optional)
      - Show estimated generation time (2-3 minutes)
  - [ ] `[Checkbox] Generate AI Video`
    - When checked:
      - Hide/disable manual video upload
      - Show "Video Style Prompt" textarea (optional)
      - Show estimated generation time (5-10 minutes)
      - Show warning about longer processing time

#### Form Actions
- [ ] **Save as Draft** button:
  - Saves post without triggering AI or publishing
  - Status: `DRAFT`
  - Redirects to post detail page
- [ ] **Save & Generate** button (if AI toggles are on):
  - Saves post
  - Triggers n8n webhook
  - Status: `PENDING_AI`
  - Shows loading state
  - Redirects to post detail with status indicator
- [ ] **Save & Publish** button (if no AI, or AI completed):
  - Saves post
  - If AI was used: Wait for completion
  - Publishes to Facebook
  - Status: `PUBLISHED`

#### Status Feedback
- [ ] **Loading States**:
  - Show "Generating AI Content..." message
  - Display progress indicator
  - Show estimated time remaining
  - Disable form submission during processing
- [ ] **Real-time Updates**:
  - Poll post status every 5 seconds when `PENDING_AI`
  - Update UI when status changes to `READY`
  - Show success/error notifications (Ant Design message/notification)

### 📄 Post Detail View

#### Post Information Display
- [ ] Show all post fields (read-only mode)
- [ ] Display post status badge (color-coded)
- [ ] Show creation and update timestamps
- [ ] Display project details in formatted card

#### Media Display
- [ ] **Side-by-Side Comparison**:
  - Left: Original Input (manual uploads or project details)
  - Right: AI Generated Output (if applicable)
  - Use Ant Design Card components
  - Image gallery with lightbox
  - Video player for videos
- [ ] **Asset Management**:
  - Show all assets (manual + AI)
  - Display asset metadata (size, dimensions, duration)
  - Download buttons for each asset
  - Delete option (with confirmation)

#### AI Generation Section
- [ ] **AI Generation Logs**:
  - Show generation history
  - Display prompts used
  - Show generation time and cost (if available)
  - Status indicators (success/failed)
- [ ] **Re-generate Action**:
  - Button to trigger re-generation
  - Confirmation modal: "This will replace existing AI content. Continue?"
  - Show loading state during re-generation
  - Update UI when complete

#### Platform Sync Section
- [ ] **Published Platforms**:
  - List connected platforms (Facebook, etc.)
  - Show sync status for each
  - Display engagement metrics:
    - Likes, Comments, Shares, Views
  - "Refresh" button to sync latest data
  - Link to original post (if available)

#### Actions
- [ ] **Edit Button** (if status is DRAFT or READY):
  - Navigate to edit form
  - Pre-fill with existing data
- [ ] **Publish Button** (if status is READY):
  - Confirmation modal
  - Show publishing progress
  - Update status on success
- [ ] **Delete Button**:
  - Confirmation modal with warning
  - Soft delete (sets deletedAt)
  - Remove from list view

### ⚡ State Management

#### Server State (React Query)
- [ ] Setup React Query hooks:
  ```typescript
  usePosts()           // List posts with filters
  usePost(id)          // Single post
  useCreatePost()      // Mutation
  useUpdatePost()      // Mutation
  useDeletePost()      // Mutation
  usePublishPost()     // Mutation
  useSyncPost()        // Mutation
  ```
- [ ] Configure cache invalidation:
  - Invalidate post list after create/update/delete
  - Invalidate single post after update
- [ ] Setup optimistic updates for better UX

#### Form State
- [ ] Use `react-hook-form` for form management
- [ ] Integrate with Ant Design Form components
- [ ] Handle file uploads with form state

#### UI State
- [ ] Use React Context or Zustand for:
  - Modal open/close states
  - Loading states
  - Notification queue
  - Theme preferences

### 🎨 UI Components

#### Reusable Components
- [ ] **PostStatusBadge**: Color-coded status indicator
- [ ] **MediaPreview**: Image/video preview with lightbox
- [ ] **AIGenerationCard**: Display AI generation info
- [ ] **EngagementMetrics**: Show likes, comments, shares
- [ ] **ConfirmModal**: Reusable confirmation dialog
- [ ] **LoadingSpinner**: Loading indicator
- [ ] **ErrorBoundary**: Error handling component

#### Form Components
- [ ] **ProjectInfoForm**: Project details section
- [ ] **MediaUploader**: File upload with drag & drop
- [ ] **AIToggleSection**: AI automation controls
- [ ] **FormActions**: Save/Publish buttons

### 📱 Responsive Design
- [ ] Mobile-friendly layout
- [ ] Responsive tables (scroll on mobile)
- [ ] Touch-friendly buttons and inputs
- [ ] Collapsible sidebar on mobile

### 🔔 Notifications & Feedback
- [ ] Success notifications (Ant Design message)
- [ ] Error notifications with details
- [ ] Toast notifications for background operations
- [ ] Loading skeletons for better perceived performance

### 🔍 Additional Features
- [ ] **Search/Filter**:
  - Search posts by title
  - Filter by status, date range
  - Sort by various fields
- [ ] **Bulk Actions**:
  - Select multiple posts
  - Bulk delete
  - Bulk publish (if ready)
- [ ] **Export**:
  - Export post data as CSV/JSON
  - Export assets as ZIP
