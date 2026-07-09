# Rugby Tyre Services WhatsApp Business Platform

Phase 1 builds the foundation for a WhatsApp-native operations system for Rugby Tyre Services in Rugby, England. Phase 1.5 adds a polished public customer landing page while keeping the staff dashboard protected. Customers interact through WhatsApp or phone. The owner and staff use a lightweight dashboard only where it helps them see conversations, handoffs, customers, tyre catalogue entries, and system health.

This repository is intended to follow the delivery path:

1. Codex builds in GitHub.
2. GitHub stores and reviews changes through a pull request.
3. Replit deploys and runs the merged application later.

Replit deployment is intentionally not part of Phase 1.

## Business Context

Rugby Tyre Services currently works through phone calls, walk-ins, WhatsApp/text messages, paper service logs, supplier delivery notes, manual bank transfer messages, card terminal payments, and mobile/emergency callout coordination.

The product goal is not to force a busy shop into complex software. The goal is to keep WhatsApp as the customer-facing interface and put helpful automation behind it.

## Architecture Overview

The codebase keeps reusable WhatsApp trades-business logic separate from tyre-specific logic:

- `core/`: reusable platform logic for WhatsApp webhook handling, Twilio signature verification, message logging, conversation state, generic handoff, audit logging, health checks, validation, security middleware, and future job/booking/payment foundations.
- `modules/tyres/`: tyre-specific logic for tyre size parsing, normalisation, catalogue lookup, tyre seed data, and the Rugby Tyre Phase 1 WhatsApp menu behavior.
- `server/`: Express routes, Prisma-backed repositories, Twilio outbound sending, and API composition.
- `dashboard/`: React + Vite public landing page, admin login, and owner dashboard.
- `prisma/`: PostgreSQL schema, migration, and seed script.

Core code does not contain tyre-size parsing or tyre catalogue rules. Tyre logic lives in `modules/tyres`.

## Technology Stack

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM
- Zod
- dotenv
- Vitest
- React + Vite
- Tailwind CSS
- Lucide icons
- Phase 1 admin access with `ADMIN_PASSWORD`

## What Is Live In Phase 1

- Public landing page at `/`
- Staff login route at `/admin`
- Protected staff dashboard routes at `/dashboard` and `/dashboard/*`
- Express TypeScript backend
- PostgreSQL Prisma schema and migration
- Twilio WhatsApp webhook endpoint at `POST /webhooks/twilio/whatsapp`
- Twilio signature verification when a Twilio signing secret/auth token is configured
- Customer creation from WhatsApp phone number
- Conversation creation and state tracking
- Inbound and outbound message logging
- Greeting/menu flow
- Option 3 tyre size and price lookup
- Seed tyre catalogue with placeholder common sizes and prices
- Human handoff triggers and handoff dashboard page
- Dashboard home, conversations, customers, tyre catalogue, handoffs, and settings placeholder
- Health endpoint at `GET /health`
- Admin-password protected dashboard APIs
- Tests for parser, lookup, routing, retry/handoff behavior, signature rejection, and message logging

## What Is Live In Phase 2

Phase 2 turns the dashboard into a practical job control centre for the owner:

- Manual job capture for phone, walk-in, and direct customer work
- Protected jobs/schedule board at `/dashboard/jobs`
- Job detail view with owner status actions
- WhatsApp mobile job intake flow from menu option `2`
- Pending WhatsApp jobs created with `status = awaiting_owner_confirmation`
- Owner-controlled confirmation, cancellation, reschedule, no-show, progress, payment, and completion statuses
- Cancellation and reschedule intent detection from WhatsApp
- Basic WhatsApp confirmation/cancellation/reschedule messages after owner action
- Job source, urgency, payment status, customer, vehicle, tyre, address/location, and notes tracking
- Dashboard home job summary cards for today's jobs, pending WhatsApp requests, emergency jobs, reschedules, cancellations, and payment pending
- Database migration adding Phase 2 job fields and conversation state data

The owner remains in control. WhatsApp intake records a request, but it does not fully confirm the job until the owner confirms it.

## Route Structure

