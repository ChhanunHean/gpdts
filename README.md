# GPDTS 2026 Poipet — Full Stack App

**Stack:** Node.js + Express · PostgreSQL (Supabase) · Vercel · Cloudflare DNS

---

## 🚀 Setup Guide

### 1. Supabase Database
1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **Service Role Key** from Settings → API
3. Go to SQL Editor → paste `db/schema.sql` → Run it

### 2. Create Admin User
Run this in Supabase SQL Editor (replace `your_password`):
```sql
-- First generate a bcrypt hash at: https://bcrypt-generator.com (rounds=10)
INSERT INTO admins (username, password_hash)
VALUES ('admin', '$2a$10$YOUR_BCRYPT_HASH_HERE');
```

### 3. Environment Variables
```bash
cp .env.example .env
# Fill in your Supabase URL, keys, admin password, JWT secret
```

### 4. Install & Run Locally
```bash
npm install
npm run dev
# → http://localhost:3000
# → http://localhost:3000/admin
```

---

## 🌐 Deploy to Vercel

### Push to GitHub first:
```bash
cd gpdts
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/ChhanunHean/gpdts.git
git push -u origin main
```

### Deploy:
1. Go to [vercel.com](https://vercel.com) → Import GitHub repo `ChhanunHean/gpdts`
2. Add Environment Variables in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET`
3. Deploy!

### Connect Cloudflare Domain:
1. In Vercel → Settings → Domains → Add your domain
2. In Cloudflare DNS → Add CNAME record:
   - Name: `@` (or `www`)
   - Target: `cname.vercel-dns.com`
   - Proxy: **OFF** (DNS only) for Vercel SSL to work

---

## 📁 Structure

```
gpdts/
├── api/
│   ├── index.js          # Express server
│   ├── lib/supabase.js   # DB client
│   ├── middleware/auth.js # JWT auth
│   └── routes/
│       ├── public.js     # GET /api/event, /api/students
│       └── admin.js      # Admin CRUD (protected)
├── db/
│   └── schema.sql        # Run in Supabase
├── public/
│   ├── index.html        # Public site (looks identical to original)
│   └── admin.html        # Admin panel
├── .env.example
├── vercel.json
└── package.json
```

---

## 🔐 Admin Panel
- URL: `https://yourdomain.com/admin`
- Login with username/password you set in Supabase

**Can do:**
- ✅ Add / edit / delete students
- ✅ Edit outreach & classroom goals
- ✅ View event info

---

## 🔗 API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/event` | Public | Full event data |
| GET | `/api/students` | Public | All students |
| POST | `/api/admin/login` | — | Get JWT token |
| GET | `/api/admin/students` | JWT | Students (admin view) |
| POST | `/api/admin/students` | JWT | Add student |
| PUT | `/api/admin/students/:id` | JWT | Update student |
| DELETE | `/api/admin/students/:id` | JWT | Delete student |
| PUT | `/api/admin/goals` | JWT | Replace all goals |
| PUT | `/api/admin/event` | JWT | Update event meta |
