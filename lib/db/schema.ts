import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  role: text("role").notNull().default("client"), // admin | client
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp_ms",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp_ms",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const splats = sqliteTable("splats", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("other"), // real-estate | construction | business | home | scene | other
  status: text("status").notNull().default("ready"), // processing | ready | archived
  fileKey: text("file_key").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull().default(0),
  contentType: text("content_type").notNull().default("application/octet-stream"),
  thumbnailKey: text("thumbnail_key"),
  settingsJson: text("settings_json"),
  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const shareLinks = sqliteTable("share_links", {
  id: text("id").primaryKey(),
  splatId: text("splat_id")
    .notNull()
    .references(() => splats.id, { onDelete: "cascade" }),
  hash: text("hash").notNull().unique(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const mediaAssets = sqliteTable("media_assets", {
  id: text("id").primaryKey(),
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  kind: text("kind").notNull(), // video | image | splat
  fileKey: text("file_key").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull().default(0),
  contentType: text("content_type").notNull().default("application/octet-stream"),
  posterKey: text("poster_key"),
  splatId: text("splat_id").references(() => splats.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  splats: many(splats),
  shareLinks: many(shareLinks),
  mediaAssets: many(mediaAssets),
}));

export const splatRelations = relations(splats, ({ one, many }) => ({
  owner: one(user, {
    fields: [splats.ownerId],
    references: [user.id],
  }),
  shareLinks: many(shareLinks),
}));

export const shareLinkRelations = relations(shareLinks, ({ one }) => ({
  splat: one(splats, {
    fields: [shareLinks.splatId],
    references: [splats.id],
  }),
  creator: one(user, {
    fields: [shareLinks.createdBy],
    references: [user.id],
  }),
}));

export const mediaAssetRelations = relations(mediaAssets, ({ one }) => ({
  uploader: one(user, {
    fields: [mediaAssets.uploadedBy],
    references: [user.id],
  }),
  splat: one(splats, {
    fields: [mediaAssets.splatId],
    references: [splats.id],
  }),
}));
