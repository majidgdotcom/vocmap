#!/bin/bash
# ── Add a user to the admin Cognito group ────────────────────────────────────
# Usage: ./add-admin.sh <email> [pool-id] [region]
# Example: ./add-admin.sh majidgdotcom@gmail.com us-east-1_8CmwMwDD6

EMAIL=${1:?Usage: $0 <email> [pool-id] [region]}
POOL_ID=${2:-us-east-1_8CmwMwDD6}
REGION=${3:-us-east-1}

echo "Adding $EMAIL to the 'admin' group in pool $POOL_ID…"

aws cognito-idp admin-add-user-to-group \
  --user-pool-id "$POOL_ID" \
  --username     "$EMAIL" \
  --group-name   admin \
  --region       "$REGION"

echo "✓ Done. $EMAIL is now an admin."
echo ""
echo "The user must sign out and sign back in for the new group"
echo "claim to appear in their JWT token."
