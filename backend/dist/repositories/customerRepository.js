import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';
import { config } from '../config.js';
import { documentClient } from '../lib/dynamoClient.js';
class DynamoCustomerRepository {
    async list() {
        const response = await documentClient.send(new ScanCommand({ TableName: config.customerTableName }));
        return response.Items ?? [];
    }
    async create(input) {
        const now = new Date().toISOString();
        const record = {
            id: uuid(),
            ...input,
            createdAt: now,
            updatedAt: now,
        };
        await documentClient.send(new PutCommand({
            TableName: config.customerTableName,
            Item: record,
        }));
        return record;
    }
    async update(id, input) {
        const now = new Date().toISOString();
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = { ':updatedAt': now };
        for (const [key, value] of Object.entries(input)) {
            if (value === undefined)
                continue;
            const attributeName = `#${key}`;
            const attributeValueKey = `:${key}`;
            expressionAttributeNames[attributeName] = key;
            expressionAttributeValues[attributeValueKey] = value;
            updateExpressions.push(`${attributeName} = ${attributeValueKey}`);
        }
        if (!updateExpressions.length) {
            const existing = await this.getById(id);
            if (!existing) {
                throw new Error('Customer not found');
            }
            return existing;
        }
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        const response = await documentClient.send(new UpdateCommand({
            TableName: config.customerTableName,
            Key: { id },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        }));
        return response.Attributes;
    }
    async delete(id) {
        await documentClient.send(new DeleteCommand({
            TableName: config.customerTableName,
            Key: { id },
        }));
    }
    async getById(id) {
        const response = await documentClient.send(new GetCommand({
            TableName: config.customerTableName,
            Key: { id },
        }));
        return response.Item ?? null;
    }
}
class InMemoryCustomerRepository {
    customers = new Map();
    constructor() {
        const now = new Date().toISOString();
        const demoCustomer = {
            id: 'cust-demo-1',
            firstName: 'Eleanor',
            lastName: 'Rigby',
            email: 'eleanor@example.com',
            phone: '+1 (312) 555-0199',
            createdAt: now,
            updatedAt: now,
        };
        this.customers.set(demoCustomer.id, demoCustomer);
    }
    async list() {
        return Array.from(this.customers.values());
    }
    async create(input) {
        const now = new Date().toISOString();
        const record = {
            id: uuid(),
            ...input,
            email: input.email || undefined, // Handle optional email
            createdAt: now,
            updatedAt: now,
        };
        this.customers.set(record.id, record);
        return record;
    }
    async update(id, input) {
        const existing = this.customers.get(id);
        if (!existing) {
            throw new Error('Customer not found');
        }
        const updated = {
            ...existing,
            ...input,
            email: input.email || undefined, // Handle optional email
            updatedAt: new Date().toISOString(),
        };
        this.customers.set(id, updated);
        return updated;
    }
    async delete(id) {
        this.customers.delete(id);
    }
    async getById(id) {
        return this.customers.get(id) ?? null;
    }
}
let repository = null;
export const getCustomerRepository = () => {
    if (!repository) {
        repository = config.useInMemoryDb
            ? new InMemoryCustomerRepository()
            : new DynamoCustomerRepository();
    }
    return repository;
};
// Function to reset repository (useful for testing or server restarts)
export const resetCustomerRepository = () => {
    repository = null;
};
