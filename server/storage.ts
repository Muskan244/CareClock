import {
  users,
  timeRecords,
  locationSettings,
  type User,
  type UpsertUser,
  type TimeRecord,
  type InsertTimeRecord,
  type LocationSettings,
  type InsertLocationSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;
  
  // Time record operations
  createTimeRecord(record: InsertTimeRecord): Promise<TimeRecord>;
  updateTimeRecord(id: string, updates: Partial<InsertTimeRecord>): Promise<TimeRecord | undefined>;
  getActiveTimeRecord(userId: string): Promise<TimeRecord | undefined>;
  getUserTimeRecords(userId: string, startDate?: Date, endDate?: Date): Promise<TimeRecord[]>;
  getAllActiveTimeRecords(): Promise<(TimeRecord & { user: User })[]>;
  
  // Analytics operations
  getTotalHoursWorked(userId: string, startDate: Date, endDate: Date): Promise<number>;
  getAverageHoursPerDay(startDate: Date, endDate: Date): Promise<number>;
  getDailyCheckinsCount(date: Date): Promise<number>;
  getCurrentlyClockedInCount(): Promise<number>;
  
  // Location settings operations
  getLocationSettings(): Promise<LocationSettings | undefined>;
  upsertLocationSettings(settings: InsertLocationSettings): Promise<LocationSettings>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Time record operations
  async createTimeRecord(record: InsertTimeRecord): Promise<TimeRecord> {
    const [timeRecord] = await db
      .insert(timeRecords)
      .values(record)
      .returning();
    return timeRecord;
  }

  async updateTimeRecord(id: string, updates: Partial<InsertTimeRecord>): Promise<TimeRecord | undefined> {
    const [timeRecord] = await db
      .update(timeRecords)
      .set(updates)
      .where(eq(timeRecords.id, id))
      .returning();
    return timeRecord;
  }

  async getActiveTimeRecord(userId: string): Promise<TimeRecord | undefined> {
    const [record] = await db
      .select()
      .from(timeRecords)
      .where(and(
        eq(timeRecords.userId, userId),
        eq(timeRecords.isActive, true),
        isNull(timeRecords.clockOutTime)
      ))
      .orderBy(desc(timeRecords.clockInTime))
      .limit(1);
    return record;
  }

  async getUserTimeRecords(userId: string, startDate?: Date, endDate?: Date): Promise<TimeRecord[]> {
    const whereConditions = [eq(timeRecords.userId, userId)];
    
    if (startDate && endDate) {
      whereConditions.push(
        gte(timeRecords.clockInTime, startDate),
        lte(timeRecords.clockInTime, endDate)
      );
    }

    return await db
      .select()
      .from(timeRecords)
      .where(and(...whereConditions))
      .orderBy(desc(timeRecords.clockInTime));
  }

  async getAllActiveTimeRecords(): Promise<(TimeRecord & { user: User })[]> {
    return await db
      .select({
        id: timeRecords.id,
        userId: timeRecords.userId,
        clockInTime: timeRecords.clockInTime,
        clockOutTime: timeRecords.clockOutTime,
        clockInLatitude: timeRecords.clockInLatitude,
        clockInLongitude: timeRecords.clockInLongitude,
        clockOutLatitude: timeRecords.clockOutLatitude,
        clockOutLongitude: timeRecords.clockOutLongitude,
        clockInLocation: timeRecords.clockInLocation,
        clockOutLocation: timeRecords.clockOutLocation,
        clockInNote: timeRecords.clockInNote,
        clockOutNote: timeRecords.clockOutNote,
        isActive: timeRecords.isActive,
        createdAt: timeRecords.createdAt,
        user: users,
      })
      .from(timeRecords)
      .innerJoin(users, eq(timeRecords.userId, users.id))
      .where(and(
        eq(timeRecords.isActive, true),
        isNull(timeRecords.clockOutTime)
      ))
      .orderBy(desc(timeRecords.clockInTime));
  }

  // Analytics operations
  async getTotalHoursWorked(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await db
      .select({
        totalHours: sql<number>`
          COALESCE(
            SUM(
              EXTRACT(EPOCH FROM (
                COALESCE(clock_out_time, NOW()) - clock_in_time
              )) / 3600
            ), 
            0
          )
        `
      })
      .from(timeRecords)
      .where(and(
        eq(timeRecords.userId, userId),
        gte(timeRecords.clockInTime, startDate),
        lte(timeRecords.clockInTime, endDate)
      ));

    return result[0]?.totalHours || 0;
  }

  async getAverageHoursPerDay(startDate: Date, endDate: Date): Promise<number> {
    const result = await db
      .select({
        avgHours: sql<number>`
          COALESCE(
            AVG(
              EXTRACT(EPOCH FROM (
                COALESCE(clock_out_time, NOW()) - clock_in_time
              )) / 3600
            ), 
            0
          )
        `
      })
      .from(timeRecords)
      .where(and(
        gte(timeRecords.clockInTime, startDate),
        lte(timeRecords.clockInTime, endDate)
      ));

    return result[0]?.avgHours || 0;
  }

  async getDailyCheckinsCount(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(timeRecords)
      .where(and(
        gte(timeRecords.clockInTime, startOfDay),
        lte(timeRecords.clockInTime, endOfDay)
      ));

    return result[0]?.count || 0;
  }

  async getCurrentlyClockedInCount(): Promise<number> {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(timeRecords)
      .where(and(
        eq(timeRecords.isActive, true),
        isNull(timeRecords.clockOutTime)
      ));

    return result[0]?.count || 0;
  }

  // Location settings operations
  async getLocationSettings(): Promise<LocationSettings | undefined> {
    const [settings] = await db
      .select()
      .from(locationSettings)
      .orderBy(desc(locationSettings.createdAt))
      .limit(1);
    return settings;
  }

  async upsertLocationSettings(settings: InsertLocationSettings): Promise<LocationSettings> {
    // For simplicity, we'll delete existing and insert new
    await db.delete(locationSettings);
    const [newSettings] = await db
      .insert(locationSettings)
      .values(settings)
      .returning();
    return newSettings;
  }
}

export const storage = new DatabaseStorage();
