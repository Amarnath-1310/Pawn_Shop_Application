# Deployment Guide

## Backend Deployment (AWS Lambda + DynamoDB)

### Prerequisites
1. AWS Account
2. AWS CLI configured with appropriate credentials
3. Node.js 18.x or later

### Environment Variables
Create a `.env` file in the `backend` directory with the following variables:
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

### Deployment Steps
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Deploy to AWS:
   ```bash
   npm run deploy
   ```

### Updating Functions
To update a specific function:
```bash
npm run deploy:function functionName
```

### Removing the Stack
To remove all AWS resources:
```bash
npm run remove
```

## Frontend Deployment

### Vercel Deployment
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

### AWS Amplify Deployment
1. Go to AWS Amplify Console
2. Connect your repository
3. Set build settings:
   - Build command: `npm run build`
   - Output directory: `dist`

### Environment Variables for Frontend
Set the following environment variable for the frontend:
```
VITE_API_BASE_URL=https://your-api-gateway-url.amazonaws.com/prod
```

## Local Development
1. Start backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```