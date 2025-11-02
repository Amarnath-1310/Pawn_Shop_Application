export { loginHandler, registerHandler } from './handlers/auth.js'
export {
  createCustomerHandler,
  deleteCustomerHandler,
  listCustomersHandler,
  updateCustomerHandler,
} from './handlers/customers.js'
export {
  createLoanHandler,
  getLoanHandler,
  listLoansHandler,
  updateLoanStatusHandler,
} from './handlers/loans.js'
export {
  createRepaymentHandler,
  listRepaymentsHandler,
  syncLoanStatusHandler,
} from './handlers/repayments.js'
export { getMonthlyReportHandler, getFilteredReportsHandler, exportReportsHandler, resetRepositoriesHandler } from './handlers/reports.js' // Add this export