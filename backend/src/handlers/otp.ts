import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { z } from 'zod'

import { createOTP, verifyOTP } from '../services/otpService.js'
import { sendSMS, generateOTPSMS } from '../lib/sms.js'
import { getUserRepository } from '../repositories/userRepository.js'
import { jsonResponse, parseJsonBody } from '../utils/http.js'

const requestOTPSchema = z.object({
  email: z.string().email('Valid email required'),
  phone: z.string().optional(), // Phone number for SMS (if available)
})

const verifyOTPSchema = z.object({
  email: z.string().email('Valid email required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

/**
 * Request OTP for login
 */
export const requestOTPHandler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const payload = parseJsonBody(event)
    const data = requestOTPSchema.parse(payload)

    // Check if user exists
    const repository = getUserRepository()
    const user = await repository.findByEmail(data.email.toLowerCase())
    
    if (!user) {
      return jsonResponse(404, {
        message: 'User not found. Please register first.',
      })
    }

    // Generate OTP
    const otp = await createOTP(data.email.toLowerCase())

    // Send OTP via SMS if phone is provided
    if (data.phone) {
      try {
        const smsMessage = generateOTPSMS(otp)
        await sendSMS({
          to: data.phone,
          message: smsMessage,
        })
      } catch (smsError) {
        console.error('SMS sending failed:', smsError)
        // Continue even if SMS fails - OTP can be retrieved via API for testing
      }
    }

    // In production, also send via email
    // For now, return OTP in development mode only
    return jsonResponse(200, {
      message: 'OTP generated successfully',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined, // Only in dev
      expiresIn: 600, // 10 minutes in seconds
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse(422, {
        message: 'Validation failed',
        issues: error.flatten().fieldErrors,
      })
    }

    return jsonResponse(500, {
      message: error instanceof Error ? error.message : 'Failed to generate OTP',
    })
  }
}

/**
 * Verify OTP and return JWT token
 */
export const verifyOTPHandler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const payload = parseJsonBody(event)
    const data = verifyOTPSchema.parse(payload)

    // Verify OTP
    const isValid = await verifyOTP(data.email.toLowerCase(), data.otp)

    if (!isValid) {
      return jsonResponse(401, {
        message: 'Invalid or expired OTP',
      })
    }

    // Get user and generate token
    const repository = getUserRepository()
    const user = await repository.findByEmail(data.email.toLowerCase())

    if (!user) {
      return jsonResponse(404, {
        message: 'User not found',
      })
    }

    // Import auth service to generate token
    const { signToken } = await import('../services/authService.js')
    const publicUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    }

    const token = signToken(publicUser)

    return jsonResponse(200, {
      message: 'OTP verified successfully',
      token,
      user: publicUser,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse(422, {
        message: 'Validation failed',
        issues: error.flatten().fieldErrors,
      })
    }

    return jsonResponse(500, {
      message: error instanceof Error ? error.message : 'Failed to verify OTP',
    })
  }
}

