# land-sales-dashboard - Development Plan

## 🏗️ Architecture Overview
- **Monorepo-style structure**: Separate UI from Logic.
- **Backend**: NextJS API Routes acting as a gateway (Easily swappable to Express/NestJS).
- **Communication**: Dashboard ↔️ NextJS API ↔️ n8n ↔️ AI Models & Social APIs.

## 🛠️ Tech Stack Recap
- **Frontend**: NextJS 15+, TypeScript, Ant Design, TailwindCSS, React Query.
- **Backend/API**: NextJS API Routes, Facebook Graph API.
- **Database**: Supabase (PostgreSQL + Auth + Storage) with Prisma ORM.
- **Automation**: n8n.
- **AI**: Gemini (Text/Vision), Veo3 (Video).
- **DevOps**: Docker, GitHub Actions, Vercel.

## 🚀 Phases
0. **Phase 0**: Project Initialization & Setup.
1. **Phase 1**: Architecture & Database Design.
2. **Phase 2**: Core API & Platform Integration.
3. **Phase 3**: AI Automation Pipeline (n8n).
4. **Phase 4**: Management Dashboard UI.
5. **Phase 5**: DevOps & CI/CD.