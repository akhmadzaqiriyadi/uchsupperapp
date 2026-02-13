import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  timestamp,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// DEFINISI ENUM
export const logTypeEnum = pgEnum("log_type", ["INCOME", "EXPENSE"]);
export const userRoleEnum = pgEnum("user_role", [
  "SUPER_ADMIN",
  "ADMIN_LINI",
  "STAFF",
]);

// 1. ORGANIZATIONS (Master Entitas: UCH, USH, Fastlab, HKI, PKM Center)
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(), // 'uch', 'ush', 'fastlab', dll
  isCenter: boolean("is_center").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 100 }),
  website: varchar("website", { length: 100 }),
  logo: text("logo"),
});

// 2. USERS
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("STAFF").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. FINANCIAL LOGS (Header Utama Pencatatan)
export const financialLogs = pgTable(
  "financial_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    type: logTypeEnum("type").notNull(),
    description: text("description").notNull(),
    totalAmount: numeric("total_amount", { precision: 20, scale: 2 }).notNull(),
    transactionDate: timestamp("transaction_date").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("org_idx").on(table.organizationId),
    dateIdx: index("date_idx").on(table.createdAt),
  })
);

// 4. LOG ITEMS (Rincian per item dalam satu nota - Opsional)
export const logItems = pgTable("log_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  logId: uuid("log_id")
    .references(() => financialLogs.id, { onDelete: "cascade" })
    .notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 })
    .default("1")
    .notNull(),
  unitPrice: numeric("unit_price", { precision: 20, scale: 2 }).notNull(),
  subTotal: numeric("sub_total", { precision: 20, scale: 2 }).notNull(),
});

// 5. ATTACHMENTS (Referensi Bukti Nota di MinIO S3)
export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  logId: uuid("log_id")
    .references(() => financialLogs.id, { onDelete: "cascade" })
    .notNull(),
  s3Key: text("s3_key").notNull(), // Path file di MinIO
  fileName: varchar("file_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// RELASI DRIZZLE
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  financialLogs: many(financialLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  financialLogs: many(financialLogs),
}));

export const financialLogsRelations = relations(
  financialLogs,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [financialLogs.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [financialLogs.userId],
      references: [users.id],
    }),
    items: many(logItems),
    attachments: many(attachments),
  })
);

export const logItemsRelations = relations(logItems, ({ one }) => ({
  log: one(financialLogs, {
    fields: [logItems.logId],
    references: [financialLogs.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  log: one(financialLogs, {
    fields: [attachments.logId],
    references: [financialLogs.id],
  }),
}));

// Export types
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type FinancialLog = typeof financialLogs.$inferSelect;
export type NewFinancialLog = typeof financialLogs.$inferInsert;
export type LogItem = typeof logItems.$inferSelect;
export type NewLogItem = typeof logItems.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
