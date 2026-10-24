# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep the React app thin and declarative: route-level components read from a shared API client, render loading/empty/error states, and never bypass the client with direct `fetch` calls.
- Logic tier decision: Implement the Express API as the application boundary with route validation, service logic, and deliberate 4xx handling so bad input never leaks as a cast error or a 500.
- Data tier decision: Use Mongoose schemas to enforce required fields, defaults, and relationships; seed representative users, teams, activities, and workouts idempotently so the app remains stable across repeated runs.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes`, verify the referenced records exist, reject malformed IDs with a deliberate 4xx, and store the submitted values with computed `points` and `occurredAt`.
- Team management approach: Require `name` and `mascot`, default `members` to an empty array, and keep `members` as ObjectId references for the users assigned to each team.
- Leaderboard approach: Aggregate activity points by team, sum totals, sort descending, and assign sequential ranks starting at 1 so the leaderboard remains deterministic.
- Workout suggestions approach: Match the requested email to a seeded user, inspect that user’s goal or recent activity pattern, and return the best-fit workout suggestions with a human-readable `reason` while returning a 4xx when the user cannot be found.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Failing here means the schema layer is missing required validation and the seeded model contract does not align with the data requirements.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Failing here means the Express route/service layer is not implementing the contract: invalid payloads are not rejected cleanly, leaderboard aggregation is wrong, or workout recommendations do not match recent activity patterns.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Failing here means the presentation tier is still in the placeholder state: loading, empty, and error states are missing, or data is not being fetched through the shared API client.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Use this after the data and API contracts pass to catch TypeScript errors and invalid imports or route/service signatures.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Use this after the UI contract passes to confirm the React app compiles cleanly with the expected API usage and component structure.
