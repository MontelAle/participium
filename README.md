# 🐘 Guide: Interacting with the PostgreSQL Database (Docker + PostGIS)

## 🧩 1. Start the Database

Run the following command from your terminal in position apps/api:(remember to open docker desktop if you are on macOS or Windows before run)

```bash
docker compose up -d
```

Check if the container is running:

```bash
docker ps
```

You should see something like:

```
participium-postgres   postgis/postgis:18-3.6   Up   0.0.0.0:5432->5432/tcp
```

---

## 💻 2. Connecting to PostgreSQL

### 🪟 **Windows**

#### Option 1 – PowerShell (with `psql` installed)

```bash
psql -h localhost -p 5432 -U admin -d participium
```

Then enter the password (`password`).

> If `psql` is not recognized, install it from:
> [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
>
> During installation, make sure to select **Command Line Tools**.

#### Option 2 – From inside the container

```bash
docker exec -it participium-postgres psql -U admin -d participium
```

---

### 🍏 **macOS**

#### Option 1 – From terminal (if `psql` is installed)

```bash
psql -h localhost -p 5432 -U admin -d participium
```

If you don’t have `psql`, install it using Homebrew:

```bash
brew install libpq
brew link --force libpq
```

#### Option 2 – From inside the container

```bash
docker exec -it participium-postgres psql -U admin -d participium
```

---

### 🐧 **Linux**

#### Option 1 – From the host (if `psql` is installed)

```bash
psql -h localhost -p 5432 -U admin -d participium
```

If not installed:

```bash
sudo apt install postgresql-client
```

#### Option 2 – From inside the container

```bash
docker exec -it participium-postgres psql -U admin -d participium
```

---

## 🧠 3. Useful `psql` Commands

| Action                           | Command                     |
| -------------------------------- | --------------------------- |
| List databases                   | `\l`                        |
| Connect to a database            | `\c participium`            |
| List tables                      | `\dt`                       |
| List tables in a specific schema | `\dt public.*`              |
| Describe a table                 | `\d table_name`             |
| Run an SQL query                 | `SELECT * FROM table_name;` |
| Exit `psql`                      | `\q`                        |

---

## 🧰 4. Example Queries

### Insert a new role

```sql
INSERT INTO role (id, name)
VALUES ('admin', 'admin');
```

### View all roles

```sql
SELECT * FROM role;
```

### Assign a role to a user

```sql
UPDATE "user" SET "roleId" = 'admin' WHERE username = 'user';
```

---

## 🧭 5. Access via GUI (Optional)

You can also connect using a graphical interface:

| Tool          | Platform              | Link                                                 |
| ------------- | --------------------- | ---------------------------------------------------- |
| **pgAdmin 4** | All                   | [https://www.pgadmin.org/](https://www.pgadmin.org/) |
| **TablePlus** | macOS, Windows, Linux | [https://tableplus.com/](https://tableplus.com/)     |
| **DBeaver**   | All                   | [https://dbeaver.io/](https://dbeaver.io/)           |

---

## 🧼 6. Stop / Clean Up

Stop the database:

```bash
docker compose down
```

Remove volumes as well (⚠️ this deletes all data):

```bash
docker compose down -v
```

---

## ✅ Quick Reference

| Action          | Command                                                             |
| --------------- | ------------------------------------------------------------------- |
| Start DB        | `docker compose up -d`                                              |
| Enter DB shell  | `docker exec -it participium-postgres psql -U admin -d participium` |
| List tables     | `\dt`                                                               |
| View table data | `SELECT * FROM table_name;`                                         |
| Stop DB         | `docker compose down`                                               |

TODO: ELIMINA THIS

## Architectural Technology

This section provides a clear overview of:
What data is stored (fields and types)
How entities relate (foreign keys, many-to-one relations)
Special features (auto-generated timestamps, excluded fields, optional fields)

It helps developers understand the database schema, making it easier to work with the backend, write queries, and maintain the system. The tables in your README serve as a quick reference for anyone interacting with or extending your application’s data layer.

### High-level Architecture

The application follows a classic three-tier architecture:

- **Frontend**: A React single-page application that handles user interaction and communicates with the backend via REST APIs.
- **Backend**: A Node.js/NestJS service exposing authenticated REST endpoints for managing users, reports, and admin operations.
- **Database**: A PostgreSQL relational database used to persist users, reports, and system configuration.

Communication between the frontend and backend happens over HTTPS using JSON. The backend uses an ORM layer to interact with the database and applies domain validation and authorization before any write operation.

### Frontend

- **Technology**: React, TypeScript, Vite
- **Responsibilities**:
  - Render the user interface for citizens and administrators
  - Handle form validation before sending data to the API
  - Manage client-side routing and basic state (logged-in user, filters, etc.)
- **Interaction with backend**:
  - Calls `/api/auth/*` for authentication
  - Calls `/api/reports/*` for creating and viewing reports

### Backend

- **Technology**: Node.js, NestJS
- **Responsibilities**:
  - Expose REST endpoints for authentication, user management, and report management
  - Apply business rules (role-based access control, validation)
  - Handle file uploads (photos attached to reports)
- **Internal structure**:
  - `modules/auth`: login, registration, session management
  - `modules/reports`: CRUD operations on reports
  - `modules/users`: admin management of users

  ### Database

- **Technology**: PostgreSQL + TypeORM
- **Responsibilities**:
  - Persist users, reports, and categories
  - Enforce constraints (unique email and username, foreign keys between users and reports)
- **Main entities**:
  - `User`: email, username, role, password hash
  - `Report`: title, description, location, status, category, author
  - `Photo`: path, report_id

### Technology Choices & Rationale

- **NestJS** was chosen because it provides a structured, opinionated framework with built-in support for modules, dependency injection, and decorators, which keeps the codebase maintainable as the project grows.
- **TypeORM** allows us to keep a single source of truth for the data model in TypeScript and automatically generate SQL queries, reducing boilerplate.
- **PostgreSQL** was selected as a robust open-source relational database with strong support for GIS extensions, which fits well a map-based reporting system.
- **React** on the frontend enables building a responsive, interactive user interface with reusable components.

## account

| Field      | Type   | Description           | Nullable | Notes                       |
| ---------- | ------ | --------------------- | -------- | --------------------------- |
| id         | string | Primary key           | No       |                             |
| accountId  | string | Account identifier    | No       |                             |
| providerId | string | Provider identifier   | No       |                             |
| userId     | string | Linked user ID        | No       | Foreign key to User entity  |
| user       | User   | User entity relation  | No       | Many-to-one, cascade delete |
| password   | string | Account password      | Yes      | Optional                    |
| createdAt  | Date   | Creation timestamp    | No       | Auto-generated              |
| updatedAt  | Date   | Last update timestamp | No       | Auto-generated              |

## category

| Field | Type   | Description   | Nullable | Notes |
| ----- | ------ | ------------- | -------- | ----- |
| id    | string | Primary key   | No       |       |
| name  | string | Category name | No       |       |

## role

| Field | Type   | Description | Nullable | Notes |
| ----- | ------ | ----------- | -------- | ----- |
| id    | string | Primary key | No       |       |
| name  | string | Role name   | No       |       |

## session

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

## user

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
