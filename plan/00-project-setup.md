# Phase 0: Project Initialization & Setup

### 🚀 Initialize Project
- [ ] Create Next.js 15+ project with TypeScript: `npx create-next-app@latest land-sales-dashboard --typescript --app`
- [ ] Setup project folder structure:
  ```
  /src
    /app
      /api              # API routes
      /dashboard        # Dashboard pages
      /posts            # Post management pages
      layout.tsx
      page.tsx
    /components         # React components
      /ui               # Reusable UI components
      /forms            # Form components
    /lib
      /services         # External API services (Facebook, n8n)
      /db               # Prisma client & database utilities
      /utils            # Helper functions
    /types              # TypeScript type definitions
    /hooks              # Custom React hooks
  ```

### 📦 Install Dependencies
- [ ] Install core dependencies:
  ```bash
  npm install @prisma/client prisma
  npm install @supabase/supabase-js
  npm install antd @ant-design/icons
  npm install @tanstack/react-query
  npm install zod                    # For validation
  npm install react-hook-form        # For form management
  ```

- [ ] Install dev dependencies:
  ```bash
  npm install -D @types/node @types/react @types/react-dom
  npm install -D eslint prettier
  npm install -D tailwindcss postcss autoprefixer
  ```

### ⚙️ Configuration Files
- [ ] Setup Prisma: `npx prisma init`
- [ ] Configure `tsconfig.json` with strict mode
- [ ] Setup ESLint and Prettier configs
- [ ] Configure TailwindCSS
- [ ] Create `.env.example` with all required variables (see below)

### 🔐 Environment Variables (.env.example)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET_MANUAL=manual-uploads
SUPABASE_STORAGE_BUCKET_AI=ai-generated-content

# Facebook/Meta
FB_APP_ID=
FB_APP_SECRET=
FB_REDIRECT_URI=

# n8n
N8N_WEBHOOK_URL=
N8N_API_KEY=

# AI Services
GEMINI_API_KEY=
VEO3_API_KEY=

# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 🐳 Docker Setup
- [ ] Create `Dockerfile` for Next.js app
- [ ] Create `docker-compose.yml` for local development
- [ ] Configure volumes for hot reload
- [ ] Setup environment variable injection

### 📝 Initial Type Definitions
- [ ] Create `/src/types/database.ts` for Prisma-generated types
- [ ] Create `/src/types/api.ts` for API request/response types
- [ ] Create `/src/types/post.ts` for Post-related types
