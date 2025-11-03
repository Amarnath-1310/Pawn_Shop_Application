# Free Database Setup Guide

## 🎯 **Recommended Free Database Services**

### **1. Supabase (PostgreSQL) - RECOMMENDED**
- ✅ **Free Tier**: 500MB database, 2GB bandwidth/month
- ✅ **Features**: Real-time subscriptions, built-in auth, REST API
- ✅ **Easy Setup**: Web interface, automatic migrations
- ✅ **Perfect for**: Your loan management system

### **2. PlanetScale (MySQL)**
- ✅ **Free Tier**: 1 database, 1GB storage, 1 billion reads/month
- ✅ **Features**: Branching, schema changes without downtime
- ✅ **Serverless**: Auto-scaling

### **3. MongoDB Atlas**
- ✅ **Free Tier**: 512MB storage, shared clusters
- ✅ **Features**: Document database, flexible schema
- ✅ **Global**: Multi-region deployment

### **4. Neon.tech (PostgreSQL)**
- ✅ **Free Tier**: 3GB storage, 1 project
- ✅ **Features**: Serverless PostgreSQL, branching
- ✅ **Modern**: Built for modern applications

## 🚀 **Setup Instructions for Supabase (Recommended)**

### **Step 1: Create Supabase Account**
1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub or email
3. Create a new project
4. Choose a region close to your users

### **Step 2: Get Database Connection Details**
1. Go to **Settings** → **Database**
2. Copy the connection string:
   ```
   postgresql://postgres:[password]@[host]:5432/postgres
   ```

### **Step 3: Update Backend Configuration**
Create/update `backend/.env`:
```bash
# Supabase Database Configuration
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@[host]:5432/postgres"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="24h"

# CORS Configuration
CORS_ORIGIN="http://localhost:5174,https://your-netlify-app.netlify.app"

# Server Configuration
PORT=4002
NODE_ENV="development"
```

### **Step 4: Install Database Dependencies**
```bash
cd backend
npm install prisma @prisma/client pg @types/pg
```

### **Step 5: Initialize Prisma**
```bash
npx prisma init
```

### **Step 6: Create Database Schema**
Update `backend/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Customer {
  id          Int       @id @default(autoincrement())
  firstName   String
  lastName    String
  phone       String    @unique
  email       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  loans       Loan[]

  @@map("customers")
}

model Loan {
  id              Int         @id @default(autoincrement())
  customerId      Int
  itemDescription String
  principal       Float
  interestRate    Float       @default(3.0)
  durationMonths  Int         @default(1)
  totalAmount     Float
  status          LoanStatus  @default(ACTIVE)
  startDate       DateTime    @default(now())
  dueDate         DateTime
  notes           String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  customer        Customer    @relation(fields: [customerId], references: [id])
  repayments      Repayment[]

  @@map("loans")
}

model Repayment {
  id              Int       @id @default(autoincrement())
  loanId          Int
  amount          Float
  paymentDate     DateTime  @default(now())
  method          String    @default("cash")
  reference       String?
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  loan            Loan      @relation(fields: [loanId], references: [id])

  @@map("repayments")
}

enum LoanStatus {
  ACTIVE
  PAID
  DEFAULTED
  LATE
}
```

### **Step 7: Run Database Migration**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### **Step 8: Update Backend Code**
Create `backend/src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### **Step 9: Update API Handlers**
Replace the in-memory repositories with Prisma queries:

Example for `backend/src/services/customerService.ts`:
```typescript
import { prisma } from '../lib/prisma.js'

export const createCustomer = async (data: {
  firstName: string
  lastName: string
  phone: string
  email?: string
}) => {
  return await prisma.customer.create({
    data
  })
}

export const getCustomers = async () => {
  return await prisma.customer.findMany({
    include: {
      loans: true
    }
  })
}

export const getCustomerById = async (id: number) => {
  return await prisma.customer.findUnique({
    where: { id },
    include: {
      loans: {
        include: {
          repayments: true
        }
      }
    }
  })
}
```

## 🔧 **Alternative: MongoDB Atlas Setup**

### **Step 1: Create MongoDB Atlas Account**
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Sign up and create a free cluster
3. Choose AWS/Google Cloud free tier

### **Step 2: Get Connection String**
1. Click **Connect** → **Connect your application**
2. Copy the connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database
   ```

### **Step 3: Install MongoDB Dependencies**
```bash
npm install mongoose @types/mongoose
```

### **Step 4: Create MongoDB Models**
Example `backend/src/models/Customer.ts`:
```typescript
import mongoose from 'mongoose'

const customerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: String,
}, { timestamps: true })

export const Customer = mongoose.model('Customer', customerSchema)
```

## 🎯 **Recommendation: Use Supabase**

For your loan management system, I recommend **Supabase** because:

1. **PostgreSQL**: Relational database perfect for financial data
2. **Free Tier**: Generous limits for development
3. **Built-in Features**: Authentication, real-time updates, REST API
4. **Easy Integration**: Works perfectly with Prisma ORM
5. **Scalable**: Easy to upgrade when you need more resources

## 🚀 **Next Steps**

1. **Choose Database**: Supabase (recommended) or MongoDB Atlas
2. **Create Account**: Sign up for your chosen service
3. **Update Backend**: Replace in-memory data with database calls
4. **Test Connection**: Verify database connectivity
5. **Deploy**: Update environment variables in production

## 📱 **Environment Variables for Deployment**

### **Netlify (Frontend)**
```bash
VITE_API_BASE_URL=https://your-backend-url.com
```

### **Railway/Render (Backend)**
```bash
DATABASE_URL=your-database-connection-string
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://your-netlify-app.netlify.app
PORT=4002
```

Your loan management system will then have persistent data storage with a professional database backend! 🎉