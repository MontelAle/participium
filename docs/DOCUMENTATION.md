# Participium - Documentazione Progetto

## Indice

1. [Panoramica](#panoramica)
2. [Architettura](#architettura)
3. [Stack Tecnologico](#stack-tecnologico)
4. [Struttura del Progetto](#struttura-del-progetto)
5. [Backend API](#backend-api)
6. [Frontend Web](#frontend-web)
7. [Database](#database)
8. [Packages Condivisi](#packages-condivisi)
9. [Setup e Configurazione](#setup-e-configurazione)
10. [Comandi Disponibili](#comandi-disponibili)

---

## Panoramica

**Participium** è una piattaforma web per la gestione della partecipazione civica. Il progetto utilizza un'architettura monorepo basata su Turborepo, con backend NestJS e frontend React/Vite.

### Caratteristiche Principali
- Autenticazione e gestione sessioni basata su cookie
- Sistema di ruoli e permessi
- Gestione utenti municipali
- Interfaccia dashboard moderna con componenti UI riutilizzabili
- API RESTful con documentazione Swagger

---

## Architettura

### Monorepo Structure
Il progetto utilizza **Turborepo** per gestire un workspace monorepo con:
- **2 applicazioni** (`apps/`): API backend e Web frontend
- **3 packages condivisi** (`packages/`): entità comuni, configurazioni ESLint e Jest

### Pattern Architetturali
- **Backend**: NestJS con pattern modulare (controllers, services, modules)
- **Frontend**: React con routing, context API, hooks personalizzati
- **Database**: PostgreSQL con TypeORM e PostGIS
- **Autenticazione**: Session-based con Passport.js (Local Strategy)

---

## Stack Tecnologico

### Backend
| Tecnologia | Versione | Scopo |
|------------|----------|-------|
| NestJS | ^11.0.0 | Framework principale |
| TypeORM | ^0.3.27 | ORM per database |
| PostgreSQL | 18 | Database relazionale |
| PostGIS | 3.6 | Estensione geografica |
| Passport | ^0.7.0 | Autenticazione |
| Swagger | ^11.2.1 | Documentazione API |
| Jest | ^29.7.0 | Testing |

### Frontend
| Tecnologia | Versione | Scopo |
|------------|----------|-------|
| React | ^18.2.0 | Framework UI |
| Vite | ^5.1.4 | Build tool |
| React Router | ^7.1.3 | Routing |
| Tailwind CSS | ^4.1.16 | Styling |
| Radix UI | varie | Componenti UI accessibili |
| TanStack Query | ^5.90.7 | Data fetching |
| Jotai | ^2.15.1 | State management |

### DevOps & Tools
- **Package Manager**: pnpm ^8.15.5
- **Build System**: Turborepo ^2.6.0
- **Container**: Docker & Docker Compose
- **Node**: >=18

---

## Struttura del Progetto

```
participium/
├── apps/
│   ├── api/                    # Backend NestJS
│   │   ├── src/
│   │   │   ├── modules/        # Moduli funzionali
│   │   │   │   ├── auth/       # Autenticazione
│   │   │   │   ├── roles/      # Gestione ruoli
│   │   │   │   └── users/      # Gestione utenti
│   │   │   ├── providers/
│   │   │   │   └── database/   # Configurazione DB
│   │   │   ├── config/         # Configurazioni app
│   │   │   └── common/         # Types e utilities
│   │   ├── test/               # Test E2E
│   │   └── compose.yml         # Docker PostgreSQL
│   │
│   └── web/                    # Frontend React
│       ├── src/
│       │   ├── pages/          # Route pages
│       │   │   ├── auth/       # Login/Registrazione
│       │   │   ├── home/       # Homepage
│       │   │   ├── map/        # Mappa
│       │   │   └── users-municipality/ # Gestione utenti
│       │   ├── components/     # Componenti React
│       │   ├── contexts/       # Context providers
│       │   ├── hooks/          # Custom hooks
│       │   ├── layouts/        # Layout templates
│       │   └── api/            # Client API
│       └── public/             # Asset statici
│
├── packages/
│   ├── api/                    # Entità e DTO condivisi
│   │   └── src/
│   │       ├── entities/       # TypeORM entities
│   │       └── dto/            # Data Transfer Objects
│   ├── eslint-config/          # Configurazioni ESLint
│   ├── jest-config/            # Configurazioni Jest
│   └── typescript-config/      # Configurazioni TypeScript
│
├── package.json                # Root workspace config
├── turbo.json                  # Turborepo config
└── pnpm-workspace.yaml         # pnpm workspace config
```

---

## Backend API

### Porte e URL
- **Porta**: 5000 (default)
- **Base URL**: http://localhost:5000/api
- **Swagger UI**: http://localhost:5000/api (documentazione interattiva)

### Moduli Principali

#### Auth Module
**Endpoint**: `/auth`

| Metodo | Route | Descrizione |
|--------|-------|-------------|
| POST | `/login` | Login utente con email/password |
| POST | `/register` | Registrazione nuovo utente |
| POST | `/logout` | Logout e invalidazione sessione |
| POST | `/refresh` | Refresh sessione |

**Features**:
- Autenticazione con Passport Local Strategy
- Session management con cookie HTTP-only
- Guards: `LocalAuthGuard`, `SessionGuard`, `RolesGuard`

#### Users Module
**Endpoint**: `/users`

| Metodo | Route | Descrizione |
|--------|-------|-------------|
| GET | `/municipality` | Lista utenti municipali |
| GET | `/municipality/user/:id` | Dettaglio utente |
| POST | `/municipality` | Crea utente municipale |
| POST | `/municipality/user/:id` | Aggiorna utente |
| DELETE | `/municipality/user/:id` | Elimina utente |

**Funzionalità**:
- Gestione completa utenti municipali
- Validazione con class-validator
- Relazioni con ruoli e account

#### Roles Module
**Endpoint**: `/roles`

| Metodo | Route | Descrizione |
|--------|-------|-------------|
| GET | `/` | Recupera tutti i ruoli disponibili |

### Configurazione App
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
    expiresInSeconds: 86400  // 24 ore
  },
  cookie: {
    httpOnly: true,
    secure: false,           // true in produzione
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

### Guards e Security
- **SessionGuard**: Verifica sessione attiva
- **RolesGuard**: Controllo permessi basato su ruoli
- **LocalAuthGuard**: Autenticazione credenziali
- Helmet per security headers
- Cookie parser per gestione sessioni

---

## Frontend Web

### Porte e URL
- **Porta**: 5173 (dev)
- **URL**: http://localhost:5173

### Routing
```typescript
/                      → HomePage
/map                   → MapPage
/login                 → LoginPage
/register              → RegistrationPage
/users-municipality    → (configurabile)
```

### Struttura Componenti

#### Pages
- **auth/**: Login e registrazione
- **home/**: Dashboard principale
- **map/**: Visualizzazione mappa
- **users-municipality/**: Gestione utenti municipali

#### Components
- **ui/**: Componenti Radix UI stilizzati (button, dialog, form, table, etc.)
- **app-sidebar.tsx**: Sidebar navigazione
- **auth-form.tsx**: Form autenticazione
- **reports-list.tsx**: Lista segnalazioni

#### Contexts
- **AuthContext**: Gestione stato autenticazione globale

#### Custom Hooks
- `useAuth`: Hook per autenticazione
- `useMobile`: Rilevamento dispositivo mobile
- `useMunicipalityUsers`: Gestione utenti municipali
- `useRoles`: Gestione ruoli

#### API Client
File: `src/api/client.ts` e `src/api/endpoints/`
- Client configurato per comunicazione con backend
- Gestione automatica errori e autenticazione

### Styling
- **Tailwind CSS 4.x**: Utility-first CSS
- **Radix UI**: Componenti accessibili headless
- **Lucide React**: Iconografia
- **class-variance-authority**: Varianti componenti

---

## Database

### Tecnologia
- **PostgreSQL 18** con estensione **PostGIS 3.6**
- Container Docker: `participium-postgres`
- Porta: 5432

### Entità (TypeORM)

#### User
```typescript
{
  id: string (PK)
  email: string (unique)
  username: string (unique)
  firstName: string
  lastName: string
  roleId: string (FK → Role)
  createdAt: timestamptz
  updatedAt: timestamptz
}
```

#### Role
```typescript
{
  id: string (PK)
  name: string
}
```

#### Account
```typescript
{
  id: string (PK)
  accountId: string
  providerId: string
  userId: string (FK → User)
  password: string (nullable, hashed)
  createdAt: timestamptz
  updatedAt: timestamptz
}
```

#### Session
```typescript
{
  id: string (PK)
  userId: string (FK → User)
  expiresAt: timestamptz
  hashedSecret: string
  ipAddress: string (nullable)
  userAgent: string (nullable)
  impersonatedBy: string (nullable)
  createdAt: timestamptz
  updatedAt: timestamptz
}
```

#### Category
```typescript
{
  id: string (PK)
  name: string
}
```

### Relazioni
- User ⟷ Role (ManyToOne)
- User ⟷ Account (OneToMany)
- User ⟷ Session (OneToMany)

---

## Packages Condivisi

### @repo/api
**Scopo**: Entità e DTO condivisi tra backend e frontend

**Contenuto**:
- `entities/`: Definizioni TypeORM (User, Role, Account, Session, Category)
- `dto/`: Data Transfer Objects
  - `login.dto.ts`
  - `register.dto.ts`
  - `create-municipality-user.dto.ts`
  - `update-municipality-user.dto.ts`

### @repo/eslint-config
**Scopo**: Configurazioni ESLint standardizzate

**Files**:
- `base.js`: Config base
- `nest.js`: Config per NestJS
- `react.js`: Config per React
- `library.js`: Config per librerie
- `prettier-base.js`: Integrazione Prettier

### @repo/jest-config
**Scopo**: Configurazioni Jest riutilizzabili

**Exports**:
- `base.ts`: Configurazione base
- `nest.ts`: Config per NestJS
- `next.ts`: Config per Next.js (future-proof)

### @repo/typescript-config
**Scopo**: Configurazioni TypeScript condivise

**Files**:
- `base.json`: Base config
- `nestjs.json`: Config backend
- `react.json`: Config React
- `react-library.json`: Config librerie React
- `vite.json`: Config Vite

---

## Setup e Configurazione

### Prerequisiti
- Node.js >= 18
- pnpm >= 8.15.5
- Docker Desktop (per database)

### Installazione

1. **Clone e installazione dipendenze**
```bash
cd participium
pnpm install
```

2. **Avvio database PostgreSQL**
```bash
cd apps/api
docker compose up -d
```

Verifica container attivo:
```bash
docker ps
```

3. **Configurazione variabili ambiente**

Creare file `.env` in `apps/api/`:
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

4. **Seed database (opzionale)**
```bash
cd apps/api
pnpm run seed:user
```

### Avvio Applicazioni

#### Modalità Development (tutte le app)
```bash
pnpm dev
```

#### Singole applicazioni
```bash
# Solo backend
cd apps/api
pnpm dev

# Solo frontend
cd apps/web
pnpm dev
```

### Accesso Applicazioni
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Swagger Docs**: http://localhost:5000/api
- **Database**: localhost:5432

---

## Comandi Disponibili

### Root Workspace
```bash
pnpm dev           # Avvia tutte le app in modalità dev
pnpm build         # Build di tutte le app
pnpm test          # Esegue tutti i test unitari
pnpm test:e2e      # Esegue test end-to-end
pnpm test:all      # Esegue tutti i test (unit + e2e)
pnpm lint          # Linting di tutto il workspace
pnpm format        # Formattazione codice con Prettier
```

### Backend (apps/api)
```bash
pnpm dev           # Avvio dev con hot-reload
pnpm build         # Build produzione
pnpm start         # Avvio produzione
pnpm start:debug   # Avvio debug mode
pnpm test          # Test unitari
pnpm test:watch    # Test in watch mode
pnpm test:e2e      # Test end-to-end
pnpm lint          # Linting
pnpm seed:user     # Seed utenti di test
```

### Frontend (apps/web)
```bash
pnpm dev           # Dev server Vite
pnpm build         # Build produzione
pnpm preview       # Preview build produzione
pnpm lint          # Linting
```

### Docker Database
```bash
# Da apps/api/
docker compose up -d      # Avvia database
docker compose down       # Ferma database
docker compose logs       # Visualizza logs
docker exec -it participium-postgres psql -U admin -d participium  # Connessione psql
```

---

## Note Aggiuntive

### Testing
- **Coverage disponibile**: `apps/api/coverage/`
- Report coverage in formato: HTML, LCOV, Clover, JSON
- Test E2E configurati per l'API

### PostGIS
Il database utilizza l'estensione PostGIS per funzionalità geografiche avanzate, utile per gestione mappe e coordinate geografiche.

### Turbo Cache
Turborepo ottimizza i build e test attraverso caching intelligente:
- Task `dev` non viene cachato (persistent mode)
- Task `build` cachato con invalidazione su modifiche
- Task `test` non cachato per garantire risultati aggiornati

### Sicurezza
- Password hashate con bcrypt
- Sessioni con secret hasciati
- Cookie HTTP-only per CSRF protection
- Helmet per security headers
- Class-validator per validazione input

### Estensibilità
Il progetto è strutturato per future evoluzioni:
- Moduli NestJS facilmente estendibili
- Componenti React riutilizzabili
- Configurazioni centralizzate nei packages
- Database schema gestito con TypeORM migrations (configurabile)

---

**Versione Documento**: 1.0  
**Ultimo Aggiornamento**: Novembre 2025  
**Stato Progetto**: In Sviluppo
