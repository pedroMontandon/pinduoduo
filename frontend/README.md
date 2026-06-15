# Pinduoduo — Flutter frontend

Flutter client for the Pinduoduo group-buy backend (NestJS REST API).

## Features

- **Auth**: register + login (JWT stored in secure storage; user id decoded from the token's `sub` claim).
- **Products**: paginated list (infinite scroll + pull-to-refresh), detail, create/edit/delete.
- **Group purchases**: list, detail with **live polling** (participant count + status update every 3s), create (product picker), join/leave.
- Auth-guarded routes via `go_router`; Riverpod for state; Dio for HTTP.

## Architecture

```
lib/
  core/        api (dio + JWT interceptor), config, error mapping, router
  features/
    auth/      data · application (AsyncNotifier) · presentation
    products/  data · application · presentation
    group_purchases/  data · application (polling) · presentation
  shared/      formatters + reusable widgets
```

State pattern per feature: `data` (repository → Dio) · `application` (Riverpod providers) · `presentation` (pages).

## Run

Start the backend first (from repo root):

```bash
docker-compose up -d          # Postgres + RabbitMQ
npm run start:dev             # API on http://localhost:3000
```

Then the app:

```bash
cd frontend
flutter pub get
flutter run -d chrome                 # web (uses http://localhost:3000)
```

### Pointing at a different API

```bash
flutter run --dart-define=API_URL=http://10.0.2.2:3000   # Android emulator → host
```

### Windows desktop

Requires **Developer Mode** (symlink support for plugins):

```
start ms-settings:developers
flutter run -d windows
```

## Test / analyze

```bash
flutter test
flutter analyze
```

## Notes

- The backend has no `/me` or "my group purchases" endpoint, so the current user id is decoded locally from the JWT. Creator membership is known (`creatorId`); other-user membership is inferred from join/leave actions.
- Live updates use polling (3s) because the backend exposes no WebSocket. A future WebSocket gateway would replace the polling provider in `features/group_purchases/application/gp_providers.dart`.
