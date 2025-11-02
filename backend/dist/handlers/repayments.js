import { ZodError } from 'zod';
import { listRepaymentsByLoan, recordRepayment, syncLoanStatuses, } from '../services/loanService.js';
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
export const createRepaymentHandler = async (event) => {
    try {
        const payload = parseJsonBody(event);
        const result = await recordRepayment(payload);
        return jsonResponse(201, {
            message: 'Repayment recorded',
            repayment: result.repayment,
            loan: result.loan,
        });
    }
    catch (error) {
        return handleError(error);
    }
};
export const listRepaymentsHandler = async (event) => {
    try {
        const loanId = event.pathParameters?.loanId ?? '';
        const repayments = await listRepaymentsByLoan(loanId);
        return jsonResponse(200, { repayments });
    }
    catch (error) {
        return handleError(error);
    }
};
export const syncLoanStatusHandler = async () => {
    try {
        const loans = await syncLoanStatuses();
        return jsonResponse(200, { message: 'Loan statuses synced', loans });
    }
    catch (error) {
        return handleError(error, 500);
    }
};
