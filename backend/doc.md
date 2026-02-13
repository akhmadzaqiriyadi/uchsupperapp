# Dokumen Spesifikasi: UCH Connection (Digital Ledger)

## 1. Product Requirement Document (PRD)

### Profil Entitas

Sistem ini memfasilitasi 5 entitas utama dengan hierarki sebagai berikut:

1. **UCH (Pusat):** Manajemen pusat Bidang 4 (Wakil Rektor 4). Bertugas sebagai pengawas (Overseer).
2. **USH (University Software House):** Lini pengembangan software (Software House).
3. **Fastlab:** Lini laboratorium inovasi dan riset teknis.
4. **Sentra HKI:** Lini pengelolaan Kekayaan Intelektual.
5. **PKM Center:** Lini pembinaan kreativitas mahasiswa.

### Tujuan Produk

Menghilangkan hambatan birokrasi dalam pelaporan keuangan harian dengan sistem **Instant Logging**. Data yang diinput oleh lini operasional (USH, Fastlab, dll) langsung tersedia secara transparan untuk UCH Pusat tanpa proses persetujuan (approval) di dalam aplikasi.

### Fitur Utama

- **Multi-Tenant Isolation:** Setiap lini hanya bisa melihat datanya sendiri.
- **UCH Master View:** UCH Pusat memiliki akses untuk melihat seluruh data dari semua lini.
- **Mandatory S3 Evidence:** Kewajiban melampirkan foto nota yang disimpan di MinIO S3.
- **Digital Audit Trail:** Pencatatan otomatis siapa yang menginput dan kapan.

## 2. Technical Requirement Document (TRD)

### Arsitektur Teknologi

- **Runtime:** Bun (V1.1+)
- **Backend:** ElysiaJS (E2E Type-safety)
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Storage:** MinIO S3 (Bucket: `uch-connection`)

### Skema Penyimpanan MinIO

Setiap file akan disimpan dengan struktur:
`artifacts/{org_slug}/{year}/{month}/{timestamp}_{filename}`

## 3. Skema Database (Drizzle ORM)

```
import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  timestamp,
  boolean,
  pgEnum,
  index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// DEFINISI ENUM
export const logTypeEnum = pgEnum('log_type', ['INCOME', 'EXPENSE']);
export const userRoleEnum = pgEnum('user_role', ['SUPER_ADMIN', 'ADMIN_LINI', 'STAFF']);

// 1. ORGANIZATIONS (Master Entitas: UCH, USH, Fastlab, HKI, PKM Center)
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(), // 'uch', 'ush', 'fastlab', dll
  isCenter: boolean('is_center').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. USERS
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').default('STAFF').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. FINANCIAL LOGS (Header Utama Pencatatan)
export const financialLogs = pgTable('financial_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  type: logTypeEnum('type').notNull(),
  description: text('description').notNull(),
  totalAmount: numeric('total_amount', { precision: 20, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    orgIdx: index('org_idx').on(table.organizationId),
    dateIdx: index('date_idx').on(table.createdAt),
  };
});

// 4. LOG ITEMS (Rincian per item dalam satu nota - Opsional)
export const logItems = pgTable('log_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  logId: uuid('log_id')
    .references(() => financialLogs.id, { onDelete: 'cascade' })
    .notNull(),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).default('1').notNull(),
  unitPrice: numeric('unit_price', { precision: 20, scale: 2 }).notNull(),
  subTotal: numeric('sub_total', { precision: 20, scale: 2 }).notNull(),
});

// 5. ATTACHMENTS (Referensi Bukti Nota di MinIO S3)
export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  logId: uuid('log_id')
    .references(() => financialLogs.id, { onDelete: 'cascade' })
    .notNull(),
  s3Key: text('s3_key').notNull(), // Path file di MinIO
  fileName: varchar('file_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// RELASI DRIIZLE
export const financialLogsRelations = relations(financialLogs, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [financialLogs.organizationId],
    references: [organizations.id],
  }),
  items: many(logItems),
  attachments: many(attachments),
}));

```

## 4. User Flow (Alur Pengguna)

### A. Alur Pencatatan (Staff USH, Fastlab, HKI, PKM Center)

1. **Login:** Staff masuk menggunakan kredensial organisasi masing-masing.
2. **Tambah Log:** Staff memilih tipe (Pemasukan/Pengeluaran).
3. **Input Data:** Mengisi deskripsi dan total nominal uang.
4. **Evidence Upload:** Staff memotret nota fisik atau mengunggah file bukti kuitansi.
5. **Detail Items (Opsional):** Jika diperlukan, staff merinci item barang satu per satu.
6. **Simpan:** Sistem mengunggah foto ke MinIO, menyimpan data ke PostgreSQL, dan catatan langsung tampil di feed histori tanpa perlu approval.

### B. Alur Pengawasan (Super Admin UCH Pusat)

1. **Login:** Admin UCH masuk ke dashboard pusat.
2. **Monitoring Feed:** Melihat "Global Activity Feed" yang berisi log terbaru dari seluruh lini secara real-time.
3. **Audit Bukti:** Klik pada salah satu transaksi -> Melihat rincian barang -> Melihat foto nota asli dari MinIO S3 (via Pre-signed URL).
4. **Analisis:** Melihat perbandingan frekuensi aktivitas pencatatan antar lini untuk memastikan semua unit aktif.

## 5. POV (Point of View) Analysis

### POV 1: Staff Lini (The Reporter)

- **Kebutuhan:** Kecepatan dan kemudahan penggunaan.
- **Perspektif:** "Saya ingin melaporkan pengeluaran belanja komponen (Fastlab) atau langganan server (USH) secepat mungkin agar nota fisik tidak hilang dan tugas administratif saya selesai."
- **Value:** Aplikasi ini mengurangi beban administratif karena pelaporan dilakukan langsung di tempat kejadian (Point-of-Purchase).

### POV 2: Admin Lini (The Unit Manager)

- **Kebutuhan:** Transparansi internal unit.
- **Perspektif:** "Saya ingin melihat semua catatan yang dibuat oleh staf saya dalam satu bulan terakhir untuk memastikan operasional unit terkendali."
- **Value:** Memiliki arsip digital yang rapi untuk setiap pengeluaran unit tanpa harus mengumpulkan nota fisik di laci kantor.

### POV 3: Super Admin UCH (The Overseer)

- **Kebutuhan:** Akuntabilitas global dan pengawasan pasif.
- **Perspektif:** "Saya perlu memastikan setiap lini (USH, Fastlab, HKI, PKM) aktif bergerak dan setiap uang yang masuk/keluar memiliki bukti fisik yang sah tanpa harus menanyakan laporan manual setiap minggu."
- **Value:** Akses data real-time mempermudah pelaporan ke Wakil Rektor 4 dan meningkatkan integritas manajemen Bidang 4.

## 6. Matriks Hak Akses

| Fitur | Staff Lini | Admin Lini | UCH Pusat (Super Admin) |
| --- | --- | --- | --- |
| Input Log & Foto Nota | ✅ | ✅ | ❌ |
| Lihat Histori Internal | ✅ | ✅ | ✅ |
| Lihat Histori Lini Lain | ❌ | ❌ | ✅ |
| Hapus/Edit Data Sendiri | ✅ (Limited Time) | ✅ | ✅ |
| Dashboard Perbandingan | ❌ | ❌ | ✅ |