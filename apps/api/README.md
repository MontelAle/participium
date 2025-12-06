# Participium API

## Overview

The Participium API is built with NestJS and provides backend services for citizen reporting with geospatial capabilities powered by PostGIS.

## Features

- 🔐 **Authentication**: Session-based authentication with role-based access control (RBAC)
- 🗺️ **Geospatial**: PostGIS integration for location-based reports (OpenStreetMap)
- 📊 **Reports Management**: Full CRUD operations with spatial queries
- 👥 **User Management**: Municipality users with different roles
- 📝 **API Documentation**: Auto-generated Swagger/OpenAPI documentation

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL 16+ with PostGIS extension
- Docker (optional, for database)

### Database Setup

#### Option 1: Using Docker (Recommended)

```bash
docker-compose up -d
```

This will start PostgreSQL with PostGIS already enabled.

#### Option 2: Manual Setup

1. Install PostgreSQL and PostGIS extension
2. Create database:
   ```bash
   createdb participium
   ```
3. Enable PostGIS:
   ```bash
   psql -d participium -c "CREATE EXTENSION IF NOT EXISTS postgis;"
   ```

See [PostGIS Integration Guide](./POSTGIS_INTEGRATION.md) for detailed setup instructions.

### Installation

```bash
# Install dependencies (from root)
pnpm install

# Build shared packages
pnpm build --filter @repo/api
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000/api

# Database (PostGIS enabled)
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

### Running the API

```bash
# Development mode with hot-reload
pnpm run dev

# Production build
pnpm run build
pnpm run start:prod
```

The API will be available at [http://localhost:5000](http://localhost:5000)

## API Documentation

Once the server is running, access the Swagger documentation at:

**[http://localhost:5000/api](http://localhost:5000/api)**

## Database Seeding

Populate the database with sample data:

```bash
# Seed users
pnpm run seed:user

# Seed reports with geospatial data (Turin, Italy)
pnpm run seed:reports
```

## Project Structure

```
src/
├── modules/
│   ├── auth/          # Authentication & authorization
│   ├── users/         # User management
│   ├── roles/         # Role management
│   └── reports/       # Reports with geospatial features
├── providers/
│   └── database/      # Database configuration & seeds
├── config/            # Application configuration
├── common/            # Shared utilities & types
└── main.ts            # Application entry point
```

## Key Technologies

- **NestJS**: Progressive Node.js framework
- **TypeORM**: ORM with PostgreSQL support
- **PostGIS**: Spatial database extender for PostgreSQL
- **Passport**: Authentication middleware
- **Swagger**: API documentation
- **Jest**: Testing framework

## Geospatial Features

The API includes PostGIS integration for location-based features:

### Reports with Location

- Store report locations using WGS84 coordinates (SRID 4326)
- Compatible with OpenStreetMap data
- Spatial indexing for fast queries

### Spatial Queries

```bash
# Find reports in bounding box
GET /api/reports?minLongitude=7.5&maxLongitude=7.8&minLatitude=44.9&maxLatitude=45.2

# Find nearby reports (5km radius)
GET /api/reports/nearby?longitude=7.686864&latitude=45.070312&radius=5000
```

See [PostGIS Integration Guide](./POSTGIS_INTEGRATION.md) for complete documentation.

## Testing

```bash
# Unit tests
pnpm run test

# Watch mode
pnpm run test:watch

# End-to-end tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Linting

```bash
pnpm run lint
```

### Important Note 🚧

If you plan to `build` or `test` the app, make sure to build the `packages/*` first:

```bash
pnpm build --filter @repo/api
```

## Learn More

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [PostGIS Integration Guide](./POSTGIS_INTEGRATION.md)
