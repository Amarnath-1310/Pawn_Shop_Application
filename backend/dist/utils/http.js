import { config } from '../config.js';
export const jsonResponse = (statusCode, body) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': config.corsOrigin,
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE,PATCH',
    },
    body: JSON.stringify(body),
});
export const parseJsonBody = (event) => {
    if (!event.body) {
        throw new Error('Request body is required');
    }
    try {
        return JSON.parse(event.body);
    }
    catch (error) {
        throw new Error('Invalid JSON in request body');
    }
};
