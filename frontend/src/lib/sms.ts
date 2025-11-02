/**
 * SMS utility functions for sending notifications
 */

export interface SMSMessage {
  to: string
  message: string
}

/**
 * Send SMS using a mock API (for demo purposes)
 * In production, replace with actual SMS service like Twilio, TextBelt, etc.
 */
export const sendSMS = async (smsData: SMSMessage): Promise<{ success: boolean; message: string }> => {
  try {
    // Mock API call - replace with actual SMS service
    const response = await fetch('https://textbelt.com/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: smsData.to,
        message: smsData.message,
        key: 'textbelt', // Use 'textbelt' for testing
      }),
    })

    const result = await response.json()
    
    if (result.success) {
      return { success: true, message: 'SMS sent successfully!' }
    } else {
      return { success: false, message: result.error || 'Failed to send SMS' }
    }
  } catch (error) {
    console.error('SMS Error:', error)
    return { success: false, message: 'Network error while sending SMS' }
  }
}

/**
 * Generate loan creation SMS message
 */
export const generateLoanSMS = (customerName: string, amount: number, startDate: string): string => {
  return `Dear ${customerName}, Your new loan of ₹${amount.toLocaleString()} has been created successfully on ${startDate}. Thank you – Abi & Amar Pawn Shop.`
}

/**
 * Generate welcome SMS for new customers
 */
export const generateWelcomeSMS = (customerName: string): string => {
  return `Welcome ${customerName}, your account has been created with Abi & Amar Pawn Shop. We look forward to serving you!`
}

/**
 * Generate payment confirmation SMS
 */
export const generatePaymentSMS = (customerName: string, amount: number, date: string): string => {
  return `Dear ${customerName}, Your payment of ₹${amount.toLocaleString()} has been recorded successfully on ${date}. Thank you – Abi & Amar Pawn Shop.`
}

/**
 * Calculate loan repayment amount
 */
export const calculateLoanRepayment = (principal: number, interestRate: number, months: number) => {
  // Convert interest rate from decimal to percentage if needed
  const interestPercent = interestRate > 1 ? interestRate : interestRate * 100
  
  // Formula: Total = Principal + (Principal × Interest% × DurationInMonths / 100)
  const totalInterest = (principal * interestPercent * months) / 100
  const totalPayable = principal + totalInterest
  
  return {
    principal,
    interestRate: interestPercent,
    months,
    totalInterest,
    totalPayable
  }
}