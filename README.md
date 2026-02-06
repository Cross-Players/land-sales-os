# Land Sales Dashboard

AI-powered real estate marketing automation platform. Create posts, generate content using AI, and publish to social media platforms.

## Features

- **Post Management**: Create, edit, and manage real estate posts
- **AI Content Generation**: Generate marketing copy, images, and videos using AI
- **Social Media Publishing**: Publish content to Facebook (more platforms coming soon)
- **Dashboard**: Overview of all posts with status tracking

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Ant Design, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL) with Prisma ORM
- **Automation**: n8n workflows
- **AI**: Google Gemini (text/vision), Veo3 (video)
- **State Management**: React Query (TanStack Query)

## Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- Facebook Developer account (for publishing)
- n8n instance (for AI automation)

## Getting Started

### Local Development

#### 1. Install Dependencies

```bash
cd land-sales-os
npm install
```

#### 2. Environment Variables

Copy the example env file and fill in your values (see [.env.example](.env.example)). Use your Supabase project for database and storage.

```bash
cp .env.example .env.local
```

Required: `DATABASE_URL` (Supabase Session pooler), Supabase keys, and optionally `N8N_WEBHOOK_URL` / `N8N_API_KEY` for n8n integration.

#### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (uses DATABASE_URL from .env.local)
npm run db:push
```

#### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/src
  /app
    /api              # API routes
    /dashboard        # Dashboard pages
    /posts            # Post management
  /components         # React components
    /ui               # Reusable UI components
    /forms            # Form components
  /lib
    /db               # Database services (Prisma)
    /services         # External API services
    /utils            # Helper functions
    /validations      # Zod schemas
  /types              # TypeScript definitions
  /hooks              # Custom React hooks
/prisma
  schema.prisma       # Database schema
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/posts | List all posts |
| POST | /api/posts | Create a new post |
| GET | /api/posts/:id | Get a single post |
| PUT | /api/posts/:id | Update a post |
| DELETE | /api/posts/:id | Delete a post |
| POST | /api/posts/:id/publish | Publish to Facebook |
| POST | /api/posts/:id/regenerate | Regenerate AI content |
| POST | /api/webhooks/n8n | n8n callback webhook |
| GET | /api/health | Health check |

## Deployment (Vercel + GitHub Actions)

- **Deploy lên Vercel:** Xem [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) để cấu hình Vercel, biến môi trường và kết nối GitHub.
- **CI/CD:** Workflow tại `.github/workflows/ci.yml` chạy lint và build trên mỗi push/PR vào `main`. Vercel tự deploy khi push lên GitHub.

## License

MIT
