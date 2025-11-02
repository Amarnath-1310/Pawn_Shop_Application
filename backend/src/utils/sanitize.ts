/**
 * Sanitizes user input to prevent XSS and injection attacks
 */

export const sanitizeString = (input: unknown): string => {
  if (typeof input !== 'string') {
    return ''
  }

  // Remove potential script tags and dangerous HTML
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

export const sanitizeNumber = (input: unknown): number | null => {
  if (typeof input === 'number') {
    return isNaN(input) || !isFinite(input) ? null : input
  }
  if (typeof input === 'string') {
    const parsed = parseFloat(input)
    return isNaN(parsed) || !isFinite(parsed) ? null : parsed
  }
  return null
}

export const sanitizeEmail = (input: unknown): string | null => {
  if (typeof input !== 'string') {
    return null
  }
  const email = input.toLowerCase().trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) ? email : null
}

export const sanitizePhone = (input: unknown): string | null => {
  if (typeof input !== 'string') {
    return null
  }
  // Allow only numbers, +, -, spaces, and parentheses
  const cleaned = input.replace(/[^\d+()\-\s]/g, '')
  return cleaned.length >= 7 ? cleaned : null
}

export const sanitizeObject = <T extends Record<string, unknown>>(
  obj: T,
  schema: Record<keyof T, (value: unknown) => unknown>,
): Partial<T> => {
  const sanitized: Partial<T> = {}
  for (const [key, sanitizer] of Object.entries(schema)) {
    if (key in obj) {
      const value = sanitizer(obj[key])
      if (value !== null && value !== undefined) {
        sanitized[key as keyof T] = value as T[keyof T]
      }
    }
  }
  return sanitized
}

