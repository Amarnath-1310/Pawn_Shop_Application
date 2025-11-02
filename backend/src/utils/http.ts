import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from 'aws-lambda'

import { config } from '../config.js'

export const jsonResponse = (
  statusCode: number,
  body: Record<string, unknown> | Array<unknown>,
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': config.corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE,PATCH',
  },
  body: JSON.stringify(body),
})

export const parseJsonBody = <T>(event: APIGatewayProxyEventV2): T => {
  if (!event.body) {
    throw new Error('Request body is required')
  }

  try {
    return JSON.parse(event.body) as T
  } catch (error) {
    throw new Error('Invalid JSON in request body')
  }
}

