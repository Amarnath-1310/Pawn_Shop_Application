import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuid } from 'uuid'

import { config } from '../config.js'
import { documentClient } from '../lib/dynamoClient.js'
import type { LoanRecord, LoanStatus } from '../types/loan.js'

export interface LoanRepository {
  list(): Promise<LoanRecord[]>
  create(input: Omit<LoanRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<LoanRecord>
  updateStatus(id: string, status: LoanStatus): Promise<LoanRecord>
  getById(id: string): Promise<LoanRecord | null>
}

class DynamoLoanRepository implements LoanRepository {
  async list(): Promise<LoanRecord[]> {
    const response = await documentClient.send(
      new ScanCommand({ TableName: config.loanTableName }),
    )
    return (response.Items as LoanRecord[] | undefined) ?? []
  }

  async create(
    input: Omit<LoanRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<LoanRecord> {
    const now = new Date().toISOString()
    const record: LoanRecord = {
      id: uuid(),
      ...input,
      createdAt: now,
      updatedAt: now,
    }

    await documentClient.send(
      new PutCommand({
        TableName: config.loanTableName,
        Item: record,
      }),
    )

    return record
  }

  async updateStatus(id: string, status: LoanStatus): Promise<LoanRecord> {
    const now = new Date().toISOString()
    const response = await documentClient.send(
      new UpdateCommand({
        TableName: config.loanTableName,
        Key: { id },
        UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':updatedAt': now,
        },
        ReturnValues: 'ALL_NEW',
      }),
    )
    const record = response.Attributes as LoanRecord | undefined
    if (!record) {
      throw new Error('Loan not found')
    }
    return record
  }

  async getById(id: string): Promise<LoanRecord | null> {
    const response = await documentClient.send(
      new GetCommand({
        TableName: config.loanTableName,
        Key: { id },
      }),
    )
    return (response.Item as LoanRecord | undefined) ?? null
  }
}

class InMemoryLoanRepository implements LoanRepository {
  private readonly loans = new Map<string, LoanRecord>()

  constructor() {
    // No demo data - start with empty repository
  }

  async list(): Promise<LoanRecord[]> {
    return Array.from(this.loans.values())
  }

  async create(
    input: Omit<LoanRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<LoanRecord> {
    const now = new Date().toISOString()
    const record: LoanRecord = {
      id: uuid(),
      ...input,
      createdAt: now,
      updatedAt: now,
    }
    this.loans.set(record.id, record)
    return record
  }

  async updateStatus(id: string, status: LoanStatus): Promise<LoanRecord> {
    const existing = this.loans.get(id)
    if (!existing) {
      throw new Error('Loan not found')
    }
    const updated: LoanRecord = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    }
    this.loans.set(id, updated)
    return updated
  }

  async getById(id: string): Promise<LoanRecord | null> {
    return this.loans.get(id) ?? null
  }
}

let repository: LoanRepository | null = null

export const getLoanRepository = (): LoanRepository => {
  if (!repository) {
    repository = config.useInMemoryDb ? new InMemoryLoanRepository() : new DynamoLoanRepository()
  }
  return repository
}

// Function to reset repository (useful for testing or server restarts)
export const resetLoanRepository = (): void => {
  repository = null
}

