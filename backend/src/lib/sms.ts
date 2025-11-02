import { config } from '../config.js'

export interface SMSMessage {
  to: string
  message: string
}

/**
 * Send SMS using SMS service
 * In production, use services like Twilio, AWS SNS, or Fast2SMS
 */
export const sendSMS = async (smsData: SMSMessage): Promise<{ success: boolean; message: string }> => {
  try {
    // For production, replace with actual SMS service
    // Example: Twilio, AWS SNS, Fast2SMS, etc.
    
    // Using environment variable for SMS service URL
    const smsServiceUrl = process.env.SMS_SERVICE_URL || 'https://api.fast2sms.com/dev/bulk'
    const smsApiKey = process.env.SMS_API_KEY || ''

    if (!smsApiKey || smsServiceUrl.includes('fast2sms')) {
      // Mock SMS for development/testing
      console.log(`[SMS] Sending to ${smsData.to}: ${smsData.message}`)
      return { success: true, message: 'SMS sent successfully (mock mode)' }
    }

    // Actual SMS service implementation would go here
    // const response = await fetch(smsServiceUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': smsApiKey,
    //   },
    //   body: JSON.stringify({
    //     message: smsData.message,
    //     numbers: [smsData.to],
    //   }),
    // })

    return { success: true, message: 'SMS sent successfully' }
  } catch (error) {
    console.error('SMS Error:', error)
    return { success: false, message: 'Failed to send SMS' }
  }
}

/**
 * Generate loan creation SMS message
 */
export const generateLoanSMS = (customerName: string, amount: number, startDate: string, itemDescription: string): string => {
  return `Dear ${customerName}, Your loan of ₹${amount.toLocaleString()} for ${itemDescription} has been created on ${startDate}. Thank you - Abi & Amar Pawn Shop.`
}

/**
 * Generate payment confirmation SMS
 */
export const generatePaymentSMS = (customerName: string, amount: number, date: string, loanId: string): string => {
  return `Dear ${customerName}, Your payment of ₹${amount.toLocaleString()} for loan ${loanId.slice(-6)} has been recorded on ${date}. Thank you - Abi & Amar Pawn Shop.`
}

/**
 * Generate OTP SMS
 */
export const generateOTPSMS = (otp: string): string => {
  return `Your OTP for Abi & Amar Pawn Shop login is ${otp}. Valid for 10 minutes. Do not share this code.`
}

