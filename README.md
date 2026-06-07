# Pinduoduo Clone

A simplified educational backend clone inspired by Pinduoduo, built as a modular monolith using NestJS, TypeORM, and PostgreSQL. The system follows Domain-Driven Design (DDD) principles with internal event-driven communication between loosely-coupled modules, all within a single deployable application.

---

## Quick Start

```bash
# 1. Start all infrastructure
docker compose up -d

# 2. Copy and configure environment
cp .env.example .env   # set DB credentials and JWT_SECRET

# 3. Install dependencies
npm install

# 4. Start the API (auto-syncs schema on first run)
npm run start:dev
```

### Key Commands

| Command | Description |
|---|---|
| `npm run start:dev` | Dev server with watch mode |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run all Jest tests |
| `npm run test:watch` | Watch mode for tests |
| `npm run test:cov` | Coverage report |

---

## Architecture

The app is a single deployable backend, internally organized into independent modules. Each module owns its domain, defines its interfaces, and communicates asynchronously via domain events — no direct cross-module implementation dependencies.

### DDD Layers (per module)

```
src/modules/{moduleName}/
├── domain/
│   ├── entities/           — Core business objects
│   ├── value-objects/      — Immutable business concepts (e.g. Price, TimeWindow)
│   ├── repositories/       — Interfaces (domain contracts, not implementations)
│   └── events/             — Domain events
├── application/
│   └── use-cases/          — Orchestrate domain + infrastructure
├── infrastructure/
│   ├── persistence/        — TypeORM repository implementations
│   └── adapters/           — External service integrations
├── presentation/
│   └── controllers/        — HTTP controllers (input validation, routing)
└── {module}.module.ts
```

### Modules

#### User (`src/modules/user/`)

| Route | Description |
|---|---|
| `POST /users` | Register: `{ name, email, password }` → `{ id }` |
| `POST /users/login` | Login: `{ email, password }` → `{ accessToken }` |

Auth is JWT via `passport-jwt`, signed with `JWT_SECRET`, valid for 7 days.

#### Product (`src/modules/product/`)

| Route | Auth | Description |
|---|---|---|
| `POST /products` | Required | Create product |
| `GET /products` | — | List products |

#### Group Purchase (`src/modules/group-purchase/`)

| Route | Auth | Description |
|---|---|---|
| `POST /group-purchases` | Required | Create group purchase |
| `GET /group-purchases` | — | List (optional `productId` filter, paginated) |
| `GET /group-purchases/:id` | — | Get single group purchase |
| `POST /group-purchases/:id/join` | Required | Join a group purchase |
| `DELETE /group-purchases/:id/leave` | Required | Leave a group purchase |

The creator is automatically added as participant 1. When `currentParticipants >= minimumParticipants`, the status transitions to `CONFIRMED` and a `group_purchase.confirmed` domain event is published. Expired groups are cleaned up by a scheduled job.

### Domain Events

All events are published to the RabbitMQ exchange `domain_events`:

| Event | Trigger |
|---|---|
| `group_purchase.created` | Group purchase created |
| `participant.joined` | User joined a group purchase |
| `participant.left` | User left a group purchase |
| `group_purchase.confirmed` | Minimum participants reached |
| `group_purchase.expired` | Group expired before reaching minimum |

---

## Environment Variables

See `.env.example` for the full list. Key ones:

| Variable | Description |
|---|---|
| `PORT` | Server port (default 3000) |
| `DB_*` | PostgreSQL connection |
| `JWT_SECRET` | Signing key |
| `NODE_ENV` | `development` enables auto-sync |
| `SERVICE_NAME` | OTel service name (default `pinduoduo`) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Tempo endpoint (default `http://localhost:4318`) |

---

---

# Observability

This project is instrumented across all three pillars — metrics, logs, and traces — and wired into a Grafana stack running via Docker Compose. **Grafana at http://localhost:3001 is the single entrypoint for everything.**

## Infrastructure

| Service | Purpose | URL |
|---|---|---|
| Prometheus | Metrics collection and storage | http://localhost:9090 |
| Grafana | Unified UI for all three signals | http://localhost:3001 |
| Loki | Log aggregation | http://localhost:3100 |
| Tempo | Distributed trace storage | http://localhost:3200 |
| RabbitMQ | Domain event broker (management UI) | http://localhost:15672 |

All datasources are pre-provisioned in Grafana — no manual setup needed.

## How Signals Flow

```
HTTP request
    │
    ├─► OpenTelemetry auto-instrumentation ──────────────────► Tempo  (traces)
    │       instruments HTTP, TypeORM, AMQP automatically
    │       injects active trace_id into Winston log context
    │
    ├─► Winston logger ──► ./logs/app-YYYY-MM-DD.log ──► Promtail ──► Loki  (logs)
    │       every line is JSON with trace_id and span_id fields
    │
    └─► HttpMetricsInterceptor ──────────────────────────────► Prometheus  (metrics)
            http_requests_total{method, route, status_code}
            http_request_duration_seconds{method, route, status_code}

Domain event published
    │
    ├─► RabbitMQ exchange `domain_events`
    └─► domain_events_published_total{event_name} ──────────► Prometheus  (metrics)
```

## Key Source Files

