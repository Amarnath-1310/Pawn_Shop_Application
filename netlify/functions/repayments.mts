import { neon } from '@netlify/neon'

export default async (request: Request) => {
  const sql = neon(process.env.DATABASE_URL!)
  const url = new URL(request.url)
  const method = request.method

  try {
    switch (method) {
      case 'GET': {
        const searchParams = url.searchParams
        const loanId = searchParams.get('loanId')

        let query
        if (loanId) {
          // Get repayments for a specific loan
          query = sql`
            SELECT 
              r.*,
              l.item_description,
              l.total_amount as loan_total,
              c.first_name,
              c.last_name
            FROM repayments r
            JOIN loans l ON r.loan_id = l.id
            JOIN customers c ON l.customer_id = c.id
            WHERE r.loan_id = ${loanId}
            ORDER BY r.payment_date DESC
          `
        } else {
          // Get all repayments
          query = sql`
            SELECT 
              r.*,
              l.item_description,
              l.total_amount as loan_total,
              c.first_name,
              c.last_name
            FROM repayments r
            JOIN loans l ON r.loan_id = l.id
            JOIN customers c ON l.customer_id = c.id
            ORDER BY r.payment_date DESC
          `
        }

        const repayments = await query

        return new Response(JSON.stringify({ 
          success: true, 
          repayments: repayments.map(r => ({
            id: r.id,
            loanId: r.loan_id,
            amount: parseFloat(r.amount),
            paymentDate: r.payment_date,
            method: r.method,
            reference: r.reference,
            notes: r.notes,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            loan: {
              itemDescription: r.item_description,
              totalAmount: parseFloat(r.loan_total)
            },
            customer: {
              firstName: r.first_name,
              lastName: r.last_name
            }
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
        const { loanId, amount, paymentDate, method = 'cash', reference, notes } = body

        if (!loanId || !amount) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Missing required fields: loanId, amount' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // Get loan details to check remaining balance
        const loanData = await sql`
          SELECT 
            l.*,
            COALESCE(SUM(r.amount), 0) as total_repaid
          FROM loans l
          LEFT JOIN repayments r ON l.id = r.loan_id
          WHERE l.id = ${loanId}
          GROUP BY l.id
        `

        if (loanData.length === 0) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Loan not found' 
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        const loan = loanData[0]
        const totalRepaid = parseFloat(loan.total_repaid) || 0
        const remainingBalance = parseFloat(loan.total_amount) - totalRepaid
        const paymentAmount = parseFloat(amount)

        if (paymentAmount > remainingBalance) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Payment amount (${paymentAmount}) exceeds remaining balance (${remainingBalance})` 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // Create repayment record
        const repayment = await sql`
          INSERT INTO repayments (
            loan_id, amount, payment_date, method, reference, notes
          )
          VALUES (
            ${loanId}, ${amount}, ${paymentDate || new Date().toISOString()}, 
            ${method}, ${reference || null}, ${notes || null}
          )
          RETURNING *
        `

        // Check if loan is fully paid and update status
        const newRemainingBalance = remainingBalance - paymentAmount
        if (newRemainingBalance <= 0.01) { // Account for floating point precision
          await sql`
            UPDATE loans 
            SET status = 'PAID', updated_at = CURRENT_TIMESTAMP
            WHERE id = ${loanId}
          `
        }

        // Get updated loan data
        const updatedLoan = await sql`
          SELECT 
            l.*,
            c.first_name,
            c.last_name,
            COALESCE(SUM(r.amount), 0) as total_repaid
          FROM loans l
          JOIN customers c ON l.customer_id = c.id
          LEFT JOIN repayments r ON l.id = r.loan_id
          WHERE l.id = ${loanId}
          GROUP BY l.id, c.id
        `

        return new Response(JSON.stringify({ 
          success: true, 
          repayment: {
            id: repayment[0].id,
            loanId: repayment[0].loan_id,
            amount: parseFloat(repayment[0].amount),
            paymentDate: repayment[0].payment_date,
            method: repayment[0].method,
            reference: repayment[0].reference,
            notes: repayment[0].notes,
            createdAt: repayment[0].created_at,
            updatedAt: repayment[0].updated_at
          },
          loan: {
            id: updatedLoan[0].id,
            status: updatedLoan[0].status,
            totalAmount: parseFloat(updatedLoan[0].total_amount),
            totalRepaid: parseFloat(updatedLoan[0].total_repaid),
            remainingBalance: parseFloat(updatedLoan[0].total_amount) - parseFloat(updatedLoan[0].total_repaid),
            customer: {
              firstName: updatedLoan[0].first_name,
              lastName: updatedLoan[0].last_name
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
    console.error('Repayments API error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}