# CareClock - Healthcare Staff Time Tracking

## Overview

CareClock is a web application designed for healthcare facilities to track staff attendance through location-based clock in/out functionality. The application provides two main user experiences: a worker interface for clocking in and out with location verification, and a manager dashboard for monitoring staff attendance and analyzing time tracking data. Built as a full-stack application with real-time location validation and comprehensive analytics.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Routing**: router for client-side routing
- **State Management**: React Context for location management, TanStack Query for server state
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design

### Backend Architecture
- **Framework**: Express.js server with TypeScript
- **API Design**: RESTful endpoints with JSON responses
- **Authentication**: Auth0 integration for user authentication
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
- **Authentication Provider**: Auth0
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
- **Auth0**: user authentication
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

## 🚀 Getting Started

### Prerequisites
- Express.js and npm/yarn
- PostgreSQL database
- Auth0 account and application

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/Muskan244/CareClock.git]
   cd CareClock
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   
   # Auth0
   SESSION_SECRET=your_auth0_secret
   AUTH0_DOMAIN=your_auth0_domain
   AUTH0_CLIENT_ID=your_auth0_client_id
   AUTH0_CLIENT_SECRET=your_auth0_client_secret
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser**
