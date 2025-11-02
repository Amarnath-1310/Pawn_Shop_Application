import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

import { config } from '../config.js'

const baseClient = new DynamoDBClient({
  region: config.region,
})

export const documentClient = DynamoDBDocumentClient.from(baseClient, {
  marshallOptions: {
    convertEmptyValues: true,
  },
})