- `/`: public customer-facing landing page for Rugby Tyre Services
- `/admin`: staff/admin login page
- `/dashboard`: protected operations dashboard
- `/dashboard/jobs`: protected jobs and schedule board
- `/dashboard/jobs/:id`: protected job detail view
- `/dashboard/conversations`: protected conversations page
- `/dashboard/customers`: protected customers page
- `/dashboard/tyres`: protected tyre catalogue page
- `/dashboard/handoffs`: protected handoffs page
- `/dashboard/settings`: protected settings placeholder
- `/health`: public health endpoint
- `/webhooks/twilio/whatsapp`: Twilio WhatsApp webhook endpoint
- `/api/*`: backend API routes

Unauthenticated staff users who visit dashboard routes see the staff login experience. Dashboard data APIs are protected by the admin session middleware.

## What Is Stubbed In Phase 1

- Full appointment booking
- Mobile/emergency callout workflow
- Dashboard-based WhatsApp replies
- Stripe or bank transfer automation
- Google Maps/location routing
- AI/Claude integration
- Supplier delivery logging
- Full reporting
- Staff rota
- Accounting integrations
- Multi-tenant SaaS controls

Option 1 in WhatsApp intentionally replies with a coming-soon message and triggers human handoff. Option 2 now starts structured mobile tyre job intake.

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Set at minimum:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
SESSION_SECRET=replace-with-at-least-16-characters
ADMIN_PASSWORD=replace-with-a-real-password
VITE_PUBLIC_BUSINESS_NAME=Rugby Tyre Services
VITE_PUBLIC_BUSINESS_LOCATION=Rugby, England
```

Add public contact CTAs when the owner confirms them:

```bash
VITE_PUBLIC_WHATSAPP_URL=https://wa.me/...
VITE_PUBLIC_PHONE_NUMBER=...
```

Generate Prisma Client:

```bash
npm run db:generate
```

Run the database migration:

```bash
npm run db:migrate
```

Seed placeholder tyre data:

```bash
npm run db:seed
```

Run tests:

```bash
npm test
```

Build server and dashboard:

```bash
npm run build
```

Start the backend:

```bash
npm run dev
```

Run the Vite dashboard during local development:

```bash
npm run dev:dashboard
```

After a production build, the Express app serves the public site and staff routes from:

```text
/
/admin
/dashboard
/dashboard/conversations
/dashboard/customers
/dashboard/tyres
/dashboard/handoffs
/dashboard/settings
```

## Environment Variables

Required for Phase 1:

```bash
DATABASE_URL=
SESSION_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
TWILIO_WEBHOOK_SECRET=
ADMIN_PASSWORD=
VITE_PUBLIC_WHATSAPP_URL=
VITE_PUBLIC_PHONE_NUMBER=
VITE_PUBLIC_BUSINESS_NAME=Rugby Tyre Services
VITE_PUBLIC_BUSINESS_LOCATION=Rugby, England
```

The `VITE_PUBLIC_*` values are safe for frontend use. Do not expose private Twilio credentials such as `TWILIO_ACCOUNT_SID` or `TWILIO_AUTH_TOKEN` in frontend code.

Future phase placeholders:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
GOOGLE_MAPS_API_KEY=
ANTHROPIC_API_KEY=
BANK_ACCOUNT_NAME=
BANK_SORT_CODE=
BANK_ACCOUNT_NUMBER=
BUSINESS_ADDRESS=
```

## Backend Endpoints

Public/system:

- `GET /`
- `GET /admin`
- `GET /health`
- `POST /webhooks/twilio/whatsapp`

Auth:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

Dashboard APIs:

- `GET /api/dashboard/summary`
- `GET /api/dashboard/jobs`
- `POST /api/dashboard/jobs`
- `GET /api/dashboard/jobs/:id`
- `PATCH /api/dashboard/jobs/:id`
- `PATCH /api/dashboard/jobs/:id/status`
- `GET /api/dashboard/conversations`
- `GET /api/dashboard/conversations/:id`
- `GET /api/dashboard/customers`
- `GET /api/dashboard/tyres`
- `POST /api/dashboard/tyres`
- `PATCH /api/dashboard/tyres/:id`
- `GET /api/dashboard/handoffs`
- `PATCH /api/dashboard/handoffs/:id/resolve`
- `GET /api/dashboard/settings`

