import { ZodError } from 'zod';
import { createLoan, getLoanById, listLoans, updateLoanStatus, getMonthlyReport } from '../services/loanService.js';
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
export const listLoansHandler = async () => {
    try {
        const loans = await listLoans();
        return jsonResponse(200, { loans });
    }
    catch (error) {
        return handleError(error, 500);
    }
};
export const createLoanHandler = async (event) => {
    try {
        const payload = parseJsonBody(event);
        const loan = await createLoan(payload);
        return jsonResponse(201, { message: 'Loan created', loan });
    }
    catch (error) {
        return handleError(error);
    }
};
export const getLoanHandler = async (event) => {
    try {
        const id = event.pathParameters?.id ?? '';
        const loan = await getLoanById(id);
        if (!loan) {
            return jsonResponse(404, { message: 'Loan not found' });
        }
        return jsonResponse(200, { loan });
    }
    catch (error) {
        return handleError(error);
    }
};
export const updateLoanStatusHandler = async (event) => {
    try {
        const id = event.pathParameters?.id ?? '';
        const payload = parseJsonBody(event);
        const loan = await updateLoanStatus(id, payload);
        return jsonResponse(200, { message: 'Loan updated', loan });
    }
    catch (error) {
        return handleError(error);
    }
};
// New handler for monthly reports
export const getMonthlyReportHandler = async () => {
    try {
        const report = await getMonthlyReport();
        return jsonResponse(200, { report });
    }
    catch (error) {
        return handleError(error, 500);
    }
};
