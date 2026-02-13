# UCH Connection - Digital Financial Ledger

Sistem pencatatan keuangan digital multi-tenant untuk UCH Pusat dan lini-lini operasionalnya (USH, Fastlab, HKI, PKM Center).

## 🚀 Features

- **Multi-Tenant Isolation:** Setiap lini hanya bisa melihat datanya sendiri
- **UCH Master View:** UCH Pusat (Super Admin) memiliki akses untuk melihat seluruh data dari semua lini
- **Mandatory S3 Evidence:** Kewajiban melampirkan foto nota yang disimpan di MinIO S3
- **Digital Audit Trail:** Pencatatan otomatis siapa yang menginput dan kapan
- **Pagination & Filtering:** Semua list endpoint mendukung pagination, search, dan filter
- **Role-Based Access Control:** Tiga level role dengan permission berbeda

## 🛠 Tech Stack

- **Runtime:** Bun v1.1+
- **Backend:** ElysiaJS (E2E Type-safety)
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Storage:** MinIO S3

## 📁 Project Structure

```
src/
├── db/                     # Database layer
│   ├── index.ts           # Database connection
│   └── schema.ts          # Drizzle ORM schema
├── lib/                    # Shared libraries
│   ├── jwt.ts             # JWT utilities
│   ├── password.ts        # Password hashing
│   └── s3.ts              # MinIO/S3 utilities
├── middleware/             # Middleware functions
│   ├── index.ts           # Barrel export
│   └── auth.ts            # Authentication middleware
├── modules/                # Feature modules
│   ├── index.ts           # Barrel export
│   ├── auth/              # Authentication module
│   │   └── index.ts       # Login, register, profile
│   ├── organizations/     # Organizations module
│   │   └── index.ts       # CRUD organizations
│   ├── financial-logs/    # Financial logs module
│   │   └── index.ts       # CRUD logs + attachments
│   └── dashboard/         # Dashboard module
│       └── index.ts       # Stats, summary, comparison
├── types/                  # TypeScript types
│   └── index.ts           # All type definitions
├── utils/                  # Utility functions
│   ├── index.ts           # Barrel export
│   ├── pagination.ts      # Pagination helpers
│   └── response.ts        # Response helpers
├── index.ts               # Main entry point
└── seed.ts                # Database seeder
```

## 📋 Prerequisites

- [Bun](https://bun.sh) v1.1+
- PostgreSQL 16+
- MinIO (for file storage)

## 🏃‍♂️ Getting Started

### 1. Install dependencies

```bash
bun install
```

### 2. Setup environment

```bash
cp .env.example .env
# Edit .env with your database and MinIO credentials
```

### 3. Start PostgreSQL & MinIO (using Docker)

```bash
docker-compose up -d
```

Or if using local PostgreSQL (brew):
```bash
# Make sure PostgreSQL is running
brew services start postgresql@16

# Create database
createdb uch_connection
```

### 4. Push database schema

```bash
bun run db:push
```

### 5. Seed initial data

```bash
bun run db:seed
```

### 6. Run development server

```bash
bun run dev
```

Server will start at `http://localhost:3000`

## 📚 API Documentation

See [API_DOCS.md](./API_DOCS.md) for complete API documentation with example requests and responses.

### Quick Overview

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | `/api/auth/*` | Login, register, profile |
| Organizations | `/api/organizations/*` | CRUD organizations |
| Financial Logs | `/api/logs/*` | CRUD logs + attachments |
| Dashboard | `/api/dashboard/*` | Stats, summary (Super Admin) |

## 🔐 Default Login Credentials

Password for all users: `password123`

| Email | Role | Organization |
|-------|------|--------------|
| admin@uch.ac.id | Super Admin | UCH Pusat |
| admin@ush.ac.id | Admin Lini | USH |
| staff@ush.ac.id | Staff | USH |
| admin@fastlab.ac.id | Admin Lini | Fastlab |
| staff@fastlab.ac.id | Staff | Fastlab |
| admin@hki.ac.id | Admin Lini | Sentra HKI |
| admin@pkm.ac.id | Admin Lini | PKM Center |

## 🔒 Role Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| SUPER_ADMIN | UCH Pusat Admin | Full access to all data |
| ADMIN_LINI | Organization Admin | Full access within organization |
| STAFF | Staff Member | Create/edit own logs (24h limit) |

## 📁 MinIO Storage Structure

Files are stored with the following path pattern:
```
artifacts/{org_slug}/{year}/{month}/{timestamp}_{filename}
```

Example: `artifacts/ush/2026/01/1705123456789_nota.jpg`

## 🔧 Available Scripts

```bash
bun run dev        # Start development server with watch
bun run start      # Start production server
bun run db:generate # Generate migrations
bun run db:migrate  # Run migrations
bun run db:push     # Push schema directly (dev)
bun run db:studio   # Open Drizzle Studio
bun run db:seed     # Seed initial data
```

## 📝 License

MIT
