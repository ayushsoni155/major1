# RapidBase - The Open-Source Backend for Rapid Development

> **Developed by Ayush Soni**

## Objective & Vision
RapidBase is a highly scalable, self-hosted, multi-tenant Backend-as-a-Service (BaaS) designed to be the ultimate open-source alternative to platforms like Firebase and Supabase. The core problem it solves is the complexity of configuring and managing multi-tenant architectures from scratch. RapidBase provides developers with a streamlined dashboard for project management, authentication, database auto-generation (via PostgREST), direct SQL execution, and comprehensive analytics—all isolated perfectly per tenant. The overall goal is to empower developers to launch production-ready applications with robust backend infrastructure and an intuitive management UI in minutes.

## Core Features
1. **Multi-Tenant Postgres Databases**: Instant schema isolation per project.
2. **Auto-Generated REST APIs**: Powered by PostgREST based on your schema.
3. **Advanced Authentication**: JWT, Refresh Tokens, and OTP-based Email authentication.
4. **SQL Editor**: Direct database execution with audit logging and history.
5. **Role-Based Access Control (RBAC)**: Admin, Editor, and Viewer roles for project members.
6. **Analytics & Dashboards**: Fully customizable grid layouts, real-time query metrics, and reporting.
7. **Developer API Keys**: Manage secure programmatic access to projects.
8. **Real-time Notifications**: Invitation systems and system alerts.

## Tech Stack & Module Deep-Dive
- **Next.js (App Router)**: The frontend framework showcasing a highly responsive, animated dashboard UI (TailwindCSS v4, React Flow, Mermaid).
- **Node.js & Express**: Microservices architecture for modular performance handling Auth, Projects, Database querying, and Analytics.
- **PostgreSQL**: The primary relational database ensuring strict schema-level multi-tenancy.
- **Redis**: Caching session states, user rate-limiting, and managing rapid OTP requests to prevent API abuse.
- **PostgREST**: Instantly turns the PostgreSQL database into a RESTful API, eliminating endless CRUD boilerplate.
- **Nginx**: Serving as an API Gateway, Reverse Proxy, and Load Balancer to securely route incoming traffic dynamically.
- **Docker & Docker Compose**: Containerizing the entire platform, making local development, testing, and production deployment reproducible.

## Architectural Diagrams

### System Flow Diagram
```mermaid
graph TD
    Client[Client / Browser] --> Nginx[Nginx API Gateway]
    
    Nginx --> Frontend[Next.js Frontend\nPort 3000]
    Nginx --> Auth[Auth Service\nPort 4001]
    Nginx --> Project[Project Service\nPort 4002]
    Nginx --> DBService[Database Service\nPort 4003]
    Nginx --> Analytics[Analytics Service\nPort 4004]
    Nginx --> Postgrest[PostgREST\nPort 3001]
    
    Auth --> Postgres[(PostgreSQL)]
    Project --> Postgres
    DBService --> Postgres
    Analytics --> Postgres
    Postgrest --> Postgres
    
    Auth --> Cache[(Redis)]
    Project --> Cache
```

### ER Diagram (Core Entities)
```mermaid
erDiagram
    users ||--o{ projects : "owns"
    users ||--o{ project_members : "belongs to"
    users ||--o{ api_keys : "creates"
    users ||--o{ query_history : "executes"
    users ||--o{ audit_log : "performs"
    users ||--o{ notifications : "receives"
    users ||--o{ project_invitations : "invites"
    users ||--o{ project_invitations : "is invited"
    
    projects ||--o{ project_members : "has"
    projects ||--o{ api_keys : "has"
    projects ||--o{ query_history : "logs"
    projects ||--o{ audit_log : "tracks"
    projects ||--o{ project_invitations : "has"
    projects ||--|| analytics_dashboards : "has"

    users {
        uuid id PK
        varchar email "UNIQUE"
        varchar password_hash
        varchar name
        text avatar_url
        varchar role
        boolean is_verified
        varchar otp_code
        timestamptz otp_expires_at
        integer otp_attempts
        boolean is_active
        timestamptz last_login
        timestamptz created_at
        timestamptz updated_at
    }

    projects {
        uuid project_id PK
        uuid owner_id FK
        varchar project_name
        text project_description
        varchar schema_name "UNIQUE"
        varchar project_status
        timestamptz created_at
        timestamptz updated_at
    }

    project_members {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        varchar role
        timestamptz invited_at
    }

    api_keys {
        uuid id PK
        uuid project_id FK
        varchar key_name
        varchar api_key "UNIQUE"
        varchar key_prefix
        text origin_url
        jsonb permissions
        boolean is_active
        timestamptz last_used_at
        uuid created_by FK
        timestamptz created_at
        timestamptz expires_at
    }

    query_history {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        text query_text
        varchar query_status
        integer execution_time_ms
        integer rows_affected
        text error_message
        timestamptz created_at
    }

    audit_log {
        uuid id PK
        uuid project_id FK
        uuid actor_id FK
        varchar action_type
        jsonb details
        varchar ip_address
        timestamptz created_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        varchar type
        varchar title
        text message
        jsonb data
        boolean is_read
        timestamptz created_at
    }

    project_invitations {
        uuid id PK
        uuid project_id FK
        uuid inviter_id FK
        varchar invitee_email
        uuid invitee_id FK
        varchar role
        varchar token "UNIQUE"
        varchar status
        timestamptz created_at
        timestamptz expires_at
    }

    analytics_dashboards {
        uuid id PK
        uuid project_id FK
        jsonb layout
        jsonb widgets
        timestamptz updated_at
    }
```

