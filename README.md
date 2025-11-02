# Pawn Broker Management System – Sprint 3

Sprint 3 introduces repayments, loan health automation, and proactive alerts. Brokers can now capture payments, review loan history, and stay ahead of approaching or overdue maturities while the backend keeps statuses and balances in sync.

## Project Structure

- `frontend/` – Vite + React 19 + Tailwind UI, Redux Toolkit slices for auth/customers/loans/repayments, React Hook Form + zod validation, protected routing, and contextual alerts
- `backend/` – TypeScript AWS Lambda handlers for auth, customers, loans, and repayments, JWT authentication, and a DynamoDB repository abstraction with an in-memory fallback for rapid local development

## Prerequisites

- Node.js 20+ (tested with 22.14)
- npm 9+

For optional DynamoDB integration you will also need:

- AWS credentials with access to DynamoDB
- Tables (provisioned manually or via IaC):
  - `pawn-broker-users` (string PK `email`)
  - `pawn-broker-customers` (string PK `id`)
  - `pawn-broker-loans` (string PK `id`)
  - `pawn-broker-repayments` (string PK `id`, GSI on `loanId`)

## Environment Configuration

Copy the sample environment files and adjust as needed:

```bash
cp frontend/env.example frontend/.env
cp backend/env.example backend/.env
```

Key settings:

- `frontend/.env`
  - `VITE_API_BASE_URL` – URL of the backend API (defaults to `http://localhost:4000`)
- `backend/.env`
  - `JWT_SECRET` – change for production
  - `CORS_ORIGIN` – set to the deployed frontend origin
  - `USE_IN_MEMORY_DB` – leave `true` for local development without DynamoDB (Dynamo tables are optional locally)
  - `DYNAMO_USER_TABLE_NAME`, `DYNAMO_CUSTOMER_TABLE_NAME`, `DYNAMO_LOAN_TABLE_NAME`, `DYNAMO_REPAYMENT_TABLE_NAME` – override if your tables use different names
  - *(Optional)* `SNS_TOPIC_ARN` / `SES_SENDER` – configure if you extend notifications via AWS SNS/SES

## Running Locally

### Backend (local Lambda simulator)

```bash
cd backend
npm install
npm run dev
```

This starts a lightweight HTTP server on `http://localhost:4000` that adapts the Lambda handlers. The default in-memory repository includes a demo user and seed customer/loan data:

- Email: `demo@regalpawn.com`
- Password: `Password123!`

To seed the user into DynamoDB instead, disable the in-memory flag and run:

```bash
USE_IN_MEMORY_DB=false npm run seed
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` by default. Update `VITE_API_BASE_URL` if you expose the backend elsewhere.

## Available npm Scripts

| Location  | Script          | Description |
|-----------|-----------------|-------------|
| frontend  | `npm run dev`   | Start Vite dev server |
|           | `npm run build` | Type-check and build production assets |
| backend   | `npm run dev`   | Start local HTTP wrapper around Lambda handlers |
|           | `npm run build` | Type-check and emit compiled Lambda code to `dist/` |
|           | `npm run seed`  | Register the demo user using configured repository |

## API Endpoints (Lambda handlers)

- `POST /auth/register` – Create a new user (email, password, firstName, lastName, role)
- `POST /auth/login` – Authenticate and return `{ token, user }`
- `GET /customers` – List customers (sorted newest first)
- `POST /customers` – Create a customer profile
- `PUT /customers/{id}` – Update customer details
- `DELETE /customers/{id}` – Remove a customer (blocked if any loan is still active/late)
- `GET /loans` – List loans with derived metrics (days until due, outstanding balance) and embedded customer details
- `GET /loans/{id}` – Fetch a single loan with repayment totals and balance breakdown
- `POST /loans` – Create a new pawn loan (defaults status to `ACTIVE`)
- `PATCH /loans/{id}` – Update loan status (`ACTIVE`, `LATE`, `REDEEMED`, `DEFAULTED`)
- `POST /repayments` – Record a payment and recalculate the loan balance/status
- `GET /repayments/{loanId}` – Fetch repayment history for a loan
- `PUT /loans/status` – Batch recompute loan statuses based on repayments/due dates (useful for schedulers)

All responses include CORS headers based on `CORS_ORIGIN` and JWT protection can be applied by wiring API Gateway authorisers.

## Frontend Highlights

- Tailwind gold/white branding with Playfair Display + Inter typography
- React Hook Form + zod across login, customers, loans, and repayments for polished validation
- Dashboard callouts with color-coded due-date alerts (amber for near-due, red for overdue)
- Loan detail workspace with balance summary, repayment timeline, and status badge updates
- New repayment form with payment method tracking and outstanding balance context
- Redux Toolkit state across auth, customers, loans, and repayments backed by Axios API client
- `ProtectedRoute` + `RootRedirect` gating ensures the dashboard stays secured

## Deployment Notes

- **Frontend**: `npm run build` outputs static assets in `frontend/dist/`, deployable to any static host or S3/CloudFront.
- **Backend**: `npm run build` emits ESM files under `backend/dist/`. Exported handlers (`registerHandler`, `loginHandler`, `createCustomerHandler`, etc.) can be wired to AWS Lambda via API Gateway. Provide environment variables through Lambda configuration or AWS Parameter Store.
- Remember to harden secrets and switch `USE_IN_MEMORY_DB` to `false` when integrating with DynamoDB in shared environments.
- Configure IAM policies so the Lambda execution role can access the specified DynamoDB tables.

## Next Steps

- Add automated tests (unit + integration)
- Wire AWS SNS/SES (or another provider) to broadcast due/overdue reminders automatically
- Implement pawn ticket, inventory, and payment APIs
- Expand dashboard with charts/filters and SMS reminders for due loans
- Integrate role-based permissions on the frontend

