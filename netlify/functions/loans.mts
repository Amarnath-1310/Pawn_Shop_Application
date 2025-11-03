import { neon } from '@netlify/neon'

export default async (request: Request) => {
  const sql = neon(process.env.DATABASE_URL!)
  const url = new URL(request.url)
  const method = request.method

  try {
    switch (method) {
      case 'GET': {
        // Get all loans with customer details and repayment totals
        const loans = await sql`
          SELECT 
            l.*,
            c.first_name,
            c.last_name,
            c.phone,
            c.email,
            COALESCE(SUM(r.amount), 0) as total_repaid,
            COUNT(r.id) as repayment_count
          FROM loans l
          JOIN customers c ON l.customer_id = c.id
          LEFT JOIN repayments r ON l.id = r.loan_id
          GROUP BY l.id, c.id
          ORDER BY l.created_at DESC
        `

        return new Response(JSON.stringify({ 
          success: true, 
          loans: loans.map(l => {
            const totalRepaid = parseFloat(l.total_repaid) || 0
            const remainingBalance = parseFloat(l.total_amount) - totalRepaid
            const daysUntilDue = Math.ceil((new Date(l.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            
            return {
              id: l.id,
              customerId: l.customer_id,
              itemDescription: l.item_description,
              principal: parseFloat(l.principal),
              interestRate: parseFloat(l.interest_rate),
              durationMonths: l.duration_months,
              totalAmount: parseFloat(l.total_amount),
              totalRepaid,
              remainingBalance,
              status: l.status,
              startDate: l.start_date,
              dueDate: l.due_date,
              daysUntilDue,
              notes: l.notes,
              createdAt: l.created_at,
              updatedAt: l.updated_at,
              customer: {
                id: l.customer_id,
                firstName: l.first_name,
                lastName: l.last_name,
                phone: l.phone,
                email: l.email
              },
              repaymentCount: parseInt(l.repayment_count)
            }
          })
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
        const { customerId, itemDescription, principal, interestRate = 3.0, durationMonths = 1, startDate, notes } = body

        if (!customerId || !itemDescription || !principal) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Missing required fields: customerId, itemDescription, principal' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // Calculate total amount: principal + (principal * interestRate * durationMonths / 100)
        const totalAmount = parseFloat(principal) + (parseFloat(principal) * parseFloat(interestRate) * parseInt(durationMonths) / 100)
        
        // Calculate due date
        const start = startDate ? new Date(startDate) : new Date()
        const dueDate = new Date(start)
        dueDate.setMonth(dueDate.getMonth() + parseInt(durationMonths))

        const loan = await sql`
          INSERT INTO loans (
            customer_id, item_description, principal, interest_rate, 
            duration_months, total_amount, start_date, due_date, notes
          )
          VALUES (
            ${customerId}, ${itemDescription}, ${principal}, ${interestRate},
            ${durationMonths}, ${totalAmount}, ${start.toISOString()}, ${dueDate.toISOString()}, ${notes || null}
          )
          RETURNING *
        `

        // Get customer details for response
        const customer = await sql`
          SELECT * FROM customers WHERE id = ${customerId}
        `

        return new Response(JSON.stringify({ 
          success: true, 
          loan: {
            id: loan[0].id,
            customerId: loan[0].customer_id,
            itemDescription: loan[0].item_description,
            principal: parseFloat(loan[0].principal),
            interestRate: parseFloat(loan[0].interest_rate),
            durationMonths: loan[0].duration_months,
            totalAmount: parseFloat(loan[0].total_amount),
            totalRepaid: 0,
            remainingBalance: parseFloat(loan[0].total_amount),
            status: loan[0].status,
            startDate: loan[0].start_date,
            dueDate: loan[0].due_date,
            notes: loan[0].notes,
            createdAt: loan[0].created_at,
            updatedAt: loan[0].updated_at,
            customer: {
              id: customer[0].id,
              firstName: customer[0].first_name,
              lastName: customer[0].last_name,
              phone: customer[0].phone,
              email: customer[0].email
            }
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

      case 'PATCH': {
        const loanId = url.pathname.split('/').pop()
        if (!loanId || isNaN(Number(loanId))) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Invalid loan ID' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        const body = await request.json()
        const { status } = body

        if (!status) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Status is required' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        const loan = await sql`
          UPDATE loans 
          SET status = ${status}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${loanId}
          RETURNING *
        `

        if (loan.length === 0) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Loan not found' 
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify({ 
          success: true, 
          loan: {
            id: loan[0].id,
            status: loan[0].status,
            updatedAt: loan[0].updated_at
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

      case 'OPTIONS': {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        })
      }

      default:
        return new Response('Method not allowed', { status: 405 })
    }

  } catch (error) {
    console.error('Loans API error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}