Dashboard frontend routes are served under `/dashboard/*` and remain protected by the frontend session check plus protected `/api/dashboard/*` endpoints.

## Twilio WhatsApp Setup Notes

Configure the Twilio WhatsApp sandbox or approved WhatsApp sender to call:

```text
POST https://YOUR_DOMAIN/webhooks/twilio/whatsapp
```

Use `application/x-www-form-urlencoded`, which is Twilio's normal webhook format.

Set:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER`
- `TWILIO_WEBHOOK_SECRET` if using a separate signing secret

The webhook rejects invalid Twilio signatures when `TWILIO_AUTH_TOKEN` or `TWILIO_WEBHOOK_SECRET` is configured. In local development, if no Twilio signing secret is present, the route can be exercised without signature validation. Production should always configure a signing secret/auth token.

## WhatsApp Phase 1 Flow

First message reply:

```text
Hi, this is Rugby Tyre Services.

How can we help?

1. Book an in-shop appointment
2. Mobile / emergency tyre callout
3. Check tyre size or price
4. Talk to someone
```

Phase 1 behavior:

- `1`: appointment booking coming soon, then human handoff
- `2`: starts structured mobile tyre job intake
- `3`: asks for tyre size and performs lookup
- `4`: human handoff
- `HELP`, `HUMAN`, `CALL`, or `SPEAK TO SOMEONE`: human handoff
- Unknown messages: asks the customer to choose again
- Two failed attempts: marks the conversation as `handoff_required`

Tyre lookup accepts:

- `205/55/R16`
- `205/55/16`
- `205 55 16`
- `205-55-16`
- `2055516`

All are normalised to `205/55/R16`.

## Phase 2 Job Workflow

### Manual Job Capture

Staff can create jobs from `/dashboard/jobs` for traditional shop workflows:

- Customer name
- Phone number
- Vehicle registration
- Tyre size
- Tyre brand/category
- Job type
- Job source
- Service required
- Issue description
- Address/location text
- Preferred date
- Preferred time
- Urgency
- Price estimate
- Internal notes
- Payment status

Manual saves require only customer phone or customer name, job type, and service required. Defaults are intentionally quick:

- `source = manual`
- `status = confirmed`
- `payment_status = pending`
- `urgency = unknown`

Manual source options are `manual`, `walk_in`, and `phone`.

### WhatsApp Mobile Job Intake

When a customer chooses option `2` from the WhatsApp menu, the assistant collects mobile tyre service details one question at a time:

1. Customer name
2. Vehicle registration
3. Tyre size or tyre-wall photo
4. Issue type
5. Address, postcode, or WhatsApp location
6. Whether the vehicle is at home, work, roadside, or elsewhere
7. Preferred service date/time text
8. Urgency
9. Additional notes

The system creates a job with:

- `source = whatsapp`
- `job_type = mobile` or `emergency_mobile`
- `status = awaiting_owner_confirmation`

The customer receives:

```text
Thanks. Your mobile tyre request has been received.

Rugby Tyre Services will confirm availability and timing shortly.
```

### Job Sources

Supported source values:

- `manual`: owner/staff manually entered the job
- `walk_in`: customer came into the shop
- `whatsapp`: captured through WhatsApp intake
- `phone`: owner/staff manually entered after a phone call
- `future_phone_ai`: reserved for a later phone-call AI assistant

### Job Types

Supported job types:

- `mobile`
- `emergency_mobile`
- `in_shop`
- `walk_in`
- `phone_booking`
- `other`

### Job Statuses

Supported lifecycle statuses:

- `new_request`
- `awaiting_owner_confirmation`
- `confirmed`
- `scheduled`
- `reschedule_requested`
- `rescheduled`
- `cancellation_requested`
- `cancelled`
- `no_show`
- `en_route`
- `arrived`
- `in_progress`
- `completed`
- `payment_pending`
- `paid`
- `unable_to_complete`

The schedule board shows status and source badges on every job card. Emergency jobs are highlighted.

### Cancellation And Rebooking

WhatsApp cancellation phrases such as `cancel my booking`, `I can't make it`, and `I no longer need it` are detected when there is one clear active job. The job is moved to `cancellation_requested`, the customer is told the request has been sent to Rugby Tyre Services, and the dashboard highlights it for owner review.

