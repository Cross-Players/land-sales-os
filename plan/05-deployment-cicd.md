# Phase 5: DevOps & CI/CD

### 🔄 CI/CD Pipeline (GitHub Actions)

#### Workflow Setup
- [ ] Create `.github/workflows/ci.yml`
- [ ] Trigger on:
  - Pull requests to `main` branch
  - Pushes to `main` branch

#### CI Pipeline Steps
- [ ] **Checkout Code**:
  ```yaml
  - uses: actions/checkout@v4
  ```

- [ ] **Setup Node.js**:
  ```yaml
  - uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'
  ```

- [ ] **Install Dependencies**:
  ```yaml
  - run: npm ci
  ```

- [ ] **Lint Check**:
  ```yaml
  - run: npm run lint
  ```

- [ ] **Type Check**:
  ```yaml
  - run: npx tsc --noEmit
  ```

- [ ] **Build Check**:
  ```yaml
  - run: npm run build
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      # Add other required env vars (use dummy values for build)
  ```

#### CD Pipeline (Vercel)
- [ ] Connect GitHub repository to Vercel
- [ ] Configure automatic deployments:
  - Production: `main` branch
  - Preview: All other branches/PRs
- [ ] Setup environment variables in Vercel dashboard

### 🔐 Environment Variables Configuration

#### GitHub Secrets
- [ ] Add required secrets for CI:
  - `NEXT_PUBLIC_SUPABASE_URL` (for build)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (for build)
  - Other non-sensitive build-time variables

#### Vercel Environment Variables
- [ ] Configure all environment variables:
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
  NODE_ENV=production
  NEXT_PUBLIC_APP_URL=
  ```
- [ ] Set different values for:
  - Production environment
  - Preview environments (optional)

### 🐳 Docker Configuration

#### Dockerfile
- [ ] Create optimized multi-stage Dockerfile:
  ```dockerfile
  # Stage 1: Dependencies
  FROM node:20-alpine AS deps
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci

  # Stage 2: Builder
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY --from=deps /app/node_modules ./node_modules
  COPY . .
  RUN npm run build

  # Stage 3: Runner
  FROM node:20-alpine AS runner
  WORKDIR /app
  ENV NODE_ENV production
  COPY --from=builder /app/public ./public
  COPY --from=builder /app/.next/standalone ./
  COPY --from=builder /app/.next/static ./.next/static
  EXPOSE 3000
  CMD ["node", "server.js"]
  ```

- [ ] Configure Next.js for standalone output in `next.config.js`:
  ```javascript
  output: 'standalone'
  ```

#### docker-compose.yml (Development)
- [ ] Create docker-compose for local development:
  ```yaml
  version: '3.8'
  services:
    app:
      build: .
      ports:
        - "3000:3000"
      environment:
        - NODE_ENV=development
      volumes:
        - .:/app
        - /app/node_modules
        - /app/.next
      env_file:
        - .env.local
  ```

- [ ] Configure volume mounts for hot reload
- [ ] Setup health check endpoint

#### Docker Considerations
- [ ] Handle large media uploads:
  - Increase upload size limits in Next.js config
  - Configure proper timeout values
  - Consider streaming for large files
- [ ] Optimize image size:
  - Use multi-stage builds
  - Minimize final image size
  - Use .dockerignore to exclude unnecessary files

### 📝 Documentation

#### Setup Documentation
- [ ] Create `README.md` with:
  - Project overview
  - Prerequisites
  - Installation steps
  - Environment variables setup
  - Local development instructions
  - Docker setup instructions

#### Deployment Documentation
- [ ] Document deployment process:
  - Vercel deployment steps
  - Environment variable configuration
  - Database migration process
  - Troubleshooting common issues

#### API Documentation
- [ ] Document all API endpoints:
  - Request/response schemas
  - Authentication requirements
  - Error codes and messages
  - Example requests

### 🔍 Monitoring & Logging

#### Error Tracking
- [ ] Setup error tracking service (optional for demo):
  - Consider Sentry or similar
  - Log errors in production
  - Track error rates

#### Analytics
- [ ] Setup analytics (optional for demo):
  - Vercel Analytics (built-in)
  - Track page views and user interactions

#### Logging Strategy
- [ ] Implement structured logging:
  - Use console.log for development
  - Use proper logging service for production (if needed)
  - Log API requests/responses
  - Log AI generation events
  - Log Facebook API interactions

### 🔄 Database Migrations

#### Migration Strategy
- [ ] Use Prisma migrations:
  ```bash
  npx prisma migrate deploy  # For production
  ```
- [ ] Document migration process:
  - How to run migrations locally
  - How to run migrations in production
  - Rollback procedures

#### Migration Safety
- [ ] Test migrations on staging first
- [ ] Backup database before migrations
- [ ] Document breaking changes

### 🚀 Deployment Checklist

#### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] Build succeeds locally
- [ ] All API endpoints tested
- [ ] n8n workflow tested end-to-end
- [ ] Facebook integration tested

#### Post-Deployment
- [ ] Verify application is accessible
- [ ] Test critical user flows
- [ ] Verify environment variables are loaded
- [ ] Check database connection
- [ ] Test file uploads
- [ ] Test AI generation workflow
- [ ] Test Facebook publishing

### 📦 Build Optimization
- [ ] Configure Next.js build optimizations:
  - Image optimization
  - Code splitting
  - Bundle analysis
- [ ] Optimize Docker image:
  - Minimize layers
  - Use .dockerignore
  - Cache dependencies properly
