import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("worker"), // 'manager' or 'worker'
  department: varchar("department"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Location perimeter settings
export const locationSettings = pgTable("location_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hospitalName: varchar("hospital_name").notNull(),
  hospitalAddress: text("hospital_address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  perimeterRadius: decimal("perimeter_radius", { precision: 5, scale: 2 }).notNull().default("2.0"), // in kilometers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clock in/out records
export const timeRecords = pgTable("time_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  clockInTime: timestamp("clock_in_time").notNull(),
  clockOutTime: timestamp("clock_out_time"),
  clockInLatitude: decimal("clock_in_latitude", { precision: 10, scale: 8 }),
  clockInLongitude: decimal("clock_in_longitude", { precision: 11, scale: 8 }),
  clockOutLatitude: decimal("clock_out_latitude", { precision: 10, scale: 8 }),
  clockOutLongitude: decimal("clock_out_longitude", { precision: 11, scale: 8 }),
  clockInLocation: varchar("clock_in_location"),
  clockOutLocation: varchar("clock_out_location"),
  clockInNote: text("clock_in_note"),
  clockOutNote: text("clock_out_note"),
  isActive: boolean("is_active").default(true), // true if currently clocked in
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  timeRecords: many(timeRecords),
}));

export const timeRecordsRelations = relations(timeRecords, ({ one }) => ({
  user: one(users, {
    fields: [timeRecords.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimeRecordSchema = createInsertSchema(timeRecords).omit({
  id: true,
  createdAt: true,
});

export const insertLocationSettingsSchema = createInsertSchema(locationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type TimeRecord = typeof timeRecords.$inferSelect;
export type InsertTimeRecord = z.infer<typeof insertTimeRecordSchema>;
export type LocationSettings = typeof locationSettings.$inferSelect;
export type InsertLocationSettings = z.infer<typeof insertLocationSettingsSchema>;
