# Deploy Land Sales OS lên Vercel + CI/CD với GitHub Actions

Hướng dẫn deploy project lên Vercel và thiết lập CI/CD bằng GitHub Actions.

---

## Phần 1: Chuẩn bị repository trên GitHub

1. Tạo repository trên GitHub (nếu chưa có).
2. Push code lên GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/land-sales-os.git
   git branch -M main
   git push -u origin main
   ```

---

## Phần 2: Deploy lên Vercel

### Bước 1: Kết nối Vercel với GitHub

1. Đăng nhập [Vercel](https://vercel.com).
2. Click **Add New…** → **Project**.
3. Chọn **Import Git Repository** → chọn repo **land-sales-os** (hoặc tên repo của bạn).
4. Nếu chưa kết nối GitHub, authorize Vercel truy cập repo.

### Bước 2: Cấu hình Build

- **Framework Preset:** Next.js (tự nhận).
- **Root Directory:** để trống.
- **Build Command:** `npm run build` (mặc định; script đã gồm `prisma generate`).
- **Output Directory:** để mặc định (`.next`).
- **Install Command:** `npm ci` hoặc `npm install`.

### Bước 3: Biến môi trường (Environment Variables)

Vào **Settings → Environment Variables** của project, thêm các biến sau. Áp dụng cho **Production**, **Preview**, **Development** tùy nhu cầu.

| Name | Value | Ghi chú |
|------|--------|--------|
| `DATABASE_URL` | `postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres` | Supabase Session pooler; thay `YOUR_PASSWORD` và `PROJECT_REF`. |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Từ Supabase Dashboard → Settings → API. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Anon/public key. |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Service role key (giữ bí mật). |
| `SUPABASE_STORAGE_BUCKET_MANUAL` | `manual-uploads` | Tùy chọn. |
| `SUPABASE_STORAGE_BUCKET_AI` | `ai-generated-content` | Tùy chọn. |
| `N8N_WEBHOOK_URL` | `https://primary-production-64e7.up.railway.app/webhook-test/facebook-auto-post` | URL webhook n8n. |
| `N8N_API_KEY` | API key dùng cho n8n | Dùng cho webhook callback. |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | **Sau lần deploy đầu:** lấy URL thật từ Vercel rồi cập nhật lại. |

**Lưu ý:** Các biến `NEXT_PUBLIC_*` sẽ được nhúng vào build; thay đổi cần **Redeploy**.

### Bước 4: Deploy

1. Click **Deploy**.
2. Chờ build xong; Vercel sẽ cho URL dạng `https://land-sales-os-xxx.vercel.app`.
3. Sau khi có URL thật, quay lại **Environment Variables** và set `NEXT_PUBLIC_APP_URL` = URL đó, rồi **Redeploy** (Deployments → … → Redeploy).

### Bước 5: Database (Prisma)

- Schema đã có trên Supabase: không cần chạy gì thêm trên Vercel.
- Nếu cần áp dụng migration mới: chạy trên máy local (hoặc CI) với `DATABASE_URL` production:
  ```bash
  DATABASE_URL="postgresql://..." npx prisma migrate deploy
  ```
  **Không** commit `.env` có password; dùng secret hoặc Vercel env khi cần.

---

## Phần 3: GitHub Actions (CI/CD)

Repo đã có workflow CI tại `.github/workflows/ci.yml`.

### Workflow làm gì

- **Khi nào chạy:** Mỗi push lên `main` và mỗi pull request vào `main`.
- **Các bước:**
  1. Checkout code.
  2. Cài dependency (`npm ci`).
  3. `prisma generate`.
  4. `npm run lint`.
  5. Type check (`tsc --noEmit`).
  6. `npm run build`.

Nếu bước nào fail, workflow báo lỗi (và có thể chặn merge tùy cấu hình branch protection).

### Cấu hình Branch Protection (tùy chọn)

Để bắt buộc CI pass trước khi merge:

1. GitHub repo → **Settings** → **Branches**.
2. **Add rule** cho branch `main`.
3. Bật **Require status checks to pass before merging**.
4. Chọn status: **Lint & Build** (tên job trong `ci.yml`).

---

## Phần 4: CD (tự động deploy khi push)

Khi đã **Import** project từ GitHub trong Vercel:

- **Push lên `main`** → Vercel tự build và deploy **Production**.
- **Push lên branch khác** hoặc **PR** → Vercel tạo **Preview Deployment** (URL riêng).

Không cần thêm workflow GitHub Actions để “deploy” lên Vercel; Vercel đã tích hợp sẵn.

---

## Tóm tắt luồng

1. Code push/merge vào `main` → GitHub Actions chạy CI (lint, build).
2. Vercel nhận webhook từ GitHub → build và deploy (production hoặc preview).
3. App chạy trên Vercel, kết nối Supabase qua `DATABASE_URL`; n8n gọi webhook với `NEXT_PUBLIC_APP_URL`.

---

## Xử lý lỗi thường gặp

| Lỗi | Cách xử lý |
|-----|------------|
| Build fail: `PrismaClient not found` | Script `build` đã gồm `prisma generate`; kiểm tra `package.json` có `"build": "prisma generate && next build"`. |
| Lỗi kết nối DB trên Vercel | Kiểm tra `DATABASE_URL` (Session pooler, port 5432); firewall Supabase cho phép IP Vercel (thường đã bật). |
| Webhook n8n gọi app không tới | Set `NEXT_PUBLIC_APP_URL` đúng URL Vercel (ví dụ `https://xxx.vercel.app`). |
| 413 Request Entity Too Large | Đã cấu hình `serverActions.bodySizeLimit` trong `next.config.ts`; với Vercel có thể cần kiểm tra plan/limit. |

---

## Checklist trước khi deploy

- [ ] Repo đã push lên GitHub.
- [ ] Vercel đã import project và cấu hình đúng Build Command.
- [ ] Đã thêm đủ Environment Variables trên Vercel (ít nhất `DATABASE_URL`, Supabase keys, `N8N_*`, `NEXT_PUBLIC_APP_URL`).
- [ ] Sau deploy đầu, đã cập nhật `NEXT_PUBLIC_APP_URL` và redeploy.
- [ ] File `.github/workflows/ci.yml` đã có trong repo để CI chạy trên push/PR.

Sau khi làm xong các bước trên, project sẽ chạy trên Vercel và CI/CD chạy qua GitHub Actions.
