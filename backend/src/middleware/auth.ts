import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export interface AuthenticatedEvent extends APIGatewayProxyEventV2 {
  user?: {
    id: string
    email: string
    role: string
  }
}

export const authenticate = async (event: APIGatewayProxyEventV2): Promise<AuthenticatedEvent> => {
  const authHeader = event.headers?.authorization || event.headers?.Authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid authorization header')
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      sub: string
      email: string
      role: string
    }

    return {
      ...event,
      user: {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      },
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Unauthorized: Token expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Unauthorized: Invalid token')
    }
    throw new Error('Unauthorized: Authentication failed')
  }
}

export const requireAuth = (handler: (event: AuthenticatedEvent) => Promise<any>) => {
  return async (event: APIGatewayProxyEventV2) => {
    try {
      const authenticatedEvent = await authenticate(event)
      return await handler(authenticatedEvent)
    } catch (error) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': config.corsOrigin,
        },
        body: JSON.stringify({
          message: error instanceof Error ? error.message : 'Unauthorized',
        }),
      }
    }
  }
}

export const requireRole = (allowedRoles: string[]) => {
  return (handler: (event: AuthenticatedEvent) => Promise<any>) => {
    return requireAuth(async (event: AuthenticatedEvent) => {
      if (!event.user || !allowedRoles.includes(event.user.role)) {
        return {
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': config.corsOrigin,
          },
          body: JSON.stringify({
            message: 'Forbidden: Insufficient permissions',
          }),
        }
      }
      return await handler(event)
    })
  }
}

