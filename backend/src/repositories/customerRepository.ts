import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuid } from 'uuid'

import { config } from '../config.js'
import { documentClient } from '../lib/dynamoClient.js'
import type { CustomerRecord } from '../types/customer.js'

export interface CustomerRepository {
  list(): Promise<CustomerRecord[]>
  create(input: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerRecord>
  update(id: string, input: Partial<Omit<CustomerRecord, 'id' | 'createdAt'>>): Promise<CustomerRecord>
  delete(id: string): Promise<void>
  getById(id: string): Promise<CustomerRecord | null>
}

class DynamoCustomerRepository implements CustomerRepository {
  async list(): Promise<CustomerRecord[]> {
    const response = await documentClient.send(
      new ScanCommand({ TableName: config.customerTableName }),
    )
    return (response.Items as CustomerRecord[] | undefined) ?? []
  }

  async create(
    input: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<CustomerRecord> {
    const now = new Date().toISOString()
    const record: CustomerRecord = {
      id: uuid(),
      ...input,
      createdAt: now,
      updatedAt: now,
    }

    await documentClient.send(
      new PutCommand({
        TableName: config.customerTableName,
        Item: record,
      }),
    )

    return record
  }

  async update(
    id: string,
    input: Partial<Omit<CustomerRecord, 'id' | 'createdAt'>>,
  ): Promise<CustomerRecord> {
    const now = new Date().toISOString()
    const updateExpressions: string[] = []
    const expressionAttributeNames: Record<string, string> = {}
    const expressionAttributeValues: Record<string, unknown> = { ':updatedAt': now }

    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue
      const attributeName = `#${key}`
      const attributeValueKey = `:${key}`
      expressionAttributeNames[attributeName] = key
      expressionAttributeValues[attributeValueKey] = value
      updateExpressions.push(`${attributeName} = ${attributeValueKey}`)
    }

    if (!updateExpressions.length) {
      const existing = await this.getById(id)
      if (!existing) {
        throw new Error('Customer not found')
      }
      return existing
    }

    updateExpressions.push('#updatedAt = :updatedAt')
    expressionAttributeNames['#updatedAt'] = 'updatedAt'

    const response = await documentClient.send(
      new UpdateCommand({
        TableName: config.customerTableName,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      }),
    )

    return response.Attributes as CustomerRecord
  }

  async delete(id: string): Promise<void> {
    await documentClient.send(
      new DeleteCommand({
        TableName: config.customerTableName,
        Key: { id },
      }),
    )
  }

  async getById(id: string): Promise<CustomerRecord | null> {
    const response = await documentClient.send(
      new GetCommand({
        TableName: config.customerTableName,
        Key: { id },
      }),
    )
    return (response.Item as CustomerRecord | undefined) ?? null
  }
}

class InMemoryCustomerRepository implements CustomerRepository {
  private readonly customers = new Map<string, CustomerRecord>()

  constructor() {
    // No demo data - start with empty repository
  }

  async list(): Promise<CustomerRecord[]> {
    return Array.from(this.customers.values())
  }

  async create(
    input: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<CustomerRecord> {
    const now = new Date().toISOString()
    const record: CustomerRecord = {
      id: uuid(),
      ...input,
      email: input.email || undefined, // Handle optional email
      createdAt: now,
      updatedAt: now,
    }
    this.customers.set(record.id, record)
    return record
  }

  async update(
    id: string,
    input: Partial<Omit<CustomerRecord, 'id' | 'createdAt'>>,
  ): Promise<CustomerRecord> {
    const existing = this.customers.get(id)
    if (!existing) {
      throw new Error('Customer not found')
    }
    const updated: CustomerRecord = {
      ...existing,
      ...input,
      email: input.email || undefined, // Handle optional email
      updatedAt: new Date().toISOString(),
    }
    this.customers.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    this.customers.delete(id)
  }

  async getById(id: string): Promise<CustomerRecord | null> {
    return this.customers.get(id) ?? null
  }
}

let repository: CustomerRepository | null = null

export const getCustomerRepository = (): CustomerRepository => {
  if (!repository) {
    repository = config.useInMemoryDb
      ? new InMemoryCustomerRepository()
      : new DynamoCustomerRepository()
  }
  return repository
}

// Function to reset repository (useful for testing or server restarts)
export const resetCustomerRepository = (): void => {
  repository = null
}

