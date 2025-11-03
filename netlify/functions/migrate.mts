import { neon } from '@netlify/neon'

export default async (request: Request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const sql = neon(process.env.DATABASE_URL!)

  try {
    // Create customers table
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create loans table
    await sql`
      CREATE TABLE IF NOT EXISTS loans (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        item_description TEXT NOT NULL,
        principal DECIMAL(10,2) NOT NULL,
        interest_rate DECIMAL(5,2) DEFAULT 3.0,
        duration_months INTEGER DEFAULT 1,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAID', 'DEFAULTED', 'LATE')),
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date TIMESTAMP NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create repayments table
    await sql`
      CREATE TABLE IF NOT EXISTS repayments (
        id SERIAL PRIMARY KEY,
        loan_id INTEGER REFERENCES loans(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        method VARCHAR(20) DEFAULT 'cash' CHECK (method IN ('cash', 'card', 'transfer', 'check')),
        reference VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`
    await sql`CREATE INDEX IF NOT EXISTS idx_loans_customer_id ON loans(customer_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_repayments_loan_id ON repayments(loan_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_repayments_payment_date ON repayments(payment_date)`

    // Insert demo data
    const existingCustomer = await sql`
      SELECT * FROM customers WHERE phone = '+1 (312) 555-0199' LIMIT 1
    `
    
    let customerId
    let demoLoanId

    if (existingCustomer.length === 0) {
      const demoCustomer = await sql`
        INSERT INTO customers (first_name, last_name, phone, email)
        VALUES ('Eleanor', 'Rigby', '+1 (312) 555-0199', 'eleanor@example.com')
        RETURNING id
      `
      customerId = demoCustomer[0].id
    } else {
      customerId = existingCustomer[0].id
    }
    
    // Insert demo loan
    const existingLoan = await sql`
      SELECT * FROM loans WHERE customer_id = ${customerId} LIMIT 1
    `
    
    if (existingLoan.length === 0) {
      const startDate = new Date()
      const dueDate = new Date()
      dueDate.setMonth(dueDate.getMonth() + 1)

      const demoLoan = await sql`
        INSERT INTO loans (
          customer_id, item_description, principal, interest_rate, 
          duration_months, total_amount, status, start_date, due_date
        )
        VALUES (
          ${customerId}, '14k Gold Chain', 650.00, 15.0,
          1, 747.50, 'ACTIVE', ${startDate.toISOString()}, ${dueDate.toISOString()}
        )
        RETURNING id
      `

      demoLoanId = demoLoan[0].id
      
      // Insert demo repayment
      await sql`
        INSERT INTO repayments (loan_id, amount, payment_date, method, reference, notes)
        VALUES (
          ${demoLoanId}, 120.00, ${new Date().toISOString()}, 'cash', 
          'POS-001', 'Initial interest payment'
        )
      `
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'PostgreSQL database initialized successfully',
      customerId: customerId?.toString(),
      demoLoanId: demoLoanId?.toString()
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })

  } catch (error) {
    console.error('Migration error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }
}