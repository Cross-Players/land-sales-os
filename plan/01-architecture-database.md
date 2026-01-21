# Phase 1: Infrastructure & Database Design

### 🏗️ Setup Project
- [ ] Initialize `land-sales-dashboard` using NextJS 15+ and TypeScript.
- [ ] Setup Docker environment for local development.
- [ ] Configure Prisma ORM with Supabase PostgreSQL connection.

### 🗄️ Database Schema (Prisma + Supabase)

#### Prisma Schema Setup
- [ ] Create `prisma/schema.prisma` with Supabase provider
- [ ] Configure connection string to Supabase PostgreSQL
- [ ] Setup Prisma Client generation

#### Database Tables

**1. Posts Table**
```prisma
model Post {
  id                String   @id @default(uuid())
  title             String
  description       String?  @db.Text
  projectDetails    Json     // { name, price, location, features[] }
  status            PostStatus @default(DRAFT)
  
  // AI Configuration
  useAiImage        Boolean  @default(false)
  useAiVideo        Boolean  @default(false)
  useAiText         Boolean  @default(false)
  aiPromptOverride  String?  @db.Text
  
  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?
  
  // Relations
  assets            Asset[]
  platformSyncs    PlatformSync[]
  publishingQueue  PublishingQueue?
  aiGenerationLogs AiGenerationLog[]
  
  @@index([status])
  @@index([createdAt])
  @@map("posts")
}

enum PostStatus {
  DRAFT
  PENDING_AI
  READY
  PUBLISHED
  FAILED
}
```

**2. Assets Table**
```prisma
model Asset {
  id              String   @id @default(uuid())
  postId          String
  url             String
  type            AssetType
  source          AssetSource
  order           Int      @default(0)
  
  // Metadata
  fileName        String?
  fileSize        Int?     // bytes
  mimeType        String?
  width           Int?     // for images/videos
  height          Int?     // for images/videos
  duration        Int?     // seconds, for videos
  
  // Processing
  processingStatus ProcessingStatus @default(PENDING)
  errorMessage    String?  @db.Text
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  post            Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  @@index([postId])
  @@index([type, source])
  @@map("assets")
}

enum AssetType {
  IMG
  VID
}

enum AssetSource {
  MANUAL
  AI
}

enum ProcessingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

**3. Platform Sync Table**
```prisma
model PlatformSync {
  id              String   @id @default(uuid())
  postId          String
  platform        Platform
  externalId      String?  // Facebook post ID
  syncStatus      SyncStatus @default(PENDING)
  
  // Engagement Data (from Facebook)
  likes           Int      @default(0)
  comments        Int      @default(0)
  shares          Int      @default(0)
  views           Int      @default(0)
  
  // Error Handling
  syncError       String?  @db.Text
  retryCount      Int      @default(0)
  lastSyncedAt    DateTime?
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  post            Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  @@unique([postId, platform])
  @@index([platform, syncStatus])
  @@map("platform_syncs")
}

enum Platform {
  FACEBOOK
  INSTAGRAM
  TIKTOK
}

enum SyncStatus {
  PENDING
  SYNCING
  SYNCED
  FAILED
}
```

**4. Publishing Queue Table**
```prisma
model PublishingQueue {
  id              String   @id @default(uuid())
  postId          String   @unique
  status          QueueStatus @default(PENDING)
  
  // Scheduling
  scheduledAt     DateTime @default(now())
  processedAt     DateTime?
  
  // Error Handling
  errorMessage    String?  @db.Text
  retryCount      Int      @default(0)
  maxRetries      Int      @default(3)
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  post            Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  @@index([status, scheduledAt])
  @@map("publishing_queue")
}

enum QueueStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}
```

**5. AI Generation Logs Table**
```prisma
model AiGenerationLog {
  id              String   @id @default(uuid())
  postId          String
  generationType  GenerationType
  prompt          String?  @db.Text
  resultUrl       String?
  
  // Metrics
  cost            Float?   // API cost in USD
  duration        Int?     // Processing time in seconds
  tokensUsed      Int?     // For text generation
  
  // Status
  status          GenerationStatus @default(PENDING)
  errorMessage    String?  @db.Text
  
  // Timestamps
  createdAt       DateTime @default(now())
  completedAt     DateTime?
  
  // Relations
  post            Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  @@index([postId, generationType])
  @@index([status])
  @@map("ai_generation_logs")
}

enum GenerationType {
  TEXT
  IMAGE
  VIDEO
}

enum GenerationStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### 🗄️ Database Migrations
- [ ] Run initial migration: `npx prisma migrate dev --name init`
- [ ] Generate Prisma Client: `npx prisma generate`
- [ ] Create Prisma Client singleton in `/src/lib/db/prisma.ts`

### 🔒 Row Level Security (RLS)
- [ ] Setup RLS policies in Supabase for all tables
- [ ] Configure policies for authenticated users
- [ ] Test RLS policies with Prisma queries

### 📦 Storage Buckets (Supabase)
- [ ] Create `manual-uploads` bucket
  - Public access: false
  - File size limit: 50MB
  - Allowed MIME types: image/*, video/*
  
- [ ] Create `ai-generated-content` bucket
  - Public access: true (for Facebook API access)
  - File size limit: 100MB
  - Allowed MIME types: image/*, video/*

### 🔧 Database Utilities
- [ ] Create `/src/lib/db/post.service.ts` - Post CRUD operations
- [ ] Create `/src/lib/db/asset.service.ts` - Asset operations
- [ ] Create `/src/lib/db/platform-sync.service.ts` - Platform sync operations
- [ ] Create `/src/lib/db/publishing-queue.service.ts` - Queue operations
