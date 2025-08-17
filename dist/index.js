var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertLocationSettingsSchema: () => insertLocationSettingsSchema,
  insertTimeRecordSchema: () => insertTimeRecordSchema,
  insertUserSchema: () => insertUserSchema,
  locationSettings: () => locationSettings,
  sessions: () => sessions,
  timeRecords: () => timeRecords,
  timeRecordsRelations: () => timeRecordsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("worker"),
  // 'manager' or 'worker'
  department: varchar("department"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var locationSettings = pgTable("location_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hospitalName: varchar("hospital_name").notNull(),
  hospitalAddress: text("hospital_address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  perimeterRadius: decimal("perimeter_radius", { precision: 5, scale: 2 }).notNull().default("2.0"),
  // in kilometers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var timeRecords = pgTable("time_records", {
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
  isActive: boolean("is_active").default(true),
  // true if currently clocked in
  createdAt: timestamp("created_at").defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  timeRecords: many(timeRecords)
}));
var timeRecordsRelations = relations(timeRecords, ({ one }) => ({
  user: one(users, {
    fields: [timeRecords.userId],
    references: [users.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertTimeRecordSchema = createInsertSchema(timeRecords).omit({
  id: true,
  createdAt: true
});
var insertLocationSettingsSchema = createInsertSchema(locationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import dotenv from "dotenv";
dotenv.config();
neonConfig.webSocketConstructor = ws;
var databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "NEON_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: databaseUrl });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, and, isNull, gte, lte, sql as sql2 } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async updateUser(id, updates) {
    const [user] = await db.update(users).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return user;
  }
  // Time record operations
  async createTimeRecord(record) {
    const [timeRecord] = await db.insert(timeRecords).values(record).returning();
    return timeRecord;
  }
  async updateTimeRecord(id, updates) {
    const [timeRecord] = await db.update(timeRecords).set(updates).where(eq(timeRecords.id, id)).returning();
    return timeRecord;
  }
  async getActiveTimeRecord(userId) {
    const [record] = await db.select().from(timeRecords).where(and(
      eq(timeRecords.userId, userId),
      eq(timeRecords.isActive, true),
      isNull(timeRecords.clockOutTime)
    )).orderBy(desc(timeRecords.clockInTime)).limit(1);
    return record;
  }
  async getUserTimeRecords(userId, startDate, endDate) {
    const whereConditions = [eq(timeRecords.userId, userId)];
    if (startDate && endDate) {
      whereConditions.push(
        gte(timeRecords.clockInTime, startDate),
        lte(timeRecords.clockInTime, endDate)
      );
    }
    return await db.select().from(timeRecords).where(and(...whereConditions)).orderBy(desc(timeRecords.clockInTime));
  }
  async getAllActiveTimeRecords() {
    return await db.select({
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
      user: users
    }).from(timeRecords).innerJoin(users, eq(timeRecords.userId, users.id)).where(and(
      eq(timeRecords.isActive, true),
      isNull(timeRecords.clockOutTime)
    )).orderBy(desc(timeRecords.clockInTime));
  }
  // Analytics operations
  async getTotalHoursWorked(userId, startDate, endDate) {
    const result = await db.select({
      totalHours: sql2`
          COALESCE(
            SUM(
              EXTRACT(EPOCH FROM (
                COALESCE(clock_out_time, NOW()) - clock_in_time
              )) / 3600
            ), 
            0
          )
        `
    }).from(timeRecords).where(and(
      eq(timeRecords.userId, userId),
      gte(timeRecords.clockInTime, startDate),
      lte(timeRecords.clockInTime, endDate)
    ));
    return result[0]?.totalHours || 0;
  }
  async getAverageHoursPerDay(startDate, endDate) {
    const result = await db.select({
      avgHours: sql2`
          COALESCE(
            AVG(
              EXTRACT(EPOCH FROM (
                COALESCE(clock_out_time, NOW()) - clock_in_time
              )) / 3600
            ), 
            0
          )
        `
    }).from(timeRecords).where(and(
      gte(timeRecords.clockInTime, startDate),
      lte(timeRecords.clockInTime, endDate)
    ));
    return result[0]?.avgHours || 0;
  }
  async getDailyCheckinsCount(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const result = await db.select({
      count: sql2`COUNT(*)`
    }).from(timeRecords).where(and(
      gte(timeRecords.clockInTime, startOfDay),
      lte(timeRecords.clockInTime, endOfDay)
    ));
    return result[0]?.count || 0;
  }
  async getCurrentlyClockedInCount() {
    const result = await db.select({
      count: sql2`COUNT(*)`
    }).from(timeRecords).where(and(
      eq(timeRecords.isActive, true),
      isNull(timeRecords.clockOutTime)
    ));
    return result[0]?.count || 0;
  }
  // Location settings operations
  async getLocationSettings() {
    const [settings] = await db.select().from(locationSettings).orderBy(desc(locationSettings.createdAt)).limit(1);
    return settings;
  }
  async upsertLocationSettings(settings) {
    await db.delete(locationSettings);
    const [newSettings] = await db.insert(locationSettings).values(settings).returning();
    return newSettings;
  }
};
var storage = new DatabaseStorage();

// server/auth0.ts
import passport from "passport";
import { Strategy as Auth0Strategy } from "passport-auth0";
import session from "express-session";
import connectPg from "connect-pg-simple";
import dotenv2 from "dotenv";
dotenv2.config();
if (!process.env.AUTH0_DOMAIN) {
  throw new Error("Environment variable AUTH0_DOMAIN not provided");
}
if (!process.env.AUTH0_CLIENT_ID) {
  throw new Error("Environment variable AUTH0_CLIENT_ID not provided");
}
if (!process.env.AUTH0_CLIENT_SECRET) {
  throw new Error("Environment variable AUTH0_CLIENT_SECRET not provided");
}
if (!process.env.SESSION_SECRET) {
  throw new Error("Environment variable SESSION_SECRET not provided");
}
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const databaseUrl2 = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  const sessionStore = new pgStore({
    conString: databaseUrl2,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl
    }
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const strategy = new Auth0Strategy(
    {
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      callbackURL: process.env.AUTH0_CALLBACK_URL || "/api/callback"
    },
    async (accessToken, refreshToken, extraParams, profile, done) => {
      try {
        const userData = {
          id: profile.id,
          email: profile.emails?.[0]?.value || profile.email,
          firstName: profile.name?.givenName || profile.given_name || "",
          lastName: profile.name?.familyName || profile.family_name || "",
          profileImageUrl: profile.photos?.[0]?.value || profile.picture || ""
        };
        await storage.upsertUser(userData);
        return done(null, {
          ...userData,
          accessToken,
          refreshToken
        });
      } catch (error) {
        return done(error);
      }
    }
  );
  passport.use(strategy);
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
  app2.get("/api/login", passport.authenticate("auth0", {
    scope: "openid email profile"
  }));
  app2.get(
    "/api/callback",
    passport.authenticate("auth0", {
      failureRedirect: "/login-error"
    }),
    (req, res) => {
      res.redirect("/");
    }
  );
  app2.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      const returnTo = encodeURIComponent(`${req.protocol}://${req.get("host")}/`);
      const logoutURL = `https://${process.env.AUTH0_DOMAIN}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${returnTo}`;
      res.redirect(logoutURL);
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// server/routes.ts
async function registerRoutes(app2) {
  await setupAuth(app2);
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/clock-in", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const activeRecord = await storage.getActiveTimeRecord(userId);
      if (activeRecord) {
        return res.status(400).json({ message: "Already clocked in" });
      }
      const clockInData = insertTimeRecordSchema.parse({
        userId,
        clockInTime: /* @__PURE__ */ new Date(),
        clockInLatitude: req.body.latitude?.toString(),
        clockInLongitude: req.body.longitude?.toString(),
        clockInLocation: req.body.location,
        clockInNote: req.body.note,
        isActive: true
      });
      const timeRecord = await storage.createTimeRecord(clockInData);
      res.json(timeRecord);
    } catch (error) {
      console.error("Error clocking in:", error);
      res.status(500).json({ message: "Failed to clock in" });
    }
  });
  app2.post("/api/clock-out", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const activeRecord = await storage.getActiveTimeRecord(userId);
      if (!activeRecord) {
        return res.status(400).json({ message: "No active clock-in found" });
      }
      const updatedRecord = await storage.updateTimeRecord(activeRecord.id, {
        clockOutTime: /* @__PURE__ */ new Date(),
        clockOutLatitude: req.body.latitude?.toString(),
        clockOutLongitude: req.body.longitude?.toString(),
        clockOutLocation: req.body.location,
        clockOutNote: req.body.note,
        isActive: false
      });
      res.json(updatedRecord);
    } catch (error) {
      console.error("Error clocking out:", error);
      res.status(500).json({ message: "Failed to clock out" });
    }
  });
  app2.get("/api/active-record", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const activeRecord = await storage.getActiveTimeRecord(userId);
      res.json(activeRecord);
    } catch (error) {
      console.error("Error fetching active record:", error);
      res.status(500).json({ message: "Failed to fetch active record" });
    }
  });
  app2.get("/api/time-records", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const startDate = req.query.startDate ? new Date(req.query.startDate) : void 0;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : void 0;
      const records = await storage.getUserTimeRecords(userId, startDate, endDate);
      res.json(records);
    } catch (error) {
      console.error("Error fetching time records:", error);
      res.status(500).json({ message: "Failed to fetch time records" });
    }
  });
  app2.get("/api/manager/active-staff", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== "manager") {
        return res.status(403).json({ message: "Access denied" });
      }
      const activeStaff = await storage.getAllActiveTimeRecords();
      res.json(activeStaff);
    } catch (error) {
      console.error("Error fetching active staff:", error);
      res.status(500).json({ message: "Failed to fetch active staff" });
    }
  });
  app2.get("/api/manager/analytics", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== "manager") {
        return res.status(403).json({ message: "Access denied" });
      }
      const today = /* @__PURE__ */ new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1e3);
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1e3);
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
        compliance: 96
        // Static for now, would calculate based on location data
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  app2.get("/api/location-settings", async (req, res) => {
    try {
      const settings = await storage.getLocationSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching location settings:", error);
      res.status(500).json({ message: "Failed to fetch location settings" });
    }
  });
  app2.post("/api/location-settings", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== "manager") {
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
  app2.post("/api/update-user-role", isAuthenticated, async (req, res) => {
    try {
      const { role } = req.body;
      const userId = req.user.id;
      if (!role || !["worker", "manager"].includes(role)) {
        return res.status(400).json({ message: "Valid role required (worker or manager)" });
      }
      const updatedUser = await storage.updateUser(userId, { role });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  app2.post("/api/validate-location", async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude required" });
      }
      const settings = await storage.getLocationSettings();
      if (!settings) {
        return res.status(500).json({ message: "Location settings not configured" });
      }
      const R = 6371;
      const dLat = (parseFloat(latitude) - parseFloat(settings.latitude)) * Math.PI / 180;
      const dLon = (parseFloat(longitude) - parseFloat(settings.longitude)) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(parseFloat(settings.latitude) * Math.PI / 180) * Math.cos(parseFloat(latitude) * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import dotenv3 from "dotenv";
dotenv3.config();
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  const maxPort = port + 10;
  const startServer = (portToTry) => {
    if (portToTry > maxPort) {
      log(`Could not find an available port between ${port} and ${maxPort}`);
      process.exit(1);
    }
    const serverInstance = server.listen(portToTry, "127.0.0.1", () => {
      log(`Server is running on http://127.0.0.1:${portToTry}`);
    });
    serverInstance.on("error", (err) => {
      if (err.code === "EADDRINUSE" || err.code === "ENOTSUP") {
        log(`Port ${portToTry} is in use, trying ${portToTry + 1}...`);
        serverInstance.close(() => {
          startServer(portToTry + 1);
        });
      } else {
        log(`Server error: ${err.message}`);
        process.exit(1);
      }
    });
  };
  startServer(port);
})();
