#!/usr/bin/env node
/**
 * migration/migrate-vocab-to-global.ts
 *
 * One-time migration: copies vocabulary items from the old user-scoped
 * PK=USER#<userId> partition to the new global PK=VOCAB partition.
 *
 * Old key: PK=USER#<userId>  SK=VOCAB#<wordKey>
 * New key: PK=VOCAB           SK=VOCAB#<wordKey>
 *
 * Run once after deploying the updated vocabulary-service:
 *   npx ts-node migration/migrate-vocab-to-global.ts
 *
 * Prerequisites:
 *   npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
 *   AWS_REGION and AWS_PROFILE (or credentials) must be set.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const TABLE  = process.env.DYNAMO_TABLE ?? 'vocmap-dev';
const REGION = process.env.AWS_REGION   ?? 'us-east-1';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

async function migrate() {
  console.log(`Scanning ${TABLE} for old vocabulary items…`);

  let scanned = 0, migrated = 0, skipped = 0;
  let lastKey: Record<string, unknown> | undefined;

  do {
    const res = await client.send(new ScanCommand({
      TableName:         TABLE,
      FilterExpression:  'begins_with(PK, :prefix) AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':prefix': 'USER#',
        ':sk':     'VOCAB#',
      },
      ExclusiveStartKey: lastKey,
    }));

    for (const item of res.Items ?? []) {
      scanned++;
      const wordKey = (item.SK as string).replace('VOCAB#', '');
      const newPK   = 'VOCAB';
      const newSK   = `VOCAB#${wordKey}`;

      // Check if the global item already exists
      const existing = await client.send(new ScanCommand({
        TableName:         TABLE,
        FilterExpression:  'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: { ':pk': newPK, ':sk': newSK },
        Limit: 1,
      }));

      if (existing.Count && existing.Count > 0) {
        console.log(`  ⚠ SKIP  ${wordKey} — global entry already exists`);
        skipped++;
        continue;
      }

      // Write new global item
      await client.send(new PutCommand({
        TableName: TABLE,
        Item: {
          ...item,
          PK:     newPK,
          SK:     newSK,
          GSI1PK: newPK,
          GSI1SK: newSK,
          // Remove old userId — vocabulary is now global
          userId: undefined,
        },
      }));

      // Delete old user-scoped item
      await client.send(new DeleteCommand({
        TableName: TABLE,
        Key: { PK: item.PK, SK: item.SK },
      }));

      console.log(`  ✓ OK    ${wordKey}`);
      migrated++;
    }

    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  console.log('\n─────────────────────────────────');
  console.log(`  Scanned : ${scanned}`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped : ${skipped}`);
  console.log('─────────────────────────────────');
  console.log('Done. Existing family savedToVocabulary flags are still valid.');
}

migrate().catch(err => { console.error(err); process.exit(1); });