## Comprehensive API Documentation

All requests interact with the platform through the unified Nginx API Gateway. Authentication is strictly handled via `Authorization: Bearer <token>` or HTTP-only cookies assigned during Login. All successful responses generally follow a `{ status, data, message }` envelope convention.

### 1. Authentication Service (`/api/auth/*`)
Manages user lifecycle, tokens, and profiles. Limits apply via Redis (e.g., 20 req/15min).

| Method | Endpoint | Input | Success Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Body: `{ "email", "password", "name" }` | `201` - `{ "status", "data": { "userId" }, "message" }` | Register new user, sends OTP |
| `POST` | `/api/auth/verify-otp` | Body: `{ "email", "otp" }` | `200` - `{ "status", "data": { "user", "token", "refreshToken" } }` | Verify OTP to login |
| `POST` | `/api/auth/resend-otp` | Body: `{ "email" }` | `200` - `{ "status", "data": null, "message" }` | Resend OTP |
| `POST` | `/api/auth/login` | Body: `{ "email", "password" }` | `200` - `{ "status", "data": { "token", "refreshToken" } }` | Login user |
| `POST` | `/api/auth/refresh` | Body: `{ "refreshToken" }` | `200` - `{ "status", "data": { "token", "refreshToken" } }` | Refresh JWT tokens |
| `POST` | `/api/auth/logout` | None (Requires active session) | `200` - `{ "status", "data": null, "message" }` | Logout user |
| `GET` | `/api/auth/me` | Header: `Authorization: Bearer <token>` | `200` - `{ "status", "data": { "id", "email", "name", "verified" } }` | Get current user |
| `PATCH` | `/api/auth/profile` | Body: `{ "name" }` | `200` - `{ "status", "data": { "id", "name" }, "message" }` | Update profile |
| `POST` | `/api/auth/change-password` | Body: `{ "oldPassword", "newPassword" }` | `200` - `{ "status", "data": null, "message" }` | Change password |
| `DELETE` | `/api/auth/account` | None | `200` - `{ "status", "data": null, "message" }` | Delete account permanently |

### 2. Project Service (`/api/projects/*` & `/api/schema/*`)
Handles workspaces, schemas, table configuration, RBAC members, and keys. Requires Auth.

#### Projects
| Method | Endpoint | Input | Success Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/projects/` | Header: `Authorization: Bearer <token>` | `200` - `{ "status", "data": [ { "id", "name", "role", "createdAt" } ] }` | List projects |
| `POST` | `/api/projects/` | Body: `{ "name" }` | `201` - `{ "status", "data": { "id" }, "message" }` | Create project |
| `GET` | `/api/projects/:projectId` | Param: `projectId` | `200` - `{ "status", "data": { "id", "name", "ownerId", "schema" } }` | Get project details |
| `PATCH` | `/api/projects/:projectId` | Body: `{ "name" }` | `200` - `{ "status", "data": { ... }, "message" }` | Update project |
| `DELETE` | `/api/projects/:projectId` | Param: `projectId` | `200` - `{ "status", "data": null, "message" }` | Delete project |

#### Schema & Tables
| Method | Endpoint | Input | Success Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/schema/:projectId` | Param: `projectId` | `200` - `{ "status", "data": { "schema": [...] } }` | Get full schema |
| `GET` | `/api/projects/:projectId/tables` | Param: `projectId` | `200` - `{ "status", "data": [ "users", "products" ] }` | List tables |
| `POST` | `/api/projects/:projectId/tables` | Body: `{ "tableName", "columns": [...] }` | `201` - `{ "status", "data": null, "message" }` | Create table |
| `GET` | `/api/projects/:projectId/tables/:tableName` | Params: `projectId`, `tableName` | `200` - `{ "status", "data": { "columns": [...] } }` | Get table details |
| `PATCH` | `/api/projects/:projectId/tables/:tableName` | Body: `{ "actions": [...] }` | `200` - `{ "status", "data": null, "message" }` | Alter table |
| `DELETE` | `/api/projects/:projectId/tables/:tableName` | Params: `projectId`, `tableName` | `200` - `{ "status", "data": null, "message" }` | Drop table |

