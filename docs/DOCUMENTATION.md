# Participium - Project Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Backend API](#backend-api)
6. [Frontend Web](#frontend-web)
7. [Database](#database)
8. [Shared Packages](#shared-packages)
9. [Setup and Configuration](#setup-and-configuration)
10. [Available Commands](#available-commands)

---

## Overview

**Participium** is a web platform for managing civic participation. The project uses a monorepo architecture based on Turborepo, with a NestJS backend and React/Vite frontend.

### Main Features

- Cookie-based authentication and session management
- Role and permission system
- Municipal user management
- Modern dashboard interface with reusable UI components
- RESTful API with Swagger documentation

---

## Architecture

### Monorepo Structure

The project uses **Turborepo** to manage a monorepo workspace with:

- **2 applications** (`apps/`): Backend API and Web frontend
- **3 shared packages** (`packages/`): Common entities, ESLint and Jest configurations

### Architectural Patterns

- **Backend**: NestJS with modular pattern (controllers, services, modules)
- **Frontend**: React with routing, context API, custom hooks
- **Database**: PostgreSQL with TypeORM and PostGIS
- **Authentication**: Session-based with Passport.js (Local Strategy)

---

## Technology Stack

### Backend

| Technology | Version | Purpose              |
| ---------- | ------- | -------------------- |
| NestJS     | ^11.0.0 | Main framework       |
| TypeORM    | ^0.3.27 | Database ORM         |
| PostgreSQL | 18      | Relational database  |
| PostGIS    | 3.6     | Geographic extension |
| Passport   | ^0.7.0  | Authentication       |
| Swagger    | ^11.2.1 | API documentation    |
| Jest       | ^29.7.0 | Testing              |

### Frontend

| Technology     | Version | Purpose                  |
| -------------- | ------- | ------------------------ |
| React          | ^18.2.0 | UI framework             |
| Vite           | ^5.1.4  | Build tool               |
| React Router   | ^7.1.3  | Routing                  |
| Tailwind CSS   | ^4.1.16 | Styling                  |
| Radix UI       | various | Accessible UI components |
| TanStack Query | ^5.90.7 | Data fetching            |
| Jotai          | ^2.15.1 | State management         |

### DevOps & Tools

- **Package Manager**: pnpm ^8.15.5
- **Build System**: Turborepo ^2.6.0
- **Container**: Docker & Docker Compose
- **Node**: >=18

---

## Project Structure

```
participium/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/        # Functional modules
│   │   │   │   ├── auth/       # Authentication
│   │   │   │   ├── roles/      # Role management
│   │   │   │   └── users/      # User management
│   │   │   ├── providers/
│   │   │   │   └── database/   # DB configuration
│   │   │   ├── config/         # App configurations
│   │   │   └── common/         # Types and utilities
│   │   ├── test/               # E2E tests
│   │   └── compose.yml         # Docker PostgreSQL
│   │
│   └── web/                    # React Frontend
│       ├── src/
│       │   ├── pages/          # Route pages
│       │   │   ├── auth/       # Login/Registration
│       │   │   ├── home/       # Homepage
│       │   │   ├── map/        # Map
│       │   │   └── users-municipality/ # User management
│       │   ├── components/     # React components
│       │   ├── contexts/       # Context providers
│       │   ├── hooks/          # Custom hooks
│       │   ├── layouts/        # Layout templates
│       │   └── api/            # API client
│       └── public/             # Static assets
│
├── packages/
│   ├── api/                    # Shared entities and DTOs
│   │   └── src/
│   │       ├── entities/       # TypeORM entities
│   │       └── dto/            # Data Transfer Objects
│   ├── eslint-config/          # ESLint configurations
│   ├── jest-config/            # Jest configurations
│   └── typescript-config/      # TypeScript configurations
│
├── package.json                # Root workspace config
├── turbo.json                  # Turborepo config
└── pnpm-workspace.yaml         # pnpm workspace config
```

---

## Backend API

### Ports and URLs

- **Port**: 5000 (default)
- **Base URL**: http://localhost:5000/api
- **Swagger UI**: http://localhost:5000/api (interactive documentation)

### Main Modules

#### Auth Module

**Endpoint**: `/auth`

| Method | Route       | Description                           |
| ------ | ----------- | ------------------------------------- |
| POST   | `/login`    | User login with username and password |
| POST   | `/register` | New user registration                 |
| POST   | `/logout`   | Logout and session invalidation       |
| POST   | `/refresh`  | Session refresh                       |

**Features**:

- Authentication with Passport Local Strategy
- Session management with HTTP-only cookies
- Guards: `LocalAuthGuard`, `SessionGuard`, `RolesGuard`

#### Users Module

**Endpoint**: `/users`

| Method | Route                    | Description           |
| ------ | ------------------------ | --------------------- |
| GET    | `/municipality`          | List municipal users  |
| GET    | `/municipality/user/:id` | User details          |
| POST   | `/municipality`          | Create municipal user |
| POST   | `/municipality/user/:id` | Update user           |
| DELETE | `/municipality/user/:id` | Delete user           |

**Functionality**:

- Complete municipal user management
- Validation with class-validator
- Relations with roles and accounts

#### Roles Module

**Endpoint**: `/roles`

| Method | Route | Description                  |
| ------ | ----- | ---------------------------- |
| GET    | `/`   | Retrieve all available roles |

#### Reports Module

**Endpoint**: `/reports`

| Method | Route     | Description                             |
| ------ | --------- | --------------------------------------- |
| POST   | `/`       | Create a new report with geolocation    |
| GET    | `/`       | Get all reports with optional filters   |
| GET    | `/nearby` | Find nearby reports ordered by distance |
| GET    | `/:id`    | Get a specific report by ID             |
| PATCH  | `/:id`    | Update a report (Admin/Operator only)   |
| DELETE | `/:id`    | Delete a report (Admin only)            |

**Features**:

- Geospatial queries with PostGIS
- Location-based filtering (bounding box, radius search)
- Distance calculations with nearby reports
- Support for OpenStreetMap coordinates (SRID 4326)

**Query Parameters**:

- Standard filters: `status`, `categoryId`, `userId`
- Bounding box: `minLongitude`, `maxLongitude`, `minLatitude`, `maxLatitude`
- Radius search: `searchLongitude`, `searchLatitude`, `radiusMeters`
- Nearby: `longitude`, `latitude`, `radius` (default: 5000m)

### App Configuration

File: `src/config/app.config.ts`

```typescript
{
  app: {
    frontendUrl: 'localhost:5173',
    port: 5000,
    backendUrl: 'http://localhost:5000/api',
    env: 'development'
  },
  session: {
    expiresInSeconds: 86400  // 24 hours
  },
  cookie: {
    httpOnly: true,
    secure: false,           // true in production
    sameSite: 'lax'
  },
  db: {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'admin',
    password: 'password',
    database: 'participium'
  }
}
```

### Guards and Security

- **SessionGuard**: Verify active session
- **RolesGuard**: Role-based permission control
- **LocalAuthGuard**: Credential authentication
- Helmet for security headers
- Cookie parser for session management

---

## Frontend Web

### Ports and URLs

- **Port**: 5173 (dev)
- **URL**: http://localhost:5173

### Routing

```typescript
/                      → HomePage
/map                   → MapPage
/login                 → LoginPage
/register              → RegistrationPage
/users-municipality    → (configurable)
```

### Component Structure

#### Pages

- **auth/**: Login and registration
- **home/**: Main dashboard
- **map/**: Map visualization
- **users-municipality/**: Municipal user management

#### Components

- **ui/**: Styled Radix UI components (button, dialog, form, table, etc.)
- **app-sidebar.tsx**: Navigation sidebar
- **auth-form.tsx**: Authentication form
- **reports-list.tsx**: Reports list

#### Contexts

- **AuthContext**: Global authentication state management

#### Custom Hooks

- `useAuth`: Authentication hook
- `useMobile`: Mobile device detection
- `useMunicipalityUsers`: Municipal user management
- `useRoles`: Role management

#### API Client

Files: `src/api/client.ts` and `src/api/endpoints/`

- Client configured for backend communication
- Automatic error and authentication handling

### Styling

- **Tailwind CSS 4.x**: Utility-first CSS
- **Radix UI**: Headless accessible components
- **Lucide React**: Iconography
- **class-variance-authority**: Component variants

---

## Database

### Technology

- **PostgreSQL 18** with **PostGIS 3.6** extension
- Docker Container: `participium-postgres`
- Port: 5432

### Entities (TypeORM)

#### User

| Field     | Type   | Description           | Nullable | Notes                      |
| --------- | ------ | --------------------- | -------- | -------------------------- |
| id        | string | Primary key           | No       |                            |
| email     | string | User email            | No       | Unique                     |
| username  | string | Username              | No       | Unique                     |
| firstName | string | First name            | No       |                            |
| lastName  | string | Last name             | No       |                            |
| roleId    | string | Linked role ID        | No       | Foreign key to Role entity |
| role      | Role   | Role entity relation  | No       | Many-to-one, not nullable  |
| createdAt | Date   | Creation timestamp    | No       | Auto-generated             |
| updatedAt | Date   | Last update timestamp | No       | Auto-generated             |

#### Role

| Field | Type   | Description | Nullable | Notes |
| ----- | ------ | ----------- | -------- | ----- |
| id    | string | Primary key | No       |       |
| name  | string | Role name   | No       |       |

#### Account

| Field      | Type   | Description           | Nullable | Notes                       |
| ---------- | ------ | --------------------- | -------- | --------------------------- |
| id         | string | Primary key           | No       |                             |
| accountId  | string | Account identifier    | No       |                             |
| providerId | string | Provider identifier   | No       |                             |
| userId     | string | Linked user ID        | No       | Foreign key to User entity  |
| user       | User   | User entity relation  | No       | Many-to-one, cascade delete |
| password   | string | Account password      | Yes      | Optional, hashed            |
| createdAt  | Date   | Creation timestamp    | No       | Auto-generated              |
| updatedAt  | Date   | Last update timestamp | No       | Auto-generated              |

#### Session

| Field          | Type   | Description              | Nullable | Notes                       |
| -------------- | ------ | ------------------------ | -------- | --------------------------- |
| id             | string | Primary key              | No       |                             |
| expiresAt      | Date   | Session expiry timestamp | No       |                             |
| hashedSecret   | string | Hashed session secret    | No       | Excluded from serialization |
| createdAt      | Date   | Creation timestamp       | No       | Auto-generated              |
| updatedAt      | Date   | Last update timestamp    | No       | Auto-generated              |
| ipAddress      | string | IP address               | Yes      | Optional                    |
| userAgent      | string | User agent string        | Yes      | Optional                    |
| userId         | string | Linked user ID           | No       | Foreign key to User entity  |
| user           | User   | User entity relation     | No       | Many-to-one, cascade delete |
| impersonatedBy | string | Impersonator user ID     | Yes      | Optional                    |

#### Category

| Field | Type   | Description   | Nullable | Notes |
| ----- | ------ | ------------- | -------- | ----- |
| id    | string | Primary key   | No       |       |
| name  | string | Category name | No       |       |

#### Report

| Field       | Type                  | Description               | Nullable | Notes                          |
| ----------- | --------------------- | ------------------------- | -------- | ------------------------------ |
| id          | string                | Primary key               | No       |                                |
| title       | string                | Report title              | No       |                                |
| description | string                | Report description        | No       | Text type for longer content   |
| status      | enum                  | Report status             | No       | Values: pending, in_progress, resolved, rejected. Default: pending |
| location    | string                | Geographic coordinates    | No       | PostGIS geometry(Point, 4326), stored as WKT format |
| address     | string                | Physical address          | Yes      | Optional                       |
| images      | string[]              | Array of image paths/URLs | Yes      | Optional                       |
| userId      | string                | Linked user ID            | No       | Foreign key to User entity     |
| user        | User                  | User entity relation      | No       | Many-to-one, cascade delete    |
| categoryId  | string                | Linked category ID        | No       | Foreign key to Category entity |
| category    | Category              | Category entity relation  | No       | Many-to-one, not nullable      |
| createdAt   | Date                  | Creation timestamp        | No       | Auto-generated                 |
| updatedAt   | Date                  | Last update timestamp     | No       | Auto-generated                 |

**PostGIS Integration**:

- `location` column uses PostGIS geometry type with Point feature
- SRID 4326 (WGS84) for GPS/OpenStreetMap compatibility
- Stored in WKT format: `POINT(longitude latitude)`
- Automatic spatial index (GIST) for optimized geospatial queries

### Relations

- User ⟷ Role (ManyToOne)
- User ⟷ Account (OneToMany)
- User ⟷ Session (OneToMany)
- Report ⟷ User (ManyToOne)
- Report ⟷ Category (ManyToOne)

### PostGIS Geospatial Features

#### Supported Query Types

**Bounding Box**: Find reports within a rectangular area

```typescript
// Example: Reports in Turin city center
((minLongitude = 7.65), (maxLongitude = 7.72));
((minLatitude = 45.03), (maxLatitude = 45.1));
```

**Radius Search**: Find reports within a circular area

```typescript
// Example: Reports within 5km from Piazza Castello
((searchLongitude = 7.686864), (searchLatitude = 45.070312));
radiusMeters = 5000;
```

**Nearby with Distances**: Reports ordered by distance from a point

```typescript
// Returns reports with calculated distance in meters
((longitude = 7.686864), (latitude = 45.070312), (radius = 5000));
```

#### PostGIS Functions Used

- `ST_Contains`: Check if point is within bounding box
- `ST_DWithin`: Find points within radius (meters)
- `ST_Distance`: Calculate distance between points
- `ST_MakePoint`: Create point geometry from coordinates
- Geography cast (`::geography`) for accurate metric calculations

---

## Shared Packages

### @repo/api

**Purpose**: Shared entities and DTOs between backend and frontend

**Content**:

- `entities/`: TypeORM definitions (User, Role, Account, Session, Category, Report)
- `dto/`: Data Transfer Objects
  - `login.dto.ts`
  - `register.dto.ts`
  - `create-municipality-user.dto.ts`
  - `update-municipality-user.dto.ts`
  - `create-report.dto.ts`
  - `update-report.dto.ts`
  - `filter-reports.dto.ts`

### @repo/eslint-config

**Purpose**: Standardized ESLint configurations

**Files**:

- `base.js`: Base config
- `nest.js`: NestJS config
- `react.js`: React config
- `library.js`: Library config
- `prettier-base.js`: Prettier integration

### @repo/jest-config

**Purpose**: Reusable Jest configurations

**Exports**:

- `base.ts`: Base configuration
- `nest.ts`: NestJS config
- `next.ts`: Next.js config (future-proof)

### @repo/typescript-config

**Purpose**: Shared TypeScript configurations

**Files**:

- `base.json`: Base config
- `nestjs.json`: Backend config
- `react.json`: React config
- `react-library.json`: React library config
- `vite.json`: Vite config

---

## Setup and Configuration

### Prerequisites

- Node.js >= 18
- pnpm >= 8.15.5
- Docker Desktop (for database)

### Installation

1. **Clone and install dependencies**

```bash
cd participium
pnpm install
```

2. **Start PostgreSQL database**

```bash
cd apps/api
docker compose up -d
```

The database uses the `postgis/postgis:18-3.6` Docker image, which has **PostGIS already enabled** by default. No manual extension setup is required.

Verify active container:

```bash
docker ps
```

3. **Environment variables configuration**

Create `.env` file in `apps/api/`:

```env
# App
PORT=5000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000/api
NODE_ENV=development

# Database
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=password
DB_DATABASE=participium

# Session
SESSION_EXPIRES_IN_SECONDS=86400

# Cookie
COOKIE_HTTP_ONLY=true
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
```

4. **Seed database (optional)**

```bash
cd apps/api
pnpm run seed:user     # Seed users and roles
pnpm run seed:reports  # Seed reports with Turin locations
```

### Starting Applications

#### Development Mode (all apps)

```bash
pnpm dev
```

#### Individual applications

```bash
# Backend only
cd apps/api
pnpm dev

# Frontend only
cd apps/web
pnpm dev
```

### Application Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Swagger Docs**: http://localhost:5000/api
- **Database**: localhost:5432

---

## Available Commands

### Root Workspace

```bash
pnpm dev           # Start all apps in dev mode
pnpm build         # Build all apps
pnpm test          # Run all unit tests
pnpm test:e2e      # Run end-to-end tests
pnpm test:all      # Run all tests (unit + e2e)
pnpm lint          # Lint entire workspace
pnpm format        # Format code with Prettier
```

### Backend (apps/api)

```bash
pnpm dev           # Start dev with hot-reload
pnpm build         # Production build
pnpm start         # Start production
pnpm start:debug   # Start debug mode
pnpm test          # Unit tests
pnpm test:watch    # Tests in watch mode
pnpm test:e2e      # End-to-end tests
pnpm lint          # Linting
pnpm seed:user     # Seed test users
pnpm seed:reports  # Seed geospatial reports data
```

### Frontend (apps/web)

```bash
pnpm dev           # Vite dev server
pnpm build         # Production build
pnpm preview       # Preview production build
pnpm lint          # Linting
```

### Docker Database

```bash
# From apps/api/
docker compose up -d      # Start database
docker compose down       # Stop database
docker compose logs       # View logs
docker exec -it participium-postgres psql -U admin -d participium  # psql connection
```

---

## Additional Notes

### Testing

- **Coverage available**: `apps/api/coverage/`
- Coverage reports in formats: HTML, LCOV, Clover, JSON
- E2E tests configured for the API
- Unit tests for all modules including geospatial queries

### PostGIS & Geospatial Features

The database uses the **PostGIS 3.6** extension for advanced geographic features:

- Geographic coordinate storage (longitude, latitude)
- Spatial indexing with GIST for performance
- Distance calculations in meters
- Bounding box and radius queries
- SRID 4326 (WGS84) standard for GPS/OpenStreetMap compatibility
- TypeORM native support without additional packages

### Turbo Cache

Turborepo optimizes builds and tests through intelligent caching:

- `dev` task is not cached (persistent mode)
- `build` task cached with invalidation on changes
- `test` task not cached to ensure updated results

### Security

- Passwords hashed with bcrypt
- Sessions with hashed secrets
- HTTP-only cookies for CSRF protection
- Helmet for security headers
- Class-validator for input validation

### Extensibility

The project is structured for future evolutions:

- Easily extensible NestJS modules
- Reusable React components
- Centralized configurations in packages
- Database schema managed with TypeORM migrations (configurable)

---

**Document Version**: 1.0  
**Last Update**: November 2025  
**Project Status**: In Development
