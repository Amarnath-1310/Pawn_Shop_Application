export const config = {
  region: process.env.AWS_REGION ?? 'us-east-1',
  userTableName: process.env.DYNAMO_USER_TABLE_NAME ?? process.env.DYNAMO_TABLE_NAME ?? 'pawn-broker-users',
  customerTableName: process.env.DYNAMO_CUSTOMER_TABLE_NAME ?? 'pawn-broker-customers',
  loanTableName: process.env.DYNAMO_LOAN_TABLE_NAME ?? 'pawn-broker-loans',
  repaymentTableName: process.env.DYNAMO_REPAYMENT_TABLE_NAME ?? 'pawn-broker-repayments',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
  useInMemoryDb: (process.env.USE_IN_MEMORY_DB ?? 'true').toLowerCase() !== 'false',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
}

