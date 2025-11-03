import { neon } from '@netlify/neon'

export default async (request: Request) => {
  const sql = neon(process.env.DATABASE_URL!)
  const url = new URL(request.url)
  const method = request.method
  const searchParams = url.searchParams

  try {
    switch (method) {
      case 'GET': {
        const type = searchParams.get('type') || 'monthly'
        const now = new Date()
        let startDate: Date
        let endDate: Date

        // Calculate date ranges
        switch (type) {
          case 'daily':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
            break
          case 'yearly':
            startDate = new Date(now.getFullYear(), 0, 1)
            endDate = new Date(now.getFullYear() + 1, 0, 1)
            break
          case 'monthly':
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
            break
        }

        // Get filtered loans with customer details
        const loans = await sql`
          SELECT 
            l.*,
            c.first_name,
            c.last_name,
            c.phone,
            c.email
          FROM loans l
          JOIN customers c ON l.customer_id = c.id
          WHERE l.created_at >= ${startDate.toISOString()} 
            AND l.created_at < ${endDate.toISOString()}
          ORDER BY l.created_at DESC
        `

        // Format the data for reports
        const reports = loans.map(loan => {
          const startDate = new Date(loan.start_date)
          const dueDate = new Date(loan.due_date)
          const months = Math.max(1, Math.ceil((dueDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))
          
          // Calculate interest amount
          const principal = parseFloat(loan.principal)
          const interestRate = parseFloat(loan.interest_rate)
          const interestAmount = (principal * interestRate * months) / 100
          const totalAmount = principal + interestAmount
          
          return {
            customer_id: loan.customer_id,
            loan_id: loan.id,
            start_date: loan.start_date.split('T')[0], // Format as YYYY-MM-DD
            name: `${loan.first_name} ${loan.last_name}`,
            phone: loan.phone,
            item: loan.item_description,
            amount: principal,
            due_date: loan.due_date.split('T')[0], // Format as YYYY-MM-DD
            interest_amount: Math.round(interestAmount * 100) / 100, // Round to 2 decimal places
            total_amount: Math.round(totalAmount * 100) / 100 // Round to 2 decimal places
          }
        })

        return new Response(JSON.stringify({ 
          success: true, 
          reports 
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
    console.error('Reports API error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}