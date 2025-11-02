/**
 * Currency formatting utilities for Indian Rupee (₹)
 */

/**
 * Format a number as Indian Rupee currency
 * @param value - The numeric value to format
 * @param options - Formatting options
 * @returns Formatted currency string with ₹ symbol
 */
export const formatCurrency = (
  value: number,
  options: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    showSymbol?: boolean
  } = {}
): string => {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true
  } = options

  const formatted = value.toLocaleString('en-IN', {
    minimumFractionDigits,
    maximumFractionDigits
  })

  return showSymbol ? `₹${formatted}` : formatted
}

/**
 * Format currency for display in tables/lists (no decimals)
 */
export const formatCurrencyCompact = (value: number): string => {
  return formatCurrency(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/**
 * Format currency with full precision (2 decimal places)
 */
export const formatCurrencyPrecise = (value: number): string => {
  return formatCurrency(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}