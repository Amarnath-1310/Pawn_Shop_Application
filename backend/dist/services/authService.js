import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { config } from '../config.js';
import { getUserRepository } from '../repositories/userRepository.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.enum(['admin', 'clerk']).default('clerk'),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
const toPublicUser = (user) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
});
const signToken = (user) => {
    const secret = config.jwtSecret;
    const expiresIn = config.jwtExpiresIn;
    return jwt.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
    }, secret, {
        expiresIn,
    });
};
export const registerUser = async (input) => {
    const data = registerSchema.parse(input);
    const repository = getUserRepository();
    const existing = await repository.findByEmail(data.email.toLowerCase());
    if (existing) {
        throw new Error('Account already exists for this email');
    }
    const now = new Date().toISOString();
    const user = {
        id: uuid(),
        email: data.email.toLowerCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        role: (data.role ?? 'clerk'),
        passwordHash: await hashPassword(data.password),
        createdAt: now,
        updatedAt: now,
    };
    await repository.create(user);
    const publicUser = toPublicUser(user);
    const token = signToken(publicUser);
    return { token, user: publicUser };
};
export const loginUser = async (input) => {
    const data = loginSchema.parse(input);
    const repository = getUserRepository();
    const user = await repository.findByEmail(data.email.toLowerCase());
    if (!user) {
        throw new Error('Invalid email or password');
    }
    const valid = await verifyPassword(data.password, user.passwordHash);
    if (!valid) {
        throw new Error('Invalid email or password');
    }
    const publicUser = toPublicUser(user);
    const token = signToken(publicUser);
    return { token, user: publicUser };
};
