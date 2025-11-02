import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { documentClient } from '../lib/dynamoClient.js';
class DynamoUserRepository {
    async findByEmail(email) {
        const response = await documentClient.send(new GetCommand({
            TableName: config.userTableName,
            Key: { email },
        }));
        return response.Item ?? null;
    }
    async create(user) {
        await documentClient.send(new PutCommand({
            TableName: config.userTableName,
            Item: user,
            ConditionExpression: 'attribute_not_exists(email)',
        }));
        return user;
    }
}
class InMemoryUserRepository {
    users = new Map();
    constructor() {
        const now = new Date().toISOString();
        const demoUser = {
            id: 'user-demo-1',
            email: 'demo@regalpawn.com',
            firstName: 'Ava',
            lastName: 'Stein',
            role: 'admin',
            passwordHash: bcrypt.hashSync('Password123!', 10),
            createdAt: now,
            updatedAt: now,
        };
        this.users.set(demoUser.email.toLowerCase(), demoUser);
    }
    async findByEmail(email) {
        return this.users.get(email.toLowerCase()) ?? null;
    }
    async create(user) {
        const key = user.email.toLowerCase();
        if (this.users.has(key)) {
            throw new Error('User already exists');
        }
        this.users.set(key, user);
        return user;
    }
}
let repository = null;
export const getUserRepository = () => {
    if (!repository) {
        repository = config.useInMemoryDb ? new InMemoryUserRepository() : new DynamoUserRepository();
    }
    return repository;
};
