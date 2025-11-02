import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { ZodError } from 'zod'

import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from '../services/customerService.js'
import { jsonResponse, parseJsonBody } from '../utils/http.js'

const handleError = (error: unknown, defaultStatus = 400) => {
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

export const listCustomersHandler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const customers = await listCustomers()
    return jsonResponse(200, { customers })
  } catch (error) {
    return handleError(error, 500)
  }
}

export const createCustomerHandler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const payload = parseJsonBody(event)
    const customer = await createCustomer(payload)
    return jsonResponse(201, { message: 'Customer created', customer })
  } catch (error) {
    return handleError(error)
  }
}

export const updateCustomerHandler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const id = event.pathParameters?.id
    const payload = parseJsonBody(event)
    const customer = await updateCustomer(id ?? '', payload)
    return jsonResponse(200, { message: 'Customer updated', customer })
  } catch (error) {
    return handleError(error)
  }
}

export const deleteCustomerHandler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const id = event.pathParameters?.id
    await deleteCustomer(id ?? '')
    return jsonResponse(200, { message: 'Customer deleted' })
  } catch (error) {
    return handleError(error)
  }
}

