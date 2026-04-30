#!/bin/bash
# Usage: ./infrastructure/cognito-teardown.sh <pool-id> [region]

POOL_ID=$1
REGION=${2:-us-east-1}

if [ -z "$POOL_ID" ]; then
  echo "Usage: $0 <pool-id> [region]"
  echo "Example: $0 us-east-1_XXXXXXXX"
  exit 1
fi

echo "Deleting Cognito User Pool: $POOL_ID"

# Delete all app clients first
CLIENT_IDS=$(aws cognito-idp list-user-pool-clients \
  --user-pool-id "$POOL_ID" \
  --region "$REGION" \
  --query 'UserPoolClients[*].ClientId' \
  --output text)

for CLIENT_ID in $CLIENT_IDS; do
  aws cognito-idp delete-user-pool-client \
    --user-pool-id "$POOL_ID" \
    --client-id "$CLIENT_ID" \
    --region "$REGION"
  echo "✓ Deleted client: $CLIENT_ID"
done

# Delete the user pool
aws cognito-idp delete-user-pool \
  --user-pool-id "$POOL_ID" \
  --region "$REGION"

echo "✓ Deleted User Pool: $POOL_ID"
