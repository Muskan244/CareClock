# CareTime - Healthcare Staff Time Tracking

## Overview

CareTime is a web application designed for healthcare facilities to track staff attendance through location-based clock in/out functionality. The application provides two main user experiences: a worker interface for clocking in and out with location verification, and a manager dashboard for monitoring staff attendance and analyzing time tracking data. Built as a full-stack application with real-time location validation and comprehensive analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Routing**: wouter for client-side routing
- **State Management**: React Context for location management, TanStack Query for server state
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design

### Backend Architecture
- **Framework**: Express.js server with TypeScript
- **API Design**: RESTful endpoints with JSON responses
- **Authentication**: Replit Auth integration with OpenID Connect for user authentication
- **Session Management**: Express sessions with PostgreSQL session store
- **Database ORM**: Drizzle ORM for type-safe database operations

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless driver
- **Schema**: Users table with role-based access (manager/worker), time records for clock in/out tracking, location settings for perimeter configuration, and sessions table for authentication
- **Key Relationships**: Time records linked to users, location validation against configurable perimeter settings

### Location Services
- **Geolocation**: Browser Geolocation API for real-time position tracking
- **Perimeter Validation**: Server-side distance calculation to validate if users are within allowed radius
- **Location Context**: React context provider managing location permissions and validation state

### Authentication & Authorization
- **Authentication Provider**: Replit Auth with OpenID Connect
- **Session Management**: Secure HTTP-only cookies with PostgreSQL session storage
- **Role-based Access**: Manager and worker roles with different dashboard views and permissions
- **Security**: CSRF protection through session tokens and secure cookie configuration

### Data Architecture
- **Time Tracking**: Records store clock in/out times, locations, optional notes, and active status
- **Analytics**: Server-side aggregation for daily statistics, average hours, and staff monitoring
- **Real-time Updates**: TanStack Query for optimistic updates and cache invalidation

### Mobile Responsiveness
- **Design**: Mobile-first responsive design using Tailwind CSS breakpoints
- **PWA Ready**: Service worker configuration and manifest setup for progressive web app capabilities
- **Touch Optimization**: Mobile-optimized UI components and touch-friendly interactions

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18 with TypeScript, Vite for development and building
- **UI Components**: Radix UI primitives for accessible components, Lucide icons
- **Styling**: Tailwind CSS with PostCSS for processing

### Backend Dependencies
- **Server Framework**: Express.js with TypeScript support via tsx
- **Database**: Neon PostgreSQL serverless with connection pooling
- **ORM**: Drizzle ORM with Drizzle Kit for migrations and schema management

### Authentication Services
- **Replit Auth**: OpenID Connect integration for user authentication
- **Session Storage**: connect-pg-simple for PostgreSQL session persistence
- **Security**: Passport.js for authentication strategy management

### Development Tools
- **Build Tools**: ESBuild for server bundling, Vite for client development
- **Code Quality**: TypeScript for type safety, ESLint configuration
- **Database Tools**: Drizzle Kit for schema management and migrations

### Utility Libraries
- **Data Fetching**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod for validation
- **Date Handling**: date-fns for date manipulation and formatting
- **Utility**: clsx and class-variance-authority for conditional styling