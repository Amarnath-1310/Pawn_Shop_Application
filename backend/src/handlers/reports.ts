import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { ZodError } from 'zod'
import ExcelJS from 'exceljs'

import { getMonthlyReport, getFilteredReports } from '../services/loanService.js'
import { resetCustomerRepository } from '../repositories/customerRepository.js'
import { resetLoanRepository } from '../repositories/loanRepository.js'
import { resetRepaymentRepository } from '../repositories/repaymentRepository.js'
import { jsonResponse } from '../utils/http.js'

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

// Handler for monthly reports
export const getMonthlyReportHandler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const report = await getMonthlyReport()
    return jsonResponse(200, { report })
  } catch (error) {
    return handleError(error, 500)
  }
}

// Handler for filtered reports (daily, monthly, yearly)
export const getFilteredReportsHandler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const type = event.queryStringParameters?.type || 'monthly'
    const reports = await getFilteredReports(type as 'daily' | 'monthly' | 'yearly')
    return jsonResponse(200, { reports })
  } catch (error) {
    return handleError(error, 500)
  }
}

// Handler for Excel export
export const exportReportsHandler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const type = event.queryStringParameters?.type || 'monthly'
    const reports = await getFilteredReports(type as 'daily' | 'monthly' | 'yearly')
    
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Loans Report')
    
    // Define columns
    sheet.columns = [
      { header: 'Customer ID', key: 'customer_id', width: 15 },
      { header: 'Loan ID', key: 'loan_id', width: 15 },
      { header: 'Start Date', key: 'start_date', width: 12 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Item', key: 'item', width: 25 },
      { header: 'Amount (₹)', key: 'amount', width: 15 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Due Date', key: 'due_date', width: 12 },
      { header: 'Interest (₹)', key: 'interest_amount', width: 15 },
      { header: 'Total Amount (₹)', key: 'total_amount', width: 18 }
    ]
    
    // Add data rows
    sheet.addRows(reports)
    
    // Style the header row
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    }
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=report-${type}.xlsx`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE,PATCH'
      },
      body: Buffer.from(buffer).toString('base64'),
      isBase64Encoded: true
    }
  } catch (error) {
    return handleError(error, 500)
  }
}

// Handler to reset repositories (for development/testing)
export const resetRepositoriesHandler: APIGatewayProxyHandlerV2 = async () => {
  try {
    resetCustomerRepository()
    resetLoanRepository()
    resetRepaymentRepository()
    return jsonResponse(200, { message: 'Repositories reset successfully' })
  } catch (error) {
    return handleError(error, 500)
  }
}