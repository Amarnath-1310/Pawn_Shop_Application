# Quick Database Setup - Supabase Integration

## 🚀 **Quick Setup Commands**

### **1. Install Dependencies**
```bash
cd backend
npm install prisma @prisma/client pg @types/pg
npm install -D prisma
```

### **2. Initialize Prisma**
```bash
npx prisma init
```

### **3. Update Environment Variables**
Update `backend/.env`:
```bash
# Replace with your Supabase connection string
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="24h"

# CORS Configuration
CORS_ORIGIN="http://localhost:5174,https://your-netlify-app.netlify.app"

# Server Configuration
PORT=4002
NODE_ENV="development"
USE_IN_MEMORY_DB=false
```

### **4. Create Database Schema**
The schema is already provided in the guide above. Copy it to `backend/prisma/schema.prisma`

### **5. Run Migration**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### **6. Create Prisma Client**
Create `backend/src/lib/prisma.ts` with the code provided above.

### **7. Update Services**
Replace repository pattern with direct Prisma calls in your service files.

### **8. Test Connection**
```bash
npx prisma studio
```
This opens a web interface to view your database.

## 🎯 **Benefits of This Setup**

- ✅ **Persistent Data**: No more lost data on server restart
- ✅ **Scalable**: Handles thousands of loans and customers
- ✅ **Reliable**: Professional PostgreSQL database
- ✅ **Free**: Supabase free tier is generous
- ✅ **Real-time**: Built-in real-time features
- ✅ **Backup**: Automatic backups included

## 📊 **Database Schema Benefits**

- **Relational**: Proper foreign keys between customers, loans, repayments
- **Indexed**: Fast queries for reports and searches
- **Typed**: Full TypeScript support with Prisma
- **Migrations**: Version-controlled schema changes
- **Validation**: Database-level constraints

Your loan management system will be production-ready with persistent data storage! 🎉