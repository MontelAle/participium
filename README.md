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
UPDATE "user" SET "roleId" = 'admin' WHERE email = 'name@domain.com';
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

## Architectural Technology


| Field       | Type    | Description            | Nullable | Notes                       |
| ----------- | ------- | ---------------------- | -------- | --------------------------- |
| id          | string  | Primary key            | No       |                             |
| accountId   | string  | Account identifier     | No       |                             |
| providerId  | string  | Provider identifier    | No       |                             |
| userId      | string  | Linked user ID         | No       | Foreign key to User entity  |
| user        | User    | User entity relation   | No       | Many-to-one, cascade delete |
| password    | string  | Account password       | Yes      | Optional                    |
| createdAt   | Date    | Creation timestamp     | No       | Auto-generated              |
| updatedAt   | Date    | Last update timestamp  | No       | Auto-generated              |


| Field | Type   | Description      | Nullable | Notes      |
| ----- | ------ | ---------------- | -------- | ---------- |
| id    | string | Primary key      | No       |            |
| name  | string | Category name    | No       |            |

