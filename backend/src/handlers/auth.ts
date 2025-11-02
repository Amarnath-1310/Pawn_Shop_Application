import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyResult,
} from 'aws-lambda'
import { ZodError } from 'zod'

import { loginUser, registerUser } from '../services/authService.js'
import { jsonResponse, parseJsonBody } from '../utils/http.js'

const handleError = (error: unknown, defaultStatus = 400): APIGatewayProxyResult => {
  if (error instanceof ZodError) {
    return jsonResponse(422, {
      message: 'Validation failed',
      issues: error.flatten().fieldErrors,
    })
  }

  if (error instanceof Error) {
    return jsonResponse(defaultStatus, { message: error.message })
  }

  return jsonResponse(500, { message: 'Unexpected error' })
}

const withParsedBody = <T>(
  handler: (event: APIGatewayProxyEventV2, body: unknown) => Promise<APIGatewayProxyResult>,
): APIGatewayProxyHandlerV2 => {
  return async (event) => {
    try {
      const body = parseJsonBody<unknown>(event)
      return await handler(event, body)
    } catch (error) {
      return handleError(error, 400)
    }
  }
}

export const registerHandler: APIGatewayProxyHandlerV2 = withParsedBody(async (_event, body) => {
  try {
    const result = await registerUser(body)
    return jsonResponse(201, {
      message: 'Account created successfully',
      ...result,
    })
  } catch (error) {
    return handleError(error)
  }
})

export const loginHandler: APIGatewayProxyHandlerV2 = withParsedBody(async (_event, body) => {
  try {
    const result = await loginUser(body)
    return jsonResponse(200, {
      message: 'Login successful',
      ...result,
    })
  } catch (error) {
    return handleError(error)
  }
})

