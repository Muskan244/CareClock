import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth0";
import { insertTimeRecordSchema, insertLocationSettingsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Time tracking routes
  app.post('/api/clock-in', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check if user is already clocked in
      const activeRecord = await storage.getActiveTimeRecord(userId);
      if (activeRecord) {
        return res.status(400).json({ message: "Already clocked in" });
      }

      const clockInData = insertTimeRecordSchema.parse({
        userId,
        clockInTime: new Date(),
        clockInLatitude: req.body.latitude?.toString(),
        clockInLongitude: req.body.longitude?.toString(),
        clockInLocation: req.body.location,
        clockInNote: req.body.note,
        isActive: true,
      });

      const timeRecord = await storage.createTimeRecord(clockInData);
      res.json(timeRecord);
    } catch (error) {
      console.error("Error clocking in:", error);
      res.status(500).json({ message: "Failed to clock in" });
    }
  });

  app.post('/api/clock-out', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Find active time record
      const activeRecord = await storage.getActiveTimeRecord(userId);
      if (!activeRecord) {
        return res.status(400).json({ message: "No active clock-in found" });
      }

      const updatedRecord = await storage.updateTimeRecord(activeRecord.id, {
        clockOutTime: new Date(),
        clockOutLatitude: req.body.latitude?.toString(),
        clockOutLongitude: req.body.longitude?.toString(),
        clockOutLocation: req.body.location,
        clockOutNote: req.body.note,
        isActive: false,
      });

      res.json(updatedRecord);
    } catch (error) {
      console.error("Error clocking out:", error);
      res.status(500).json({ message: "Failed to clock out" });
    }
  });

  app.get('/api/active-record', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const activeRecord = await storage.getActiveTimeRecord(userId);
      res.json(activeRecord);
    } catch (error) {
      console.error("Error fetching active record:", error);
      res.status(500).json({ message: "Failed to fetch active record" });
    }
  });

  app.get('/api/time-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const records = await storage.getUserTimeRecords(userId, startDate, endDate);
      res.json(records);
    } catch (error) {
      console.error("Error fetching time records:", error);
      res.status(500).json({ message: "Failed to fetch time records" });
    }
  });

  // Manager routes
  app.get('/api/manager/active-staff', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'manager') {
        return res.status(403).json({ message: "Access denied" });
      }

      const activeStaff = await storage.getAllActiveTimeRecords();
      res.json(activeStaff);
    } catch (error) {
      console.error("Error fetching active staff:", error);
      res.status(500).json({ message: "Failed to fetch active staff" });
    }
  });

  app.get('/api/manager/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'manager') {
        return res.status(403).json({ message: "Access denied" });
      }

      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const [
        currentlyClocked,
        avgHours,
        dailyCheckins,
        yesterdayCheckins
      ] = await Promise.all([
        storage.getCurrentlyClockedInCount(),
        storage.getAverageHoursPerDay(today, today),
        storage.getDailyCheckinsCount(today),
        storage.getDailyCheckinsCount(yesterday)
      ]);

      res.json({
        currentlyClocked,
        avgHours: Math.round(avgHours * 10) / 10,
        dailyCheckins,
        yesterdayCheckins,
        compliance: 96 // Static for now, would calculate based on location data
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Location settings routes
  app.get('/api/location-settings', async (req, res) => {
    try {
      const settings = await storage.getLocationSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching location settings:", error);
      res.status(500).json({ message: "Failed to fetch location settings" });
    }
  });

  app.post('/api/location-settings', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'manager') {
        return res.status(403).json({ message: "Access denied" });
      }

      const settingsData = insertLocationSettingsSchema.parse(req.body);
      const settings = await storage.upsertLocationSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating location settings:", error);
      res.status(500).json({ message: "Failed to update location settings" });
    }
  });

  // Admin endpoint to update user role (for testing purposes)
  app.post('/api/update-user-role', isAuthenticated, async (req: any, res) => {
    try {
      const { role } = req.body;
      const userId = req.user.id;
      
      if (!role || !['worker', 'manager'].includes(role)) {
        return res.status(400).json({ message: "Valid role required (worker or manager)" });
      }

      const updatedUser = await storage.updateUser(userId, { role });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Location validation endpoint
  app.post('/api/validate-location', async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude required" });
      }

      const settings = await storage.getLocationSettings();
      if (!settings) {
        return res.status(500).json({ message: "Location settings not configured" });
      }

      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in kilometers
      const dLat = (parseFloat(latitude) - parseFloat(settings.latitude)) * Math.PI / 180;
      const dLon = (parseFloat(longitude) - parseFloat(settings.longitude)) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(parseFloat(settings.latitude) * Math.PI / 180) * 
        Math.cos(parseFloat(latitude) * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      const isWithinPerimeter = distance <= parseFloat(settings.perimeterRadius);

      res.json({
        isWithinPerimeter,
        distance: Math.round(distance * 10) / 10,
        perimeterRadius: parseFloat(settings.perimeterRadius)
      });
    } catch (error) {
      console.error("Error validating location:", error);
      res.status(500).json({ message: "Failed to validate location" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
