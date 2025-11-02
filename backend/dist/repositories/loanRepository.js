import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';
import { config } from '../config.js';
import { documentClient } from '../lib/dynamoClient.js';
class DynamoLoanRepository {
    async list() {
        const response = await documentClient.send(new ScanCommand({ TableName: config.loanTableName }));
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
            TableName: config.loanTableName,
            Item: record,
        }));
        return record;
    }
    async updateStatus(id, status) {
        const now = new Date().toISOString();
        const response = await documentClient.send(new UpdateCommand({
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
        }));
        const record = response.Attributes;
        if (!record) {
            throw new Error('Loan not found');
        }
        return record;
    }
    async getById(id) {
        const response = await documentClient.send(new GetCommand({
            TableName: config.loanTableName,
            Key: { id },
        }));
        return response.Item ?? null;
    }
}
class InMemoryLoanRepository {
    loans = new Map();
    constructor() {
        const now = new Date().toISOString();
        const loan = {
            id: 'loan-demo-1',
            customerId: 'cust-demo-1',
            itemDescription: '14k Gold Chain',
            principal: 650,
            interestRate: 0.15,
            totalPayable: 650 + (650 * 0.15 * 1), // principal + (principal * interestRate * durationMonths)
            startDate: now,
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 1 month from now
            status: 'ACTIVE',
            notes: 'Customer requested appraisal on pickup',
            createdAt: now,
            updatedAt: now,
        };
        this.loans.set(loan.id, loan);
    }
    async list() {
        return Array.from(this.loans.values());
    }
    async create(input) {
        const now = new Date().toISOString();
        const record = {
            id: uuid(),
            ...input,
            createdAt: now,
            updatedAt: now,
        };
        this.loans.set(record.id, record);
        return record;
    }
    async updateStatus(id, status) {
        const existing = this.loans.get(id);
        if (!existing) {
            throw new Error('Loan not found');
        }
        const updated = {
            ...existing,
            status,
            updatedAt: new Date().toISOString(),
        };
        this.loans.set(id, updated);
        return updated;
    }
    async getById(id) {
        return this.loans.get(id) ?? null;
    }
}
let repository = null;
export const getLoanRepository = () => {
    if (!repository) {
        repository = config.useInMemoryDb ? new InMemoryLoanRepository() : new DynamoLoanRepository();
    }
    return repository;
};
// Function to reset repository (useful for testing or server restarts)
export const resetLoanRepository = () => {
    repository = null;
};
