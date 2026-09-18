# SPD Logistics — Transport & Logistics Management System

A production-ready enterprise logistics management platform built for **Super Pak Data (SPD) Goods Transport Co.** (Est. 1996, Pakistan).

---

## Features

- **Public Web Portal**:
  - Home page with live tracking search, services catalog, and fleet showcase.
  - Interactive status timeline tracking for Bilty and Tracking IDs.
  - Contact form with direct Nodemailer email dispatch.
  - Floating WhatsApp click-to-chat integration with dispatch and executive management.
  - Floating AI Customer Support Assistant powered by Groq Llama-3.
  - Legal compliance pages: Privacy Policy (`/privacy-policy`), Terms & Conditions of Carriage (`/terms`), and Cookie Policy (`/cookies`).
  - Progressive Web App (PWA) with offline fallback service worker and web manifest.

- **Role-Based Portals**:
  - **Admin & Executive Dashboard**: Complete multi-module back office (Consignments/Bilty, Cash Books, Accounts, Customers, Drivers, Vehicles, Receivables, Payables, Payments, Reports, Audit Logs, Settings).
  - **Customer Portal**: Dedicated cargo tracking, shipment history, invoice receipts, and account balances.
  - **Driver Portal**: Real-time assigned shipment viewing, delivery milestone updates, and route execution.

- **Security & Data Integrity**:
  - Cryptographic password protection with bcrypt.
  - Role-based session authentication using signed HTTP-only JWT cookies (`spd_token`).
  - Immutable system audit logging for consignment state changes.
  - Multi-tenant data isolation across customer and staff roles.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide React
- **Database & ORM**: Prisma ORM (SQLite for local development, PostgreSQL compatible for cloud)
- **Authentication**: JWT (jose) & bcryptjs
- **AI Engine**: Groq Cloud API (Llama-3 architecture)
- **Email Delivery**: Nodemailer with TLS/SSL SMTP transport

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd spd-logistics
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your secrets in `.env`:
- `DATABASE_URL`: Path to local SQLite or cloud PostgreSQL connection string.
- `JWT_SECRET`: Random 32+ character string for token signing.
- `GROQ_API_KEY`: Groq API key for the AI assistant.
- `SMTP_*`: Credentials for automated inquiry email forwarding.

### 3. Database Migration & Seeding

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
npm start
```

---

## Deployment Guide

### Production Database Requirement for Vercel
Vercel executes Next.js API routes in serverless environments with a read-only, ephemeral file system. Because SQLite relies on writing to a local file (`dev.db`), **SQLite cannot be used on Vercel**. 

For production deployment on Vercel:
1. Provision a free managed PostgreSQL database from any provider:
   - **Neon** (https://neon.tech) — Recommended, instant setup with connection pooling
   - **Supabase** (https://supabase.com)
   - **Vercel Postgres** (via Vercel Marketplace)
   - **Railway** (https://railway.app)
2. In `prisma/schema.prisma`, change the datasource provider from `"sqlite"` to `"postgresql"`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set your production environment variables in the Vercel Project Settings (see `.env.example`).
4. Run `npx prisma db push` or add a post-install build script to push the schema to your cloud database.
5. Seed initial data if needed: `npx tsx prisma/seed.ts`.

### Deploying to Vercel
1. Push repository to your new GitHub repository (`spd-logistics`).
2. In Vercel, click **Add New** > **Project** and import `spd-logistics`.
3. Add the environment variables from `.env.example`:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Secure random 32+ character string
   - `ADMIN_EMAIL`: `admin@gmail.com`
   - `ADMIN_PASSWORD`: `admin`
   - `GROQ_API_KEY`: Server-side Groq key for customer support AI
   - `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`: Gmail/SMTP dispatcher credentials
4. Click **Deploy**. Vercel will automatically run `npm run build` and launch the platform.

---

## License & Ownership

&copy; 2026 Super Pak Data (SPD) Goods Transport Co. All rights reserved.
