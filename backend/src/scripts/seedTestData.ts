/**
 * Script to seed test data for development and testing
 * Run this with: npm run seed or node dist/scripts/seedTestData.js
 */

import { getCustomerRepository } from '../repositories/customerRepository.js'
import { getLoanRepository } from '../repositories/loanRepository.js'
import { getUserRepository } from '../repositories/userRepository.js'
import { createLoan } from '../services/loanService.js'
import { recordRepayment } from '../services/loanService.js'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'

const seedTestData = async () => {
  console.log('🌱 Starting test data seeding...\n')

  try {
    const customerRepo = getCustomerRepository()
    const loanRepo = getLoanRepository()
    const userRepo = getUserRepository()

    // 1. Create test user
    console.log('1. Creating test user...')
    const testUser = {
      id: uuid(),
      email: 'test@regalpawn.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin' as const,
      passwordHash: await bcrypt.hash('Test123!', 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    try {
      await userRepo.create(testUser)
      console.log('   ✅ Test user created:', testUser.email)
    } catch (err) {
      console.log('   ⚠️  Test user may already exist')
    }

    // 2. Create test customers
    console.log('\n2. Creating test customers...')
    const customers = [
      {
        firstName: 'Raj',
        lastName: 'Kumar',
        email: 'raj.kumar@example.com',
        phone: '+91 9876543210',
      },
      {
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya.sharma@example.com',
        phone: '+91 9876543211',
      },
      {
        firstName: 'Arjun',
        lastName: 'Singh',
        email: 'arjun.singh@example.com',
        phone: '+91 9876543212',
      },
    ]

    const createdCustomers = []
    for (const customerData of customers) {
      try {
        const customer = await customerRepo.create(customerData)
        createdCustomers.push(customer)
        console.log(`   ✅ Created customer: ${customer.firstName} ${customer.lastName}`)
      } catch (err) {
        console.log(`   ⚠️  Customer ${customerData.firstName} may already exist`)
      }
    }

    if (createdCustomers.length === 0) {
      console.log('   ⚠️  No new customers created (may already exist)')
      // Fetch existing customers
      const allCustomers = await customerRepo.list()
      createdCustomers.push(...allCustomers.slice(0, 3))
    }

    // 3. Create test loans
    console.log('\n3. Creating test loans...')
    const loans = []
    for (let i = 0; i < createdCustomers.length; i++) {
      const customer = createdCustomers[i]
      const loanData = {
        customerId: customer.id,
        itemDescription: i === 0 ? 'Gold Chain' : i === 1 ? 'Silver Ring' : 'Diamond Earrings',
        principal: (i + 1) * 500,
        interestRate: 0.03 + (i * 0.01), // 3%, 4%, 5%
        startDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(), // Different start dates
        notes: `Test loan ${i + 1}`,
      }

      try {
        const loan = await createLoan(loanData)
        loans.push(loan)
        console.log(`   ✅ Created loan: ₹${loan.principal} for ${customer.firstName} ${customer.lastName}`)
      } catch (err) {
        console.log(`   ⚠️  Failed to create loan: ${err}`)
      }
    }

    // 4. Create test repayments
    console.log('\n4. Creating test repayments...')
    if (loans.length > 0) {
      const firstLoan = loans[0]
      try {
        await recordRepayment({
          loanId: firstLoan.id,
          amount: firstLoan.principal * 0.5, // 50% repayment
          method: 'cash',
          notes: 'Test repayment',
        })
        console.log(`   ✅ Created repayment: ₹${firstLoan.principal * 0.5} for loan ${firstLoan.id.slice(-6)}`)
      } catch (err) {
        console.log(`   ⚠️  Failed to create repayment: ${err}`)
      }
    }

    console.log('\n✨ Test data seeding completed!')
    console.log('\n📊 Summary:')
    console.log(`   - Users: 1`)
    console.log(`   - Customers: ${createdCustomers.length}`)
    console.log(`   - Loans: ${loans.length}`)
    console.log('\n🔑 Test Credentials:')
    console.log('   Email: test@regalpawn.com')
    console.log('   Password: Test123!')
    console.log('\n💡 For OTP login, use email: test@regalpawn.com')
    console.log('   (OTP will be shown in development mode)')
  } catch (error) {
    console.error('\n❌ Error seeding test data:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('\n✅ Seeding process finished')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error)
      process.exit(1)
    })
}

export { seedTestData }

