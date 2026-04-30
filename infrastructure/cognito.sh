#!/bin/bash
# ============================================================
# Cognito setup script — run instead of CloudFormation
# Usage: ./infrastructure/cognito.sh dev
# ============================================================

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}

echo "Creating Cognito resources for environment: $ENVIRONMENT"

# Create User Pool
POOL_OUTPUT=$(aws cognito-idp create-user-pool \
  --pool-name "vocmap-users-${ENVIRONMENT}" \
  --username-attributes email \
  --auto-verified-attributes email \
  --mfa-configuration OFF \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=false}" \
  --account-recovery-setting "RecoveryMechanisms=[{Priority=1,Name=verified_email}]" \
  --region "$REGION" \
  --output json)

POOL_ID=$(echo "$POOL_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['UserPool']['Id'])")
POOL_ARN=$(echo "$POOL_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['UserPool']['Arn'])")

echo "✓ User Pool created: $POOL_ID"

# Create App Client
CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id "$POOL_ID" \
  --client-name "todo-app-web-${ENVIRONMENT}" \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_PASSWORD_AUTH \
  --supported-identity-providers COGNITO \
  --prevent-user-existence-errors ENABLED \
  --region "$REGION" \
  --query 'UserPoolClient.ClientId' \
  --output text)

echo "✓ App Client created: $CLIENT_ID"

# Print summary
echo ""
echo "========================================"
echo "  Cognito Resources — $ENVIRONMENT"
echo "========================================"
echo "  User Pool ID  : $POOL_ID"
echo "  User Pool ARN : $POOL_ARN"
echo "  Client ID     : $CLIENT_ID"
echo "========================================"
echo ""
echo "Add these to your .env.local:"
echo "  VITE_COGNITO_USER_POOL_ID=$POOL_ID"
echo "  VITE_COGNITO_CLIENT_ID=$CLIENT_ID"
echo "  VITE_AWS_REGION=$REGION"
echo ""
echo "Use this ARN for sam deploy --parameter-overrides:"
echo "  CognitoUserPoolArn=$POOL_ARN"
