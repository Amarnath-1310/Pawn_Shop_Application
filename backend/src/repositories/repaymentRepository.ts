import { PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuid } from 'uuid'

import { config } from '../config.js'
import { documentClient } from '../lib/dynamoClient.js'
import type { RepaymentRecord } from '../types/repayment.js'

export interface RepaymentRepository {
  listByLoan(loanId: string): Promise<RepaymentRecord[]>
  create(entry: Omit<RepaymentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<RepaymentRecord>
  listAll(): Promise<RepaymentRecord[]>
}

class DynamoRepaymentRepository implements RepaymentRepository {
  async listByLoan(loanId: string): Promise<RepaymentRecord[]> {
    const response = await documentClient.send(
      new QueryCommand({
        TableName: config.repaymentTableName,
        IndexName: 'loanId-index',
        KeyConditionExpression: 'loanId = :loanId',
        ExpressionAttributeValues: {
          ':loanId': loanId,
        },
      }),
    )
    return (response.Items as RepaymentRecord[] | undefined) ?? []
  }

  async listAll(): Promise<RepaymentRecord[]> {
    const response = await documentClient.send(
      new ScanCommand({ TableName: config.repaymentTableName }),
    )
    return (response.Items as RepaymentRecord[] | undefined) ?? []
  }

  async create(
    entry: Omit<RepaymentRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<RepaymentRecord> {
    const now = new Date().toISOString()
    const record: RepaymentRecord = {
      id: uuid(),
      ...entry,
      createdAt: now,
      updatedAt: now,
    }

    await documentClient.send(
      new PutCommand({
        TableName: config.repaymentTableName,
        Item: record,
      }),
    )

    return record
  }
}

class InMemoryRepaymentRepository implements RepaymentRepository {
  private readonly repayments = new Map<string, RepaymentRecord>()

  constructor() {
    const now = new Date().toISOString()
    const seed: RepaymentRecord = {
      id: 'rep-demo-1',
      loanId: 'loan-demo-1',
      amount: 120,
      method: 'cash',
      reference: 'POS-001',
      paidAt: now,
      createdAt: now,
      updatedAt: now,
      notes: 'Initial interest payment',
    }
    this.repayments.set(seed.id, seed)
  }

  async listByLoan(loanId: string): Promise<RepaymentRecord[]> {
    return Array.from(this.repayments.values())
      .filter((repayment) => repayment.loanId === loanId)
      .sort((a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime())
  }

  async listAll(): Promise<RepaymentRecord[]> {
    return Array.from(this.repayments.values())
  }

  async create(
    entry: Omit<RepaymentRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<RepaymentRecord> {
    const now = new Date().toISOString()
    const record: RepaymentRecord = {
      id: uuid(),
      ...entry,
      createdAt: now,
      updatedAt: now,
    }
    this.repayments.set(record.id, record)
    return record
  }
}

let repository: RepaymentRepository | null = null

export const getRepaymentRepository = (): RepaymentRepository => {
  if (!repository) {
    repository = config.useInMemoryDb
      ? new InMemoryRepaymentRepository()
      : new DynamoRepaymentRepository()
  }
  return repository
}

// Function to reset repository (useful for testing or server restarts)
export const resetRepaymentRepository = (): void => {
  repository = null
}

