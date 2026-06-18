## ADDED Requirements

### Requirement: Docker Compose provides local PostgreSQL

The project SHALL include a Docker Compose file at `docker/docker-compose.yml` that runs PostgreSQL for local development.

#### Scenario: Compose file exists

- **WHEN** inspecting the `docker/` directory
- **THEN** `docker-compose.yml` defines a `postgres` service exposed on port `5432`

#### Scenario: Postgres starts locally

- **WHEN** developer runs `pnpm docker:up`
- **THEN** a PostgreSQL container starts and accepts connections at `localhost:5432`

### Requirement: Local database credentials documented

The Docker Compose Postgres service SHALL use dev-only credentials aligned with `.env.example`. The example `DATABASE_URL` SHALL point at the local Docker instance by default.

#### Scenario: Env example matches Docker Compose

- **WHEN** inspecting `.env.example` and `docker/docker-compose.yml`
- **THEN** `DATABASE_URL` uses the same user, password, host, port, and database name as the compose service

### Requirement: Docker lifecycle scripts

The project SHALL provide npm scripts to start and stop the local database stack.

#### Scenario: Start local database

- **WHEN** developer runs `pnpm docker:up`
- **THEN** Docker Compose starts the Postgres service in detached mode using `docker/docker-compose.yml`

#### Scenario: Stop local database

- **WHEN** developer runs `pnpm docker:down`
- **THEN** Docker Compose stops the Postgres service defined in `docker/docker-compose.yml`

### Requirement: Local Postgres persists data across restarts

The Docker Compose file SHALL mount a named volume for PostgreSQL data so schema and rows survive container restarts during development.

#### Scenario: Named volume configured

- **WHEN** inspecting `docker/docker-compose.yml`
- **THEN** the `postgres` service declares a named volume for `/var/lib/postgresql/data`
