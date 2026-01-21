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

### Option 1: Docker (Recommended)

```bash
# Start PostgreSQL and app
docker-compose up -d

# Run database migrations
docker-compose exec app npx prisma db push

# View logs
docker-compose logs -f app
```

Open [http://localhost:3000](http://localhost:3000)

### Option 2: Local Development

#### 1. Install Dependencies

```bash
cd land-sales-os
npm install
```

#### 2. Start PostgreSQL

```bash
# Using Docker (just the database)
docker run -d --name land-sales-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=land_sales \
  -p 5432:5432 \
  postgres:15-alpine
```

#### 3. Environment Variables

```bash
cp env.local.example .env.local
```

The default DATABASE_URL for local PostgreSQL:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/land_sales
```

#### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

#### 5. Run Development Server

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

## Docker

### Development

```bash
docker-compose up
```

### Production Build

```bash
docker build -t land-sales-dashboard .
docker run -p 3000:3000 --env-file .env.local land-sales-dashboard
```

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

## License

MIT
