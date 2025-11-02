import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'

import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'

import { loginHandler, registerHandler } from './handlers/auth.js'
import {
  createCustomerHandler,
  deleteCustomerHandler,
  listCustomersHandler,
  updateCustomerHandler,
} from './handlers/customers.js'
import {
  createLoanHandler,
  getLoanHandler,
  listLoansHandler,
  updateLoanStatusHandler,
} from './handlers/loans.js'
import {
  createRepaymentHandler,
  listRepaymentsHandler,
  syncLoanStatusHandler,
} from './handlers/repayments.js'
import { getMonthlyReportHandler, getFilteredReportsHandler, exportReportsHandler, resetRepositoriesHandler } from './handlers/reports.js'
import { config } from './config.js'

const PORT = Number(process.env.PORT ?? 4002)

interface RouteDefinition {
  method: string
  pattern: string
  handler: typeof loginHandler
  regex: RegExp
  paramNames: string[]
}

const compilePattern = (pattern: string) => {
  const paramNames: string[] = []
  const regexPattern = pattern.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name)
    return '([^/]+)'
  })
  return { regex: new RegExp(`^${regexPattern}$`), paramNames }
}

const routes: RouteDefinition[] = [
  { method: 'POST', pattern: '/auth/login', handler: loginHandler, ...compilePattern('/auth/login') },
  {
    method: 'POST',
    pattern: '/auth/register',
    handler: registerHandler,
    ...compilePattern('/auth/register'),
  },
  { method: 'GET', pattern: '/customers', handler: listCustomersHandler, ...compilePattern('/customers') },
  { method: 'POST', pattern: '/customers', handler: createCustomerHandler, ...compilePattern('/customers') },
  {
    method: 'PUT',
    pattern: '/customers/:id',
    handler: updateCustomerHandler,
    ...compilePattern('/customers/:id'),
  },
  {
    method: 'DELETE',
    pattern: '/customers/:id',
    handler: deleteCustomerHandler,
    ...compilePattern('/customers/:id'),
  },
  { method: 'GET', pattern: '/loans', handler: listLoansHandler, ...compilePattern('/loans') },
  {
    method: 'GET',
    pattern: '/loans/:id',
    handler: getLoanHandler,
    ...compilePattern('/loans/:id'),
  },
  { method: 'POST', pattern: '/loans', handler: createLoanHandler, ...compilePattern('/loans') },
  {
    method: 'PATCH',
    pattern: '/loans/:id',
    handler: updateLoanStatusHandler,
    ...compilePattern('/loans/:id'),
  },
  { method: 'POST', pattern: '/repayments', handler: createRepaymentHandler, ...compilePattern('/repayments') },
  {
    method: 'GET',
    pattern: '/repayments/:loanId',
    handler: listRepaymentsHandler,
    ...compilePattern('/repayments/:loanId'),
  },
  {
    method: 'PUT',
    pattern: '/loans/status',
    handler: syncLoanStatusHandler,
    ...compilePattern('/loans/status'),
  },
  { 
    method: 'GET', 
    pattern: '/reports/monthly', 
    handler: getMonthlyReportHandler, 
    ...compilePattern('/reports/monthly') 
  },
  { 
    method: 'GET', 
    pattern: '/reports', 
    handler: getFilteredReportsHandler, 
    ...compilePattern('/reports') 
  },
  { 
    method: 'GET', 
    pattern: '/reports/export', 
    handler: exportReportsHandler, 
    ...compilePattern('/reports/export') 
  },
  { 
    method: 'POST', 
    pattern: '/dev/reset', 
    handler: resetRepositoriesHandler, 
    ...compilePattern('/dev/reset') 
  },
]

const corsHeaders = {
  'Access-Control-Allow-Origin': config.corsOrigin,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE,PATCH',
}

const mapRequestToEvent = (
  method: string,
  path: string,
  body: string | null,
  pathParameters: Record<string, string> | undefined,
): APIGatewayProxyEventV2 => ({
  version: '2.0',
  routeKey: `${method} ${path}`,
  rawPath: path,
  rawQueryString: '',
  headers: {},
  requestContext: {
    accountId: 'local',
    apiId: 'local',
    domainName: 'localhost',
    domainPrefix: 'localhost',
    http: {
      method,
      path,
      protocol: 'HTTP/1.1',
      sourceIp: '127.0.0.1',
      userAgent: 'local',
    },
    requestId: randomUUID(),
    routeKey: `${method} ${path}`,
    stage: '$default',
    time: new Date().toISOString(),
    timeEpoch: Date.now(),
  },
  isBase64Encoded: false,
  body: body ?? undefined,
  cookies: [],
  pathParameters,
  queryStringParameters: undefined,
  stageVariables: undefined,
})

const server = createServer((req, res) => {
  if (!req.url || !req.method) {
    res.statusCode = 400
    res.end('Bad request')
    return
  }

  const url = new URL(req.url, `http://localhost:${PORT}`)
  const method = req.method.toUpperCase()

  if (method === 'OPTIONS') {
    res.writeHead(204, corsHeaders)
    res.end()
    return
  }

  const matchedRoute = routes.find((route) => {
    if (route.method !== method) return false
    return route.regex.test(url.pathname)
  })

  if (!matchedRoute) {
    res.statusCode = 404
    for (const [name, value] of Object.entries({ 'Content-Type': 'application/json', ...corsHeaders })) {
      res.setHeader(name, value)
    }
    res.end(JSON.stringify({ message: 'Route not found' }))
    return
  }

  const match = url.pathname.match(matchedRoute.regex)
  const pathParameters = match
    ? matchedRoute.paramNames.reduce<Record<string, string>>((acc, param, index) => {
        acc[param] = match[index + 1]
        return acc
      }, {})
    : undefined

  const chunks: Buffer[] = []
  req
    .on('data', (chunk) => chunks.push(chunk as Buffer))
    .on('end', async () => {
      const body = chunks.length ? Buffer.concat(chunks).toString('utf-8') : null
      try {
        const event = mapRequestToEvent(method, url.pathname, body, pathParameters)
        const raw = await matchedRoute.handler(event, {} as never, () => undefined)
        const response: APIGatewayProxyStructuredResultV2 = (() => {
          if (!raw) {
            return {
              statusCode: 204,
              headers: { 'Content-Type': 'application/json' },
              body: '',
            }
          }
          if (typeof raw === 'string') {
            return {
              statusCode: 200,
              headers: { 'Content-Type': 'text/plain' },
              body: raw,
            }
          }
          return raw
        })()
        res.statusCode = response.statusCode ?? 200
        const headers = { ...corsHeaders, ...(response.headers ?? {}) }
        for (const [name, value] of Object.entries(headers)) {
          if (value !== undefined) {
            res.setHeader(name, String(value))
          }
        }
        res.end(response.body ?? '')
      } catch (error) {
        console.error('Local server error', error)
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ message: 'Internal server error' }))
      }
    })
})

server.listen(PORT, () => {
  console.log(`🚀 Local Pawn Broker API running at http://localhost:${PORT}`)
})

