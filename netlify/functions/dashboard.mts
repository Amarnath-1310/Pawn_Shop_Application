import { neon } from '@netlify/neon'

export default async (request: Request) => {
  const sql = neon(process.env.DATABASE_URL!)
  const method = request.method

  try {
    switch (method) {
      case 'GET': {
        // Get comprehensive dashboard statistics
        const stats = await sql`
          SELECT 
            COUNT(DISTINCT c.id) as total_customers,
            COUNT(l.id) as total_loans,
            COUNT(CASE WHEN l.status = 'ACTIVE' THEN 1 END) as active_loans,
            COUNT(CASE WHEN l.status = 'PAID' THEN 1 END) as paid_loans,
            COUNT(CASE WHEN l.status = 'DEFAULTED' THEN 1 END) as defaulted_loans,
            COALESCE(SUM(l.principal), 0) as total_principal,
            COALESCE(SUM(l.total_amount), 0) as total_payable,
            COALESCE(SUM(r.amount), 0) as total_repaid
          FROM customers c
          LEFT JOIN loans l ON c.id = l.customer_id
          LEFT JOIN repayments r ON l.id = r.loan_id
        `

        const result = stats[0]
        const totalPrincipal = parseFloat(result.total_principal) || 0
        const totalPayable = parseFloat(result.total_payable) || 0
        const totalRepaid = parseFloat(result.total_repaid) || 0
        const totalInterestEarned = totalPayable - totalPrincipal

        // Get recent loans for dashboard
        const recentLoans = await sql`
          SELECT 
            l.*,
            c.first_name,
            c.last_name,
            c.phone,
            COALESCE(SUM(r.amount), 0) as total_repaid
          FROM loans l
          JOIN customers c ON l.customer_id = c.id
          LEFT JOIN repayments r ON l.id = r.loan_id
          GROUP BY l.id, c.id
          ORDER BY l.created_at DESC
          LIMIT 5
        `

        const formattedLoans = recentLoans.map(loan => {
          const totalRepaid = parseFloat(loan.total_repaid) || 0
          const remainingBalance = parseFloat(loan.total_amount) - totalRepaid
          const daysUntilDue = Math.ceil((new Date(loan.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          
          return {
            id: loan.id,
            customerId: loan.customer_id,
            itemDescription: loan.item_description,
            principal: parseFloat(loan.principal),
            totalAmount: parseFloat(loan.total_amount),
            totalRepaid,
            remainingBalance,
            status: loan.status,
            startDate: loan.start_date,
            dueDate: loan.due_date,
            daysUntilDue,
            customer: {
              id: loan.customer_id,
              firstName: loan.first_name,
              lastName: loan.last_name,
              phone: loan.phone
            }
          }
        })

        return new Response(JSON.stringify({ 
          success: true, 
          stats: {
            totalCustomers: parseInt(result.total_customers),
            totalLoans: parseInt(result.total_loans),
            activeLoans: parseInt(result.active_loans),
            paidLoans: parseInt(result.paid_loans),
            defaultedLoans: parseInt(result.defaulted_loans),
            totalPrincipal,
            totalPayable,
            totalRepaid,
            totalInterestEarned,
            pendingLoans: parseInt(result.active_loans) // Same as active loans
          },
          recentLoans: formattedLoans
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
    console.error('Dashboard API error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}