```
src/
  instrumentation.ts                    — OTel SDK bootstrap, must be first import in main.ts
  shared/observability/
    logger.ts                           — Winston setup; injects trace_id/span_id per log line
    http-metrics.interceptor.ts         — Increments counter and histogram on every request
    observability.module.ts             — Registers all metric providers, wires interceptor globally

config/
  prometheus.yml                        — Scrapes localhost:3000/metrics every 15s
  loki-config.yml                       — Loki storage config
  tempo-config.yml                      — OTLP HTTP receiver on port 4318
  promtail-config.yml                   — Tails ./logs/*.log, promotes trace_id to a Loki label
  grafana/provisioning/datasources/
    datasources.yml                     — Pre-wires Prometheus, Loki, Tempo datasources
                                          Loki derived field: trace_id label → clickable Tempo link
```

---

## Load Test Scenarios

Install k6 from https://grafana.com/docs/k6/latest/set-up/install-k6/ then use the scripts below to generate traffic.

### General load test

```bash
k6 run load-test/script.js
```

Simulates the full user journey — register → login → create product → create group purchase → list group purchases → list products — with 20 VUs over 70 seconds. Use this to populate Prometheus and Loki with realistic traffic before exploring the cases below.

### Confirmation scenario

```bash
k6 run load-test/confirmation-scenario.js
```

Creates one group purchase with `minimumParticipants: 3`, then races 5 VUs to join it concurrently. The first 2 joiners trigger the `CONFIRMED` transition; the rest get 400. Designed to fire exactly one `group_purchase.confirmed` domain event per run so you can watch it propagate through all three signals.

---

## Observability Cases

### Case 1 — HTTP traffic metrics

**Run first:** `k6 run load-test/script.js`

**Where to look:** Grafana → Explore → Prometheus (or directly at http://localhost:9090)

Request rate broken down by route:
```promql
rate(http_requests_total[1m])
```

p95 latency:
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[1m]))
```

Requests by route and status code:
```promql
http_requests_total
```

**Known gap to explore:** The `HttpMetricsInterceptor` uses RxJS `tap()`, which only fires when the observable completes successfully. Exceptions thrown by controllers (404, 409, 500) cause the observable to error out, so `tap()` is skipped — those requests are silently dropped from the counters. To verify: force a 404 by hitting a non-existent group purchase ID and query `http_requests_total{status_code="404"}`. It will stay at zero. The fix is replacing `tap()` with `finalize()`.

---

### Case 2 — Structured logs and the Loki → Tempo link

**Run first:** `k6 run load-test/script.js`

**Where to look:** Grafana → Explore → Loki datasource

Every log line is JSON. Winston stamps `trace_id` and `span_id` from the active OpenTelemetry span onto each line. Promtail promotes those fields to Loki labels, making them filterable.

All application logs:
```logql
{job="pinduoduo"}
```

Only lines that carry a trace context (emitted during an active HTTP request):
```logql
{job="pinduoduo", trace_id!=""}
```

Filter by log level:
```logql
{job="pinduoduo", level="error"}
```

Search by keyword:
```logql
{job="pinduoduo"} |= "group_purchase"
```

**The Loki → Tempo link:** When a log line has a `trace_id` value, Grafana renders a **Tempo** button next to it. Clicking it opens the full distributed trace for that exact request in a split panel — logs on the left, spans on the right. This works because `datasources.yml` defines a derived field that extracts `trace_id` from the JSON and maps it to the Tempo datasource.

---

### Case 3 — Group purchase confirmation across all three signals

**Run first:** `k6 run load-test/confirmation-scenario.js`

This scenario touches Prometheus, RabbitMQ, and Tempo simultaneously, making it the best case for end-to-end observability exploration.

#### Prometheus — domain event counter

**Where to look:** Grafana → Explore → Prometheus

```promql
domain_events_published_total{event_name="group_purchase.confirmed"}
```

Shows `1` after the first run, `2` after the second, and so on. To see all event types published across both scenarios:

```promql
domain_events_published_total
```

#### RabbitMQ — event broker

**Where to look:** http://localhost:15672 (login: `guest` / `guest`)

- **Exchanges → domain_events:** The "Message rates" graph spikes when the scenario runs.
- **Queues:** A message with routing key `group_purchase.confirmed` appears when the threshold is crossed.

RabbitMQ is an independent confirmation that the event left the application and reached the broker, separate from anything Prometheus reports.

#### Tempo — distributed trace

**Where to look:** Grafana → Explore → Tempo → Search tab

- Service name: `pinduoduo`
- Span name: `POST /group-purchases/:id/join`

Find the join request that triggered confirmation — it will have an AMQP child span that the non-confirming requests (the 400s) do not. Comparing them side by side makes the confirmation boundary visible in the trace.

Full span tree for the confirming request:
```
POST /group-purchases/:id/join
  └─ SELECT group_purchases               (TypeORM read)
  └─ UPDATE group_purchases               (status → CONFIRMED)
  └─ UPSERT group_purchase_participants
  └─ amqp.publish domain_events           (RabbitMQ publish)
       routing_key: group_purchase.confirmed
```

---

## Navigating Grafana

**Explore mode** (compass icon, left sidebar) is the main tool. Select a datasource, write a query in Code mode, and press `Shift+Enter`.

**Split view:** Click "Split" to open two datasources side by side and correlate signals over the same time window — useful for lining up a Prometheus rate spike with the Loki lines that caused it.

**Loki → Tempo jump:** In any Loki result, click the **Tempo** button on a log row with a `trace_id` to open the corresponding trace without leaving Grafana.
