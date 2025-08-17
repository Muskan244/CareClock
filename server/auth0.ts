import passport from "passport";
import { Strategy as Auth0Strategy } from "passport-auth0";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import dotenv from "dotenv";
dotenv.config();

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

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  const sessionStore = new pgStore({
    conString: databaseUrl,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth0 Strategy
  const strategy = new Auth0Strategy(
    {
      domain: process.env.AUTH0_DOMAIN!,
      clientID: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      callbackURL: process.env.AUTH0_CALLBACK_URL || "/api/callback",
    },
    async (accessToken: string, refreshToken: string, extraParams: any, profile: any, done: any) => {
      try {
        // Extract user info from Auth0 profile
        const userData = {
          id: profile.id,
          email: profile.emails?.[0]?.value || profile.email,
          firstName: profile.name?.givenName || profile.given_name || '',
          lastName: profile.name?.familyName || profile.family_name || '',
          profileImageUrl: profile.photos?.[0]?.value || profile.picture || '',
        };

        // Upsert user in database
        await storage.upsertUser(userData);
        
        // Return user profile for session
        return done(null, {
          ...userData,
          accessToken,
          refreshToken,
        });
      } catch (error) {
        return done(error);
      }
    }
  );

  passport.use(strategy);

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  // Auth routes
  app.get("/api/login", passport.authenticate("auth0", {
    scope: "openid email profile"
  }));

  app.get("/api/callback", 
    passport.authenticate("auth0", {
      failureRedirect: "/login-error"
    }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      
      const returnTo = encodeURIComponent(`${req.protocol}://${req.get('host')}/`);
      const logoutURL = `https://${process.env.AUTH0_DOMAIN}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${returnTo}`;
      
      res.redirect(logoutURL);
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};