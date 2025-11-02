# Implementation Plan

- [ ] 1. Set up new backend project structure and database configuration
  - Create new server directory with Node.js + Express + TypeScript setup
  - Install and configure Prisma ORM with PostgreSQL
  - Set up database connection to Supabase or Neon.tech
  - Configure environment variables for database and JWT secrets
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Implement database schema and migrations
  - Create Prisma schema with Customer, Loan, and Repayment models
  - Generate and run initial database migration
  - Set up database seeding script for development data
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3. Create core backend services and business logic
  - [ ] 3.1 Implement CustomerService with CRUD operations
    - Create customer creation, retrieval, update, and deletion logic
    - Add customer validation and error handling
    - _Requirements: 1.5, 2.5_

  - [ ] 3.2 Implement LoanService with calculation logic
    - Create loan creation with automatic interest and total amount calculation
    - Implement loan status management (Active/Paid)
    - Add loan retrieval and update operations
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.3 Implement RepaymentService with balance updates
    - Create repayment recording with balance calculation
    - Implement automatic loan status update when balance reaches zero
    - Add repayment history retrieval
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.4 Implement DashboardService for statistics
    - Create methods to calculate active loans count
    - Implement total customers count calculation
    - Add total principal amount aggregation
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 4. Create REST API endpoints with Express.js
  - [ ] 4.1 Set up Express server with middleware
    - Configure CORS, JSON parsing, and error handling middleware
    - Set up JWT authentication middleware
    - Create basic server structure with routing
    - _Requirements: 1.5, 6.3_

  - [ ] 4.2 Implement customer API endpoints
    - POST /api/customers - Create new customer
    - GET /api/customers - List all customers
    - GET /api/customers/:id - Get customer by ID
    - PUT /api/customers/:id - Update customer
    - DELETE /api/customers/:id - Delete customer
    - _Requirements: 1.5, 2.5_

  - [ ] 4.3 Implement loan API endpoints
    - POST /api/loans - Create new loan with calculations
    - GET /api/loans - List all loans with customer details
    - GET /api/loans/:id - Get loan by ID with repayments
    - PATCH /api/loans/:id/status - Update loan status
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.4, 4.5_

  - [ ] 4.4 Implement repayment API endpoints
    - POST /api/repayments - Record new repayment
    - GET /api/repayments - List repayments by loan
    - GET /api/loans/:id/repayments - Get repayments for specific loan
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 4.5 Implement dashboard statistics endpoint
    - GET /api/dashboard/stats - Return aggregated statistics
    - Include active loans count, total customers, total principal
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Integrate SMS notification service
  - [ ] 5.1 Set up SMS service integration
    - Configure Twilio or Fast2SMS API credentials
    - Create NotificationService with SMS sending capability
    - Add error handling for SMS service failures
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 5.2 Implement loan creation SMS notifications
    - Integrate SMS notification into loan creation process
    - Format SMS message with loan details
    - Handle SMS failures gracefully without blocking loan creation
    - _Requirements: 5.1, 5.2, 5.5_

- [ ] 6. Update frontend to use real API endpoints
  - [ ] 6.1 Replace mock data with API client
    - Create axios-based API client with authentication
    - Replace all mock data calls with real API requests
    - Add loading states and error handling for API calls
    - _Requirements: 4.4, 4.5_

  - [ ] 6.2 Implement real-time dashboard updates
    - Update dashboard to fetch live statistics from API
    - Add auto-refresh functionality for dashboard data
    - Update statistics after loan and repayment operations
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 6.3 Add authentication state management
    - Implement JWT token storage and management
    - Add authentication interceptors to API client
    - Handle token expiration and refresh
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Implement enhanced UI/UX features
  - [ ] 7.1 Add password visibility toggle
    - Create eye icon component for password fields
    - Implement toggle functionality for password visibility
    - Apply to login form password field
    - _Requirements: 6.1_

  - [ ] 7.2 Update authentication UI flow
    - Replace "Sign In" with "Logout" after successful login
    - Implement logout functionality with state clearing
    - Add authentication state persistence across sessions
    - _Requirements: 6.2, 6.3, 6.5_

  - [ ] 7.3 Convert currency display to Indian Rupees
    - Replace all $ symbols with ₹ throughout the application
    - Format currency amounts according to Indian conventions
    - Apply to loan amounts, repayments, and dashboard totals
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 7.4 Add smooth animations and transitions
    - Implement Framer Motion animations for dashboard transitions
    - Add loading animations during API calls
    - Create smooth transitions for loan list updates
    - Ensure animations don't block user interactions
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 8. Set up deployment and production configuration
  - [ ] 8.1 Configure backend for production deployment
    - Set up production environment variables
    - Configure database connection for production
    - Add production-ready error handling and logging
    - _Requirements: 1.5_

  - [ ] 8.2 Deploy backend to cloud platform
    - Deploy to Render, Railway, or similar platform
    - Configure production database on Supabase or Neon.tech
    - Set up environment variables and secrets
    - Test production API endpoints
    - _Requirements: 1.5_

  - [ ] 8.3 Update frontend for production API
    - Configure production API endpoints in frontend
    - Update CORS settings for production domain
    - Test frontend-backend integration in production
    - _Requirements: 4.4, 4.5_

- [ ] 9. Testing and validation
  - [ ] 9.1 Write unit tests for backend services
    - Create tests for CustomerService business logic
    - Write tests for LoanService calculations and status updates
    - Add tests for RepaymentService balance calculations
    - Test DashboardService statistics aggregation
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

  - [ ] 9.2 Write integration tests for API endpoints
    - Test customer CRUD operations through API
    - Test loan creation and management endpoints
    - Test repayment recording and balance updates
    - Test dashboard statistics endpoint
    - _Requirements: 1.5, 2.4, 2.5, 3.4, 3.5, 4.4, 4.5_

  - [ ] 9.3 Test SMS notification integration
    - Mock SMS service for testing
    - Test SMS sending on loan creation
    - Verify error handling for SMS failures
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 9.4 Test frontend-backend integration
    - Test all API calls from frontend
    - Verify authentication flow works correctly
    - Test real-time dashboard updates
    - Validate currency formatting and animations
    - _Requirements: 4.4, 4.5, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3_