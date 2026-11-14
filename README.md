# AirPool

Delay-aware airport cab matching demo built with plain HTML/CSS/ES modules, Express and SQLite. AirPool matches travellers only. It does not operate vehicles or process payments. A traveller books a normal registered cab, and riders settle directly using the displayed estimate. The demo uses simulated flights unless a live provider is configured.

## Setup

```sh
npm install
cp .env.example .env
npm run seed
npm start
```

Open http://localhost:3000. Local demo data is in `db/airpool.db`. Use `npm run dev` for Node watch mode and `npm test` for the service tests. Node 20+ is recommended.

## Connect Supabase

1. Create a Supabase project and copy its Project URL and **secret key** from the dashboard.
2. Add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` to the private `.env` file. The key stays on the server and is never sent to the browser. Legacy projects may use `SUPABASE_SERVICE_ROLE_KEY`.
3. In Supabase SQL Editor, run [`server/db/supabase_schema.sql`](server/db/supabase_schema.sql) once. It creates the Fare Check and Trust & Safety tables, enables RLS, blocks browser-role access, and seeds airports, zones, circles, and editable fare rates.
4. Restart the server. `GET /api/health` reports `storage: "supabase"` when the URL and secret are present. Fare rates, distance cache, fare-check history, signup/OTP, circle membership, private emergency contacts, SOS logs, ratings, contact messages, and events then persist in Supabase. The SQLite database continues to power the simulated live flight/pool demo.

When Supabase is not configured, these features use the local SQLite demo. This workspace does not contain a Supabase project URL or server key, so the live connection becomes active after you set those two values and run the SQL migration. Configure Supabase to make these backend records persistent across server restarts. Auth is handled by the Express backend with bcrypt password hashes and one-time codes stored hashed; the demo code is printed to the server console, so configure an email provider before production use.

## Two-minute demo

1. Open **Live Pools** and scan the seeded Chandigarh and Amritsar groups. A fresh server database is seeded on startup; existing databases are left untouched.
2. Pick a traveller, choose a delay, and press **Delay**. If the updated ready-time gap between pool members exceeds 15 minutes, matching runs again and the Regroup Log shows the change. At 15 minutes or less, the pool stays together and its departure time updates.
3. Press **Add random traveller** to inject another simulated traveller; the SSE feed updates the active screen.
4. Open **Find a Pool**, submit a sample flight to a seeded zone, then return to Live Pools.
5. Open **Fare Check**, compare a quote, and inspect the unofficial distance estimate and editable rate table.

## Delay flow API sequence

```sh
curl -N http://localhost:3000/api/stream
curl -X POST http://localhost:3000/api/demo/delay \
  -H 'Content-Type: application/json' \
  -d '{"requestId":1,"minutes":15}'
curl http://localhost:3000/api/pools
curl http://localhost:3000/api/events
```

The delay endpoint updates the simulated flight estimate and rider ready time. If the gap from another member of that pool exceeds 15 minutes, it recalculates groups and stores/emits a `regroup` event with `moved`, `unchanged` and `newDepartureTimes`. At 15 minutes or less, membership stays intact, the departure time updates, and a `delay-updated` event is stored/emitted. `GET /api/events` shows the persisted sequence.

## Live flight data

`AVIATIONSTACK_KEY` is reserved in `.env.example`; the current demo provider interface and flight cache default to simulated records. Add provider credentials server-side only before enabling Aviationstack polling. Never expose provider secrets in `public/`. Active pool-only polling should be enabled when implementing the provider adapter to limit free-tier quota use.

## Routes and features

- Hash routes: Home, Find a Pool, Live Pools, Fare Check, Trust & Safety, Compare, About, shared demo trip.
- REST and SSE endpoints under `/api`; see `server/index.js`.
- Seeded sample travellers, flights, airport destinations, circle domains and estimated rates.
- Fare Check uses OSRM road distance when available, caches route distances, and falls back to seeded-coordinate Haversine distance; no geocoding is needed.
- Fare split service applies each route segment to riders who remain onboard.
- Vehicle recommendation checks seat and luggage capacities.
- Signup uses bcrypt; verification OTP is printed only by the server in development; session JWT is an httpOnly cookie.
- Security headers, API rate limit, parameterized SQL, field validation, and database foreign keys are enabled.

## Known limitations

- Live Aviationstack polling is not implemented; flights use the simulated provider. Fare Check attempts OSRM road distance and caches it, with a seeded-coordinate Haversine fallback. Pool settlement estimates currently use seeded-coordinate Haversine distance.
- Only domains that exactly match a seeded circle are automatically joined after email verification; circle-first pool ranking needs more product work. Regrouping preserves the largest membership overlaps, but is a lightweight heuristic rather than a global optimiser.
- Account circle verification and ratings are demo-level; SOS and share-trip features are explicitly simulated. Admin rate editing requires signing in with the configured admin email.
- Fare rates are illustrative placeholders, not official quotes. Fare split output in the live demo is an illustrative sample ledger.
- No real cab booking, live location, payment, or emergency dispatch is provided.

## Environment

Copy `.env.example` to `.env`. Set a strong `JWT_SECRET` for any non-demo deployment. `ADMIN_EMAIL` controls the rate-edit API after authentication.
