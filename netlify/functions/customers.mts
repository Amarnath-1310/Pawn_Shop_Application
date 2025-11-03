import { neon } from '@netlify/neon'

export default async (request: Request) => {
  const sql = neon(process.env.DATABASE_URL!)
  const url = new URL(request.url)
  const method = request.method

  try {
    switch (method) {
      case 'GET': {
        // Get all customers with their loan counts
        const customers = await sql`
          SELECT 
            c.*,
            COUNT(l.id) as loan_count,
            COALESCE(SUM(CASE WHEN l.status = 'ACTIVE' THEN 1 ELSE 0 END), 0) as active_loans
          FROM customers c
          LEFT JOIN loans l ON c.id = l.customer_id
          GROUP BY c.id
          ORDER BY c.created_at DESC
        `

        return new Response(JSON.stringify({ 
          success: true, 
          customers: customers.map(c => ({
            id: c.id,
            firstName: c.first_name,
            lastName: c.last_name,
            phone: c.phone,
            email: c.email,
            loanCount: parseInt(c.loan_count),
            activeLoans: parseInt(c.active_loans),
            createdAt: c.created_at,
            updatedAt: c.updated_at
          }))
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        })
      }

      case 'POST': {
        const body = await request.json()
        const { firstName, lastName, phone, email } = body

        if (!firstName || !lastName || !phone) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Missing required fields: firstName, lastName, phone' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        const customer = await sql`
          INSERT INTO customers (first_name, last_name, phone, email)
          VALUES (${firstName}, ${lastName}, ${phone}, ${email || null})
          RETURNING *
        `

        return new Response(JSON.stringify({ 
          success: true, 
          customer: {
            id: customer[0].id,
            firstName: customer[0].first_name,
            lastName: customer[0].last_name,
            phone: customer[0].phone,
            email: customer[0].email,
            createdAt: customer[0].created_at,
            updatedAt: customer[0].updated_at
          }
        }), {
          status: 201,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        })
      }

      case 'PUT': {
        const customerId = url.pathname.split('/').pop()
        if (!customerId || isNaN(Number(customerId))) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Invalid customer ID' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        const body = await request.json()
        const { firstName, lastName, phone, email } = body

        const customer = await sql`
          UPDATE customers 
          SET 
            first_name = ${firstName},
            last_name = ${lastName},
            phone = ${phone},
            email = ${email || null},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${customerId}
          RETURNING *
        `

        if (customer.length === 0) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Customer not found' 
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify({ 
          success: true, 
          customer: {
            id: customer[0].id,
            firstName: customer[0].first_name,
            lastName: customer[0].last_name,
            phone: customer[0].phone,
            email: customer[0].email,
            createdAt: customer[0].created_at,
            updatedAt: customer[0].updated_at
          }
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        })
      }

      case 'DELETE': {
        const customerId = url.pathname.split('/').pop()
        if (!customerId || isNaN(Number(customerId))) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Invalid customer ID' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        const result = await sql`
          DELETE FROM customers WHERE id = ${customerId}
        `

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Customer deleted successfully' 
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        })
      }

      case 'OPTIONS': {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        })
      }

      default:
        return new Response('Method not allowed', { status: 405 })
    }

  } catch (error) {
    console.error('Customers API error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}