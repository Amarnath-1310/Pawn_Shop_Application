# Requirements Document

## Introduction

This feature transforms the existing loan management system from a frontend-only application with mock data into a full-stack application with a PostgreSQL database backend. The system will provide persistent data storage, real-time calculations, and comprehensive API endpoints for managing customers, loans, and repayments with enhanced user experience features.

## Glossary

- **Loan_Management_System**: The complete application including frontend and backend components
- **Database_Service**: PostgreSQL database hosted on Supabase or Neon.tech
- **Backend_API**: Node.js Express server with Prisma ORM providing REST endpoints
- **Frontend_Client**: Existing React-based user interface
- **Customer_Entity**: Individual borrower with personal information and loan history
- **Loan_Entity**: Financial agreement between customer and lender with terms and status
- **Repayment_Entity**: Payment record against a specific loan
- **SMS_Service**: Third-party notification service (Twilio or Fast2SMS)
- **Dashboard_Component**: Main interface displaying loan statistics and summaries

## Requirements

### Requirement 1

**User Story:** As a loan officer, I want to store customer and loan data in a persistent database, so that information is retained between sessions and can be accessed by multiple users.

#### Acceptance Criteria

1. THE Database_Service SHALL store customer records with id, name, phone, and creation timestamp
2. THE Database_Service SHALL store loan records with customer relationship, item details, financial terms, and status tracking
3. THE Database_Service SHALL store repayment records linked to specific loans with payment amounts and dates
4. THE Database_Service SHALL maintain referential integrity between customers, loans, and repayments
5. THE Database_Service SHALL be accessible via cloud hosting on Supabase or Neon.tech

### Requirement 2

**User Story:** As a loan officer, I want to create new loans with automatic interest calculations, so that loan terms are computed accurately and consistently.

#### Acceptance Criteria

1. WHEN a new loan is created, THE Backend_API SHALL calculate total amount as principal plus interest based on rate and duration
2. THE Backend_API SHALL apply default interest rate of 3.0% if not specified
3. THE Backend_API SHALL store calculated end date based on start date and duration in months
4. THE Backend_API SHALL set initial loan status to "Active"
5. THE Backend_API SHALL create customer record if not existing before loan creation

### Requirement 3

**User Story:** As a loan officer, I want to record repayments and automatically update loan balances, so that loan status reflects current payment state.

#### Acceptance Criteria

1. WHEN a repayment is recorded, THE Backend_API SHALL deduct payment amount from remaining loan balance
2. THE Backend_API SHALL update repayment record with new remaining balance
3. IF remaining balance equals zero, THEN THE Backend_API SHALL update loan status to "Paid"
4. THE Backend_API SHALL maintain payment history for each loan
5. THE Backend_API SHALL validate repayment amount does not exceed remaining balance

### Requirement 4

**User Story:** As a loan officer, I want real-time dashboard statistics, so that I can monitor business performance and loan portfolio status.

#### Acceptance Criteria

1. THE Backend_API SHALL provide endpoint returning count of active loans
2. THE Backend_API SHALL provide endpoint returning total customer count
3. THE Backend_API SHALL provide endpoint returning sum of all loan principal values
4. THE Frontend_Client SHALL fetch and display updated statistics on dashboard load
5. THE Frontend_Client SHALL refresh statistics after loan or repayment operations

### Requirement 5

**User Story:** As a loan officer, I want to receive SMS notifications when new loans are created, so that I can track loan origination activity.

#### Acceptance Criteria

1. WHEN a new loan is created, THE Backend_API SHALL send SMS notification to configured phone number
2. THE SMS_Service SHALL use customer phone number from loan record
3. THE Backend_API SHALL integrate with Twilio or Fast2SMS service
4. THE Backend_API SHALL handle SMS service failures gracefully without blocking loan creation
5. THE SMS_Service SHALL include loan details in notification message

### Requirement 6

**User Story:** As a system user, I want enhanced login security and user experience, so that authentication is both secure and user-friendly.

#### Acceptance Criteria

1. THE Frontend_Client SHALL provide password visibility toggle on login form
2. THE Frontend_Client SHALL replace "Sign In" button with "Logout" after successful authentication
3. THE Frontend_Client SHALL maintain authentication state across browser sessions
4. THE Frontend_Client SHALL redirect to dashboard after successful login
5. THE Frontend_Client SHALL clear authentication state on logout

### Requirement 7

**User Story:** As a user in India, I want currency displayed in Indian Rupees, so that financial amounts are presented in familiar local currency format.

#### Acceptance Criteria

1. THE Frontend_Client SHALL display all monetary values with ₹ symbol instead of $
2. THE Frontend_Client SHALL format currency amounts according to Indian numbering conventions
3. THE Frontend_Client SHALL apply rupee formatting to loan amounts, repayments, and dashboard totals
4. THE Frontend_Client SHALL maintain consistent currency formatting across all components
5. THE Frontend_Client SHALL handle currency conversion if needed for calculations

### Requirement 8

**User Story:** As a system user, I want smooth visual transitions and animations, so that the interface feels responsive and professional.

#### Acceptance Criteria

1. THE Frontend_Client SHALL implement smooth transitions for dashboard component changes
2. THE Frontend_Client SHALL animate loan list updates when new loans are added
3. THE Frontend_Client SHALL provide loading animations during API calls
4. THE Frontend_Client SHALL use Framer Motion or Tailwind animation classes for transitions
5. THE Frontend_Client SHALL maintain animation performance without blocking user interactions