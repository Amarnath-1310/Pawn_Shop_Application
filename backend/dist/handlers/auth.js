import { ZodError } from 'zod';
import { loginUser, registerUser } from '../services/authService.js';
import { jsonResponse, parseJsonBody } from '../utils/http.js';
const handleError = (error, defaultStatus = 400) => {
    if (error instanceof ZodError) {
        return jsonResponse(422, {
            message: 'Validation failed',
            issues: error.flatten().fieldErrors,
        });
    }
    if (error instanceof Error) {
        return jsonResponse(defaultStatus, { message: error.message });
    }
    return jsonResponse(500, { message: 'Unexpected error' });
};
const withParsedBody = (handler) => {
    return async (event) => {
        try {
            const body = parseJsonBody(event);
            return await handler(event, body);
        }
        catch (error) {
            return handleError(error, 400);
        }
    };
};
export const registerHandler = withParsedBody(async (_event, body) => {
    try {
        const result = await registerUser(body);
        return jsonResponse(201, {
            message: 'Account created successfully',
            ...result,
        });
    }
    catch (error) {
        return handleError(error);
    }
});
export const loginHandler = withParsedBody(async (_event, body) => {
    try {
        const result = await loginUser(body);
        return jsonResponse(200, {
            message: 'Login successful',
            ...result,
        });
    }
    catch (error) {
        return handleError(error);
    }
});
