# Sprint 4 – Pawn Broker Digital Management App

## Goal
Add automatic loan/repayment calculations, reporting, and finalize deployment.

## Tech Stack
- Frontend: React 19, TypeScript, Tailwind CSS, Redux Toolkit, React Hook Form, dayjs/date-fns, jspdf/xlsx
- Backend: AWS Lambda, API Gateway, DynamoDB, Serverless Framework

## Completed Tasks

### 1. Auto Interest Calculation
- **Backend**: Implemented automatic calculation of total payable amount using the formula: `total = principal + (principal × interestRate × durationMonths)`
- **Files Modified**:
  - `backend/src/types/loan.ts`: Added `totalPayable` and `durationMonths` fields
  - `backend/src/services/loanService.ts`: Added `calculateTotalPayable()` function and updated `createLoan()` to auto-calculate total payable

### 2. Auto Due Date Generator
- **Backend**: Implemented automatic calculation of due date based on start date and duration
- **Files Modified**:
  - `backend/src/services/loanService.ts`: Added `calculateDueDate()` function and updated `createLoan()` to auto-calculate due date

### 3. Reports Dashboard
- **Frontend**: Created a new `/reports` page with financial metrics and export functionality
- **Files Created**:
  - `frontend/src/screens/ReportsPage.tsx`: New reports dashboard with metrics display and export options
- **Files Modified**:
  - `frontend/src/routes/router.tsx`: Added route for reports page
  - `frontend/src/components/layout/AppLayout.tsx`: Added navigation link to reports page
  - `frontend/src/features/loans/types.ts`: Added `ReportData` interface
  - `frontend/src/features/loans/loanSlice.ts`: Added `fetchReportData` thunk

### 4. Backend APIs
- **Backend**: Enhanced APIs for loan creation, repayment processing, and reporting
- **Files Created**:
  - `backend/src/handlers/reports.ts`: New handler for monthly reports
- **Files Modified**:
  - `backend/src/index.ts`: Exported new reports handler
  - `backend/src/services/loanService.ts`: Added `getMonthlyReport()` function
  - `backend/src/handlers/loans.ts`: Added `getMonthlyReportHandler`

### 5. UI Enhancements
- **Frontend**: Added responsive design, improved loading states, and dark mode support
- **Files Modified**:
  - `frontend/tailwind.config.js`: Enabled dark mode with class strategy
  - `frontend/src/index.css`: Added dark mode styles
  - `frontend/src/components/layout/AppLayout.tsx`: Added dark mode toggle and updated styles
  - `frontend/src/screens/ReportsPage.tsx`: Added dark mode support and improved loading states
  - `frontend/src/screens/LoanCreatePage.tsx`: Improved loading states and dark mode support
  - `frontend/src/components/loans/LoanForm.tsx`: Added dark mode support

### 6. Deployment Configurations
- **Backend**: Added Serverless Framework configuration for AWS Lambda deployment
- **Frontend**: Added configuration files for Vercel and AWS Amplify deployment
- **Files Created**:
  - `backend/serverless.yml`: Serverless configuration for AWS deployment
  - `frontend/vercel.json`: Configuration for Vercel deployment
  - `frontend/amplify.yml`: Configuration for AWS Amplify deployment
  - `DEPLOYMENT.md`: Detailed deployment instructions
- **Files Modified**:
  - `backend/package.json`: Added deployment scripts

## New Features

### Loan Creation Process
- Users now enter loan duration in months instead of due date
- System automatically calculates total payable amount and due date
- All calculations follow the specified formula: `total = principal + (principal × interestRate × durationMonths)`

### Reports Dashboard
- Displays key financial metrics:
  - Total Loans
  - Total Principal
  - Total Interest Earned
  - Pending Loans
  - Total Payable
  - Total Repaid
  - Active Loans
  - Redeemed Loans
- Export functionality to CSV and PDF formats

### Dark Mode
- Toggle between light and dark themes
- Persists user preference in localStorage
- Respects system preference by default

### Responsive Design
- Works on mobile, tablet, and desktop devices
- Adaptive grid layouts for different screen sizes

## Dependencies Added

### Backend
- `serverless`: Framework for deploying to AWS Lambda
- `serverless-esbuild`: Plugin for bundling Lambda functions

### Frontend
- `file-saver`: For saving exported files
- `jspdf`: For PDF export functionality
- `jspdf-autotable`: For creating tables in PDF exports
- `xlsx`: For CSV/Excel export functionality

## API Endpoints

### New Endpoints
- `GET /reports/monthly`: Get monthly summary report

### Enhanced Endpoints
- `POST /loans`: Now auto-calculates total payable and due date
- `POST /repayments`: Now auto-updates remaining balance and status

## Environment Variables

### Backend
```
AWS_REGION=us-east-1
DYNAMO_USER_TABLE_NAME=pawn-broker-users
DYNAMO_CUSTOMER_TABLE_NAME=pawn-broker-customers
DYNAMO_LOAN_TABLE_NAME=pawn-broker-loans
DYNAMO_REPAYMENT_TABLE_NAME=pawn-broker-repayments
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=2h
CORS_ORIGIN=https://your-frontend-domain.com
USE_IN_MEMORY_DB=false
```

### Frontend
```
VITE_API_BASE_URL=https://your-api-gateway-url.amazonaws.com/prod
```

## Deployment

### Backend (AWS Lambda)
1. Configure AWS CLI with credentials
2. Set environment variables in `.env` file
3. Run `npm run deploy`

### Frontend (Vercel)
1. Install Vercel CLI
2. Run `vercel`

### Frontend (AWS Amplify)
1. Connect repository in Amplify Console
2. Set build settings as specified in `amplify.yml`

## Testing
The application has been enhanced with improved loading states and error handling throughout the UI.