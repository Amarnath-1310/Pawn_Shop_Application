import { v4 as uuid } from 'uuid'

export interface OTPRecord {
  id: string
  email: string
  otp: string
  expiresAt: string
  createdAt: string
}

// In-memory storage for OTPs (in production, use Redis or DynamoDB)
const otpStore = new Map<string, OTPRecord>()

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Create and store OTP for email
 */
export const createOTP = async (email: string): Promise<string> => {
  // Clean up expired OTPs
  const now = Date.now()
  for (const [key, record] of otpStore.entries()) {
    if (new Date(record.expiresAt).getTime() < now) {
      otpStore.delete(key)
    }
  }

  const otp = generateOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  const record: OTPRecord = {
    id: uuid(),
    email: email.toLowerCase(),
    otp,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
  }

  // Remove any existing OTP for this email
  for (const [key, existing] of otpStore.entries()) {
    if (existing.email.toLowerCase() === email.toLowerCase()) {
      otpStore.delete(key)
    }
  }

  otpStore.set(record.id, record)

  return otp
}

/**
 * Verify OTP
 */
export const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
  const now = Date.now()
  
  for (const record of otpStore.values()) {
    if (
      record.email.toLowerCase() === email.toLowerCase() &&
      record.otp === otp &&
      new Date(record.expiresAt).getTime() >= now
    ) {
      // Remove used OTP
      otpStore.delete(record.id)
      return true
    }
  }

  return false
}

/**
 * Get OTP for email (for testing/debugging)
 */
export const getOTP = (email: string): string | null => {
  for (const record of otpStore.values()) {
    if (record.email.toLowerCase() === email.toLowerCase()) {
      const now = Date.now()
      if (new Date(record.expiresAt).getTime() >= now) {
        return record.otp
      }
    }
  }
  return null
}

/**
 * Clear all OTPs (for testing)
 */
export const clearAllOTPs = (): void => {
  otpStore.clear()
}