WhatsApp reschedule phrases such as `can you come later?`, `can I move it to tomorrow?`, and `can I rebook?` are detected when there is one clear active job. The system asks for the preferred new time, stores the text, and shows the job as `reschedule_requested`.

The system does not automatically cancel or reschedule confirmed work without owner approval.

### Payment Status Foundation

Payment links are not built yet. Phase 2 supports manual payment status tracking:

- `not_required`
- `pending`
- `payment_pending`
- `paid`
- `part_paid`
- `failed`

## Seed Tyre Catalogue

The seed script creates placeholder Budget, Mid-range, and Premium options for:

- `195/55/R16`
- `205/55/R16`
- `225/45/R17`
- `225/40/R18`
- `215/55/R17`
- `205/60/R16`
- `195/65/R15`
- `235/45/R18`
- `215/60/R16`
- `255/35/R19`

All seeded prices are explicitly marked as placeholder data and must be replaced with real Rugby Tyre Services pricing.

## Replit Deployment Notes

Do not deploy Phase 2 before the PR is reviewed and merged into `main`.

When ready:

1. Import the GitHub repository into Replit.
2. Add the environment variables listed above.
3. Provision PostgreSQL and set `DATABASE_URL`.
4. Run `npm install`.
5. Run `npm run db:generate`.
6. Run `npm run db:migrate` to apply the Phase 2 jobs migration.
7. Run `npm run db:seed`.
8. Run `npm run build`.
9. Start with `npm start`.
10. Configure the Twilio webhook to the Replit public URL plus `/webhooks/twilio/whatsapp`.
11. Set `VITE_PUBLIC_WHATSAPP_URL` and `VITE_PUBLIC_PHONE_NUMBER` before building if the public CTAs should link directly to WhatsApp and phone.

After deployment:

- `/` should show the public landing page.
- `/admin` should show staff login.
- `/dashboard` should require staff authentication.
- `/health` and `/webhooks/twilio/whatsapp` should remain available.

## Security Notes

- No secrets are hardcoded.
- Dashboard data APIs require an admin session created from `ADMIN_PASSWORD`.
- Session cookies are HTTP-only and signed with `SESSION_SECRET`.
- Twilio webhook signature verification is implemented.
- Webhook route has basic rate limiting.
- Inbound bodies are trimmed and capped before logging.
- Raw webhook payloads are stored for debugging/audit but are not shown in the dashboard UI.
- Public frontend code uses only `VITE_PUBLIC_*` contact values and does not expose Twilio secrets.
- Audit logs are written for handoff events and tyre catalogue changes.
- Production dependency audit check used: `npm audit --omit=dev --audit-level=critical`.

## Known Limitations

- The tyre catalogue uses placeholder seed prices.
- Public WhatsApp and phone CTAs need the owner-confirmed WhatsApp URL and phone number.
- The public page uses safe trust wording but does not include real testimonials yet.
- Owner must still confirm WhatsApp job requests manually.
- Dashboard WhatsApp messaging is limited to owner action messages for confirmation, cancellation, and reschedule outcomes.
- Phone-call AI assistant is not built yet.
- Google Maps/geocoding is not built yet.
- Stripe/payment links are not built yet.
- AI/Claude free-text interpretation is not built yet.
- Scheduling does not yet optimise routes.
- Media/photo files are logged as metadata only; no image processing or owner preview is built yet.
- No Stripe, bank transfer automation, maps, AI, reporting, supplier delivery, rota, or accounting features are built.
- Dashboard auth is intentionally simple for Phase 1 and should evolve before wider staff rollout.
- A real PostgreSQL database is required for runtime dashboard/webhook persistence.

## Planned Features / Future Phases

### Service Catalogue

Future service catalogue should support:

- Puncture repair
- Tyre replacement
- Wheel balancing
- Valve replacement
- Locking wheel nut issue
- Mobile callout fee
- Emergency surcharge
- Wheel alignment if offered
- Other roadside services if added later

