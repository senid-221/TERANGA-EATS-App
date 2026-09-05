# TerangaEats Production Runbook

## 1. Hostinger environment

Set the real values in Hostinger Environment Variables. Do not commit them to GitHub.

Required server variables:

- `APP_URL=https://citymarketbusiness.com`
- `OPENROUTER_API_KEY=<real key>`
- `OPENROUTER_MODEL=openai/gpt-chat-latest`
- `SUPABASE_URL=<real project URL>`
- `SUPABASE_SERVICE_ROLE_KEY=<real service-role key>`
- `WASENDER_API_KEY=<real key>`
- `WASENDER_ADMIN_NUMBER=+250726969060`
- `WASENDER_WEBHOOK_SECRET=<real webhook secret>`
- `WASENDER_API_URL=https://www.wasenderapi.com`
- `ADMIN_EMAIL=rw@akaziconnect.com`
- `ADMIN_PASSWORD=<real password>`
- `ADMIN_SESSION_SECRET=<long random secret>`

Browser build variable:

- `VITE_SUPABASE_URL=<real project URL>`
- `VITE_SUPABASE_ANON_KEY=<real anon/publishable key>`
- `VITE_GOOGLE_MAPS_API_KEY=<restricted browser key>`

Never use the Supabase service-role key or OpenRouter key in a `VITE_*` variable.

## 2. Supabase migrations

Run in order in Supabase SQL Editor:

1. `supabase/schema.sql`
2. `supabase/0002_fix_order_total_validation.sql`
3. `supabase/driver_migration.sql`
4. `supabase/0003_production_hardening.sql`
5. `supabase/seed_teranga_restaurant.sql` (if starter data is wanted)

The production hardening migration adds order idempotency, notification logging, driver tables/fields, and server-only settings.

## 3. Hostinger build

Build command:

```bash
npm install --no-audit --no-fund && npm run build
```

Start command:

```bash
npm start
```

Node: 22.x.

The server intentionally exits if `dist/index.html` is missing instead of pretending a production build exists.

## 4. WasenderAPI

Webhook URL:

`https://citymarketbusiness.com/api/whatsapp/webhook`

Enable the required webhook events in the Wasender session settings and keep the webhook secret in Hostinger only.

The order API sends the new-order WhatsApp notification server-side. Failed notifications are recorded and can be retried by an authenticated admin.

## 5. Production smoke tests

After deployment verify:

- `GET /api/health` returns `ok: true`.
- `/admin` shows the login screen.
- Wrong admin credentials show `Email or password is incorrect`.
- Correct admin credentials create the secure cookie and load the dashboard.
- Logout clears the session and returns to `/admin`.
- A real checkout creates exactly one order even if the request is retried.
- The new order appears in Admin within a few seconds.
- Admin WhatsApp receives the order with customer contact, items, total and Google Maps link.
- If WhatsApp fails, Admin can retry it from the order row.
- Driver assignment and driver status transitions work in sequence.
- Driver GPS is shown only when an actual GPS coordinate is received; no simulated movement is used.
- AI Helper responds through the server-side OpenRouter integration.
- Google Maps loads with the restricted production key.

## 6. Payment status

Wave, Orange Money and MTN are not marked as paid by the application. Until each provider's real checkout/verification credentials and webhook are configured, those methods remain `pending`. Cash on delivery uses `cash_pending`.

Do not replace this with simulated payment success.
