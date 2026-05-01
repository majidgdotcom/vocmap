# ── frontend/.env.example additions ─────────────────────────────────────────
# Add this line alongside the existing API URLs:
VITE_API_VOCAB_URL=https://<vocabulary-api-id>.execute-api.us-east-1.amazonaws.com/dev


# ── .github/workflows/cd.yml — add vocabulary-service deploy steps ───────────
#
# Paste these steps AFTER the existing "Deploy keyword-service" block
# and BEFORE "Deploy frontend":
#
#    - name: Build vocabulary-service
#      working-directory: services/vocabulary-service
#      run: sam build
#
#    - name: Deploy vocabulary-service
#      working-directory: services/vocabulary-service
#      run: |
#        sam deploy \
#          --stack-name vocmap-vocabulary-service-${{ env.DEPLOY_ENV }} \
#          --s3-bucket ${{ secrets.SAM_S3_BUCKET }} \
#          --s3-prefix vocabulary-service \
#          --region ${{ vars.AWS_REGION }} \
#          --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
#          --parameter-overrides \
#            Environment=${{ env.DEPLOY_ENV }} \
#            CognitoUserPoolArn=${{ secrets.COGNITO_USER_POOL_ARN }} \
#            DynamoTableName=vocmap-${{ env.DEPLOY_ENV }} \
#          --no-fail-on-empty-changeset
#
#    - name: Export VOCAB_URL for frontend build
#      run: |
#        VOCAB_URL=$(aws cloudformation describe-stacks \
#          --stack-name vocmap-vocabulary-service-${{ env.DEPLOY_ENV }} \
#          --query "Stacks[0].Outputs[?OutputKey=='VocabularyApiUrl'].OutputValue" \
#          --output text)
#        echo "VITE_API_VOCAB_URL=$VOCAB_URL" >> $GITHUB_ENV
#
#
# ── root package.json — add vocabulary-service to workspaces ─────────────────
#
#  "workspaces": [
#    "packages/*",
#    "services/*",      ← already covers services/vocabulary-service
#    "frontend"
#  ]
#
# No change needed — "services/*" glob already picks it up.


# ── CI .github/workflows/ci.yml additions ────────────────────────────────────
#
# Add typecheck step alongside the existing service checks:
#
#      - name: Typecheck (vocabulary-service)
#        run: yarn workspace @vocmap/vocabulary-service typecheck
#
# Add SAM build check (optional — vocabulary-service follows the same pattern):
#
#      - name: SAM build (vocabulary-service)
#        working-directory: services/vocabulary-service
#        run: sam build
