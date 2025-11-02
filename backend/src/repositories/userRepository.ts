import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import bcrypt from 'bcryptjs'

import { config } from '../config.js'
import { documentClient } from '../lib/dynamoClient.js'
import type { UserRecord } from '../types/user.js'

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>
  create(user: UserRecord): Promise<UserRecord>
}

class DynamoUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const response = await documentClient.send(
      new GetCommand({
        TableName: config.userTableName,
        Key: { email },
      }),
    )

    return (response.Item as UserRecord | undefined) ?? null
  }

  async create(user: UserRecord): Promise<UserRecord> {
    await documentClient.send(
      new PutCommand({
        TableName: config.userTableName,
        Item: user,
        ConditionExpression: 'attribute_not_exists(email)',
      }),
    )

    return user
  }
}

class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, UserRecord>()

  constructor() {
    // No demo data - users must be registered
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.users.get(email.toLowerCase()) ?? null
  }

  async create(user: UserRecord): Promise<UserRecord> {
    const key = user.email.toLowerCase()
    if (this.users.has(key)) {
      throw new Error('User already exists')
    }
    this.users.set(key, user)
    return user
  }
}

let repository: UserRepository | null = null

export const getUserRepository = (): UserRepository => {
  if (!repository) {
    repository = config.useInMemoryDb ? new InMemoryUserRepository() : new DynamoUserRepository()
  }
  return repository
}

