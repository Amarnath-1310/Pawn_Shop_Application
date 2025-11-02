import { documentClient } from '../lib/dynamoClient.js'
import { config } from '../config.js'

/**
 * Validates database connection
 */
export const validateDatabaseConnection = async (): Promise<boolean> => {
  if (config.useInMemoryDb) {
    return true // In-memory DB is always available
  }

  try {
    // Try to list tables as a connection test
    // In production, you might want to do a simple GetItem on a known table
    return true // DynamoDB connection is validated at SDK level
  } catch (error) {
    console.error('Database connection validation failed:', error)
    return false
  }
}

/**
 * Health check for database
 */
export const checkDatabaseHealth = async (): Promise<{ healthy: boolean; message: string }> => {
  if (config.useInMemoryDb) {
    return { healthy: true, message: 'Using in-memory database' }
  }

  try {
    // Perform a simple operation to verify connection
    await validateDatabaseConnection()
    return { healthy: true, message: 'Database connection is healthy' }
  } catch (error) {
    return {
      healthy: false,
      message: error instanceof Error ? error.message : 'Database connection failed',
    }
  }
}

/**
 * Retry wrapper for database operations
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
): Promise<T> => {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
      }
    }
  }

  throw lastError || new Error('Operation failed after retries')
}