Future tables should include:

- `service_catalogue`
- `service_prices`
- `service_items_on_job`

### Manual Walk-In Workflow

Future dashboard support should include Quick Add Walk-In Job with:

- Vehicle registration
- Customer name optional
- Phone optional
- Tyre size
- Service done
- Price
- Payment method
- Notes

### Quote Workflow

Future workflow:

```text
Enquiry -> Quote Sent -> Accepted -> Booked -> Confirmed -> Completed -> Paid
```

Also support quote declined and quote expired.

### Deeper Cancellation and Rebooking Workflow

Phase 2 supports simple cancellation and reschedule requests. Later phases should deepen this workflow for customers messaging:

- Can I come later?
- Can I change to tomorrow?
- I cannot make it today.
- Cancel my booking.
- Are you free this afternoon instead?

Future booking statuses:

- confirmed
- reschedule_requested
- rescheduled
- cancellation_requested
- cancelled
- no_show
- completed

Future cancellation workflow:

1. Customer asks to cancel.
2. System identifies active booking.
3. If clearly matched, cancel or request owner approval depending on settings.
4. If unclear, trigger handoff.
5. Send cancellation confirmation.

Future cancellation message:

```text
Your appointment has been cancelled.

Reference: RTS-1042

Reply BOOK if you would like to make a new appointment.
```

Future rebooking workflow:

1. Customer asks to move appointment.
2. System identifies active booking.
3. System asks for preferred new date/time.
4. System checks availability.
5. System confirms new slot or triggers handoff.

Future rebooking message:

```text
Your appointment has been changed.

New date: Tuesday 14 July
New time: 2:30pm
Vehicle: AB12 CDE
Reference: RTS-1042
```

### WhatsApp Media And Photo Support

Customers may send photos of:

- Tyre wall
- Damaged tyre
- Vehicle location
- Dashboard warning
- Supplier delivery notes

Phase 1 logs media metadata. Full image handling should be added later.

### CSV Import And Export

Future features:

- CSV tyre catalogue import
- CSV job export
- CSV payment export
- CSV supplier delivery export

### Owner Settings

Future settings should include:

- Opening hours
- Booking capacity
- Mobile callout availability
- Bank details
- WhatsApp templates
- Emergency message wording
- Shop address
- Admin users
- Privacy/data retention settings

### Privacy And Data Retention

Future privacy features:

- Customer delete function
- Customer export function
- Location retention rule
- Basic privacy notice
- Avoid unnecessary long-term storage of location data

### Operational Monitoring

Future monitoring should include:

- Webhook health page
- Failed message log
- Twilio delivery error log
- Last webhook received timestamp
- Database connection status
- System status card

## Phase 3 Planning Note

Phase 3: Phone-Call AI Assistant

Do not build phone-call AI until a later phase. The future phone-call AI assistant should:

1. Answer or handle overflow calls
2. Collect customer name
3. Collect callback number
4. Collect vehicle registration
5. Collect tyre size
6. Collect issue description
7. Collect address
8. Collect preferred time
9. Collect urgency
10. Create pending job with source `future_phone_ai`
11. Let owner confirm before customer receives final booking confirmation

Phase 3 should build on the Phase 2 job source and owner approval model.

## Information Needed From Rugby Tyre Services

1. Confirmed business name
2. Business address
3. WhatsApp Business number
4. Opening hours
5. Whether mobile service is truly 24/7
6. Appointment capacity per day
7. Appointment slot length
8. Current bank payment details
9. Whether Stripe is acceptable later
10. Real tyre price list
11. Common tyre sizes
12. Supplier names
13. Staff/technician names
14. Preferred wording for confirmation messages
15. Preferred wording for payment messages
16. Cancellation/rebooking policy
17. Whether owner wants dashboard replies or WhatsApp-only replies
18. Real public WhatsApp link
19. Real public phone number
20. Exact address or preferred public service area wording
21. Whether 24hr mobile service should be worded as always available or subject to confirmation
22. Final approved service list for the public page
23. Real review wording if the owner wants testimonials