#### Table Data (UI CRUD Actions)
| Method | Endpoint | Input | Success Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/projects/:projectId/tables/:tableName/data` | Query: `?limit=50&offset=0` | `200` - `{ "status", "data": [ { "id": 1, "col": "val" } ] }` | Get rows |
| `POST` | `/api/projects/:projectId/tables/:tableName/data` | Body: `{ "row": { ... } }` | `201` - `{ "status", "data": { "id": 1 }, "message" }` | Insert row |
| `PATCH` | `/api/projects/:projectId/tables/:tableName/rows` | Body: `{ "id", "updates": { ... } }` | `200` - `{ "status", "data": null, "message" }` | Update row |
| `DELETE` | `/api/projects/:projectId/tables/:tableName/rows` | Option: Query or Body `{ "id" }` | `200` - `{ "status", "data": null, "message" }` | Delete row |

#### Members & Roles
| Method | Endpoint | Input | Success Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/projects/:projectId/members` | Param: `projectId` | `200` - `{ "status", "data": [ { "userId", "email", "role" } ] }` | List members |
| `POST` | `/api/projects/:projectId/members` | Body: `{ "email", "role" }` | `201` - `{ "status", "data": null, "message" }` | Invite member |
| `PATCH` | `/api/projects/:projectId/members/:memberId` | Body: `{ "role" }` | `200` - `{ "status", "message" }` | Update role |
| `DELETE` | `/api/projects/:projectId/members/:memberId` | Params: `projectId`, `memberId` | `200` - `{ "status", "message" }` | Remove member |

#### Invitations & Notifications
| Method | Endpoint | Input | Success Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/projects/invitations/mine` | None | `200` - `{ "status", "data": [ { "projectId", "role", "token" } ] }` | List my invites |
| `POST` | `/api/projects/invitations/accept/:token` | Param: `token` | `200` - `{ "status", "data": { "projectId" }, "message" }` | Accept invite |
| `POST` | `/api/projects/invitations/decline/:token` | Param: `token` | `200` - `{ "status", "message" }` | Decline invite |
| `GET` | `/api/projects/notifications` | None | `200` - `{ "status", "data": [ { "id", "title", "message", "isRead" } ] }` | List notifications |

#### API Keys
| Method | Endpoint | Input | Success Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/projects/:projectId/keys` | Param: `projectId` | `200` - `{ "status", "data": [ { "id", "createdAt", "lastUsedAt" } ] }` | List API keys |
| `POST` | `/api/projects/:projectId/keys` | None | `201` - `{ "status", "data": { "key" }, "message" }` | Create API key |
| `DELETE` | `/api/projects/:projectId/keys/:keyId` | Params: `projectId`, `keyId` | `200` - `{ "status", "message" }` | Revoke API key |

### 3. Database Service (`/api/query/*` & `/api/auditlog`)

