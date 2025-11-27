# Participium - Full Stack Deployment

This repository contains the deployment configuration for the **Participium** platform, a full-stack application built with a modular architecture using a monorepo strategy.

The release is fully containerized and hosted on Docker Hub, ensuring a seamless "plug-and-play" deployment experience for third parties

## Prerequisites

Before starting, ensure you have the following installed on your machine:

- **Docker Desktop** (v4.0 or later)

- **Docker Compose** (usually included with Docker Desktop)

## Quick Start

To start the entire system (Frontend, Backend, Database, and Object Storage), follow these simple steps:

**1. Launch the System:** Open your terminal in the root directory that contains docker-compose.yml and run:

```
docker compose up -d
```

**2. Verify Status:** Check if all containers are up and running correctly:

```
docker compose ps
```

**3. Wait for Initialization:** Docker will pull the images from Docker Hub and start the containers
_Note: The backend may take a few seconds to connect to the database on the first run_

**4. Stop the System:** To stop and remove the containers, run:

```
docker compose down
```

## Accessing the Application

Once the containers are running, you can access the services at the following URLs:
| Service | URL | Description |
| :--- | :--- | :--- |
| Frontend | http://localhost:5173 | Main user interface (React) |
| Backend | http://localhost:5000/api | Rest API endpoints (NestJS) |
| MinIO Console | http://localhost:9001 | Object Storage Management |

## Demo Credentials

For release demo purpose, the **system automatically populates the database** on the first launch

**1. Mock Data Generation**
The system generates **20 fake reports** with realistic descriptions and categories. These reports are **geolocated around the city center of Turin**, allowing you to immediately test the map features and list filtering.

**2. Pre-configured Users**
Use these accounts to log in and test the application with different permission levels:
| Role | Username | Password
| :--- | :--- | :--- |
| Citizen (registered on platform) | `user` | `password` |
| Municipal Officer | `officer` | `password` |
| System Admin | `admin` | `password`|

## Services Credentials

The system comes pre-configured with the following default credentials for development and testing purposes:

#### PostgreSQL (Database)

- **Host:** localhost (port 5432)
- **User:** admin
- **Password:** password
- **Database:** participium

#### MinIO (Object Storage)

- **Web Client Console URL:** http://localhost:9001
- **User:** minioadmin
- **Password:** minioadmin

## Architecture Overview

The system is composed of the following Docker services:

- **`web`** Frontend application built with Vite, React, and TypeScript, served via Nginx

- **`api`** Backend application built with NestJS, handling business logic and API requests

- **`postgres`** PostgreSQL database extended with PostGIS for geospatial data support

- **`minio`**: S3-compatible object storage for handling file uploads
