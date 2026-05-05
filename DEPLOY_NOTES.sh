# ── .github/workflows/cd.yml ──────────────────────────────────────────────────
#
# Replace all service deploy steps with these two blocks.
# Place them AFTER "Deploy infrastructure" and BEFORE "Build + deploy frontend".
#

      # ── word-family-service ─────────────────────────────────────────────────

      - name: Build word-family-service
        working-directory: services/word-family-service
        run: sam build

      - name: Deploy word-family-service
        working-directory: services/word-family-service
        run: |
          sam deploy \
            --stack-name vocmap-word-family-service-${{ env.DEPLOY_ENV }} \
            --s3-bucket ${{ secrets.SAM_S3_BUCKET }} \
            --s3-prefix word-family-service \
            --region ${{ vars.AWS_REGION }} \
            --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
            --parameter-overrides \
              Environment=${{ env.DEPLOY_ENV }} \
              CognitoUserPoolArn=${{ secrets.COGNITO_USER_POOL_ARN }} \
              DynamoTableName=vocmap-${{ env.DEPLOY_ENV }} \
            --no-fail-on-empty-changeset

      - name: Export WORD_FAMILY_URL for frontend
        run: |
          URL=$(aws cloudformation describe-stacks \
            --stack-name vocmap-word-family-service-${{ env.DEPLOY_ENV }} \
            --query "Stacks[0].Outputs[?OutputKey=='WordFamilyApiUrl'].OutputValue" \
            --output text)
          echo "VITE_API_WORD_FAMILY_URL=$URL" >> $GITHUB_ENV

      # ── vocabulary-service ──────────────────────────────────────────────────

      - name: Build vocabulary-service
        working-directory: services/vocabulary-service
        run: sam build

      - name: Deploy vocabulary-service
        working-directory: services/vocabulary-service
        run: |
          sam deploy \
            --stack-name vocmap-vocabulary-service-${{ env.DEPLOY_ENV }} \
            --s3-bucket ${{ secrets.SAM_S3_BUCKET }} \
            --s3-prefix vocabulary-service \
            --region ${{ vars.AWS_REGION }} \
            --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
            --parameter-overrides \
              Environment=${{ env.DEPLOY_ENV }} \
              CognitoUserPoolArn=${{ secrets.COGNITO_USER_POOL_ARN }} \
              DynamoTableName=vocmap-${{ env.DEPLOY_ENV }} \
            --no-fail-on-empty-changeset

      - name: Export VOCAB_URL and AUDIO_BUCKET_URL for frontend
        run: |
          VOCAB_URL=$(aws cloudformation describe-stacks \
            --stack-name vocmap-vocabulary-service-${{ env.DEPLOY_ENV }} \
            --query "Stacks[0].Outputs[?OutputKey=='VocabularyApiUrl'].OutputValue" \
            --output text)
          echo "VITE_API_VOCAB_URL=$VOCAB_URL" >> $GITHUB_ENV

          AUDIO_URL=$(aws cloudformation describe-stacks \
            --stack-name vocmap-vocabulary-service-${{ env.DEPLOY_ENV }} \
            --query "Stacks[0].Outputs[?OutputKey=='AudioBucketUrl'].OutputValue" \
            --output text)
          echo "VITE_AUDIO_BUCKET_URL=$AUDIO_URL" >> $GITHUB_ENV