| Method | Endpoint | Input | Success Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/query/execute` | Body: `{ "projectId", "query" }` | `200` - `{ "status", "data": { "rows", "rowCount", "executionTimeMs" } }` | Execute SQL query |
| `GET` | `/api/query/history` | Query: `?projectId=uuid` | `200` - `{ "status", "data": [ { "query", "executedBy", "timestamp" } ] }` | Query history |
| `GET` | `/api/auditlog` | Query: `?projectId=uuid` | `200` - `{ "status", "data": [ { "action", "details" } ] }` | Audit log |

### 4. Analytics Service (`/api/analytics/*`)

| Method | Endpoint | Input | Success Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/tables` | Query: `?projectId=uuid` | `200` - `{ "status", "data": [ "users", "orders" ] }` | List analytics tables |
| `GET` | `/api/analytics/tables/:tableName/columns` | Query: `?projectId=uuid` | `200` - `{ "status", "data": [ { "name", "type" } ] }` | List columns |
| `GET` | `/api/analytics/chart` | Query: `?projectId`, `tableName`, `xAxis`, `yAxis`, `aggregation` | `200` - `{ "status", "data": [ { "label", "value" } ] }` | Chart data |
| `GET` | `/api/analytics/stats` | Query: `?projectId`, `tableName` | `200` - `{ "status", "data": { "totalRecords", "recentlyAdded" } }` | Table stats |
| `GET` | `/api/analytics/dashboard` | Query: `?projectId=uuid` | `200` - `{ "status", "data": { "layout", "widgets" } }` | Get dashboard config |
| `POST` | `/api/analytics/dashboard` | Body: `{ "projectId", "layout", "widgets" }` | `200` - `{ "status", "data": null, "message" }` | Save dashboard config |

### 5. PostgREST Auto-Generated API (`/api/rest/*`)

The PostgREST API gives you instant, high-performance REST access to your project tables. Every request is authenticated via an API key — no cookies or JWT tokens needed.

#### Authentication

Include your API key in every request:
```bash
curl -H "x-api-key: YOUR_API_KEY" http://YOUR_DOMAIN/api/rest/your_table
```

Generate API keys from: **Dashboard → API Keys → Generate New Key**

#### Read Records

```bash
# Get all rows
curl http://YOUR_DOMAIN/api/rest/users -H "x-api-key: YOUR_KEY"

# Select specific columns
curl "http://YOUR_DOMAIN/api/rest/users?select=id,email" -H "x-api-key: YOUR_KEY"

# Filter: exact match
curl "http://YOUR_DOMAIN/api/rest/users?id=eq.5" -H "x-api-key: YOUR_KEY"

# Filter: greater than
curl "http://YOUR_DOMAIN/api/rest/users?age=gt.18" -H "x-api-key: YOUR_KEY"

# Filter: pattern match (case-insensitive)
curl "http://YOUR_DOMAIN/api/rest/users?name=ilike.*john*" -H "x-api-key: YOUR_KEY"

# Sort + Pagination
curl "http://YOUR_DOMAIN/api/rest/users?order=created_at.desc&limit=10&offset=0" -H "x-api-key: YOUR_KEY"
```

#### Insert Records

```bash
# Single row
curl -X POST http://YOUR_DOMAIN/api/rest/users \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"full_name": "John Doe", "email": "john@example.com"}'

# Multiple rows
curl -X POST http://YOUR_DOMAIN/api/rest/users \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '[{"full_name": "Alice"}, {"full_name": "Bob"}]'
```

#### Update Records

```bash
curl -X PATCH "http://YOUR_DOMAIN/api/rest/users?id=eq.1" \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Updated Name"}'
```

> ⚠️ Always include a filter (`?id=eq.X`), otherwise ALL rows will be updated.

#### Delete Records

```bash
curl -X DELETE "http://YOUR_DOMAIN/api/rest/users?id=eq.1" \
  -H "x-api-key: YOUR_KEY"
```

> ⚠️ Always include a filter, otherwise ALL rows will be deleted.

#### JavaScript Example

```javascript
const API_URL = "http://YOUR_DOMAIN/api/rest";
const headers = {
  "x-api-key": "YOUR_KEY",
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

// Read
const users = await fetch(`${API_URL}/users`, { headers }).then(r => r.json());

// Insert
const newUser = await fetch(`${API_URL}/users`, {
  method: "POST", headers,
  body: JSON.stringify({ full_name: "New User", email: "new@test.com" }),
}).then(r => r.json());

// Update
await fetch(`${API_URL}/users?id=eq.${newUser[0].id}`, {
  method: "PATCH", headers,
  body: JSON.stringify({ full_name: "Updated" }),
});

// Delete
await fetch(`${API_URL}/users?id=eq.${newUser[0].id}`, {
  method: "DELETE", headers,
});
```

#### Filter Operators Reference

| Operator | Meaning | Example |
|----------|---------|---------|
| `eq` | Equals | `?id=eq.5` |
| `neq` | Not equal | `?status=neq.deleted` |
| `gt` / `lt` | Greater / Less than | `?age=gt.18` |
| `gte` / `lte` | Greater/Less or equal | `?price=lte.100` |
| `like` | Pattern match (case-sensitive) | `?name=like.*john*` |
| `ilike` | Pattern match (case-insensitive) | `?name=ilike.*john*` |
| `in` | In list | `?status=in.(active,pending)` |
| `is` | IS (null/true/false) | `?deleted_at=is.null` |

#### Response Codes

| Code | Meaning |
|------|---------|
| `200` | Success (GET, PATCH) |
| `201` | Created (POST with `Prefer: return=representation`) |
| `204` | Success, no content returned |
| `401` | Invalid or missing API key |
| `404` | Table not found |
| `409` | Unique constraint violation |

## Installation & Setup
Docker Compose orchestrates the entire application natively. 

1. **Clone & Configure:**
```bash
git clone <repository_url>
cd rapidbase
cp .env.example .env
```
*(Define database credentials, secure JWT/Session secrets, and SMTP setups in your `.env`)*

2. **Boot Platform:**
```bash
docker-compose up --build -d
```
All images (PostgreSQL, Redis, Services, Gateway, Next.js) will build securely.
- **Frontend Panel**: Available at `http://localhost/`
- **Backend APIs:** Secured heavily under `http://localhost/api/*` via Nginx Gateway boundaries.
