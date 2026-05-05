<div align="center">

# VocMap

**Production-grade serverless vocabulary application — AWS Lambda microservices + React MVVM frontend**

![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![AWS SAM](https://img.shields.io/badge/AWS-SAM-orange?logo=amazon-aws)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![DynamoDB](https://img.shields.io/badge/DynamoDB-Single--Table-blue?logo=amazon-dynamodb)
![License](https://img.shields.io/badge/license-MIT-green)

A full-stack serverless monorepo for building and studying personal vocabulary — AWS Lambda microservices, React MVVM frontend, and Cambridge Dictionary enrichment.

</div>

---

## Features

- 📝 **Word Family Validator** — paste any text, detect and validate JSON word-family blocks, batch-save up to 930+ families to DynamoDB in chunks of 50
- 🔤 **Vocabulary Map** — deduplicated word entries with meanings, related forms, and multi-language support (`per`, `en`, `ar`, …)
- 🌐 **Cambridge Enrichment** — on-demand per-word scraping of phonetics, definitions, example sentences, and UK/US audio stored in S3
- 🔊 **Audio Playback** — UK and US pronunciation buttons streaming directly from S3
- 🔐 **Auth** — Amazon Cognito JWT authentication (sign up, sign in, confirm)
- ⚡ **Serverless** — independent Lambda per endpoint, pay-per-request DynamoDB
- 🧱 **Clean Architecture** — Domain → Application → Infrastructure → Handler per service
- 📦 **Monorepo** — shared Zod schemas and TypeScript types across all services and frontend
- 🔄 **CI/CD** — GitHub Actions with separate CI and CD pipelines, 3-environment flow (dev / staging / prod)

---

## Architecture

```
vocmap/
├── packages/
│   └── shared/                  # Entities, Zod schemas, DynamoDB key helpers
├── services/
│   ├── word-family-service/     # Word-family batch save, list, delete — 3 Lambdas
│   └── vocabulary-service/      # Vocabulary upsert, list, enrich — 4 Lambdas
├── infrastructure/
│   └── template.yaml            # DynamoDB + Cognito + CloudWatch (CloudFormation)
├── frontend/                    # React 18 + TypeScript
└── .github/workflows/           # CI + CD pipelines
```

### Backend — Clean Architecture (per service)

```
src/
├── domain/          # Pure business rules, no I/O
├── application/     # Use-cases + repository interfaces (ports)
├── infrastructure/  # DynamoDB adapter
└── handlers/        # Lambda entry points — one per endpoint
```

### DynamoDB — Single-Table Design

| PK | SK | GSI1PK | GSI1SK | Type |
|---|---|---|---|---|
| `USER#<userId>` | `FAMILY#<familyId>` | `USER#<userId>` | `SAVED#<iso>` | WORD_FAMILY |
| `USER#<userId>` | `VOCAB#<wordKey>` | `USER#<userId>` | `VOCAB#<wordKey>` | VOCABULARY |

- Row-level isolation by `userId` in every PK — zero cross-user data leakage
- GSI1 on families sorted by `savedAt` descending — newest-first paginated list
- GSI1 on vocabulary sorted alphabetically by `wordKey` — A→Z list with prefix search
- `BatchWriteCommand` in chunks of 25 with exponential back-off on `UnprocessedItems`
- Vocabulary entries upserted: new words created, existing words have meanings (dedup by `type+lang`) and relations (set-union) merged
- PITR enabled, PAY_PER_REQUEST billing, TTL attribute `ttl`

### API Gateway + Cognito Auth Flow

```
Browser → API Gateway → Cognito Authorizer → Lambda
                ↑
         JWT validated here
         (never reaches Lambda without valid token)
```

CORS configured with `AddDefaultAuthorizerToCorsPreflight: false` so preflight OPTIONS requests pass without auth headers.

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Functions | AWS Lambda (one per endpoint) |
| API | Amazon API Gateway + Cognito Authorizer |
| Database | DynamoDB (single-table, GSI, TTL, PITR) |
| Audio storage | Amazon S3 (public-read, Cambridge MP3 files) |
| Scraping | cheerio (Cambridge Dictionary HTML parsing) |
| IaC | AWS SAM + ESBuild bundling |
| Validation | Zod (shared with frontend) |
| Auth | Amazon Cognito User Pools |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite + ESBuild |
| Server state | TanStack React Query v5 |
| Auth | AWS Amplify v6 (Cognito only) |
| Routing | React Router v6 |
| Pattern | MVVM — ViewModels decouple presentation logic from UI |
| Forms | react-hook-form + Zod |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- Yarn ≥ 1.22
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- AWS CLI configured (`aws configure`)

### 1. Clone and install

```bash
git clone https://github.com/majidgdotcom/vocmap.git
cd vocmap
yarn install
yarn workspace @vocmap/shared build
```

### 2. Deploy infrastructure

```bash
cd infrastructure
aws cloudformation deploy \
  --stack-name vocmap-infra-dev \
  --template-file template.yaml \
  --parameter-overrides Environment=dev \
  --capabilities CAPABILITY_IAM \
  --no-fail-on-empty-changeset
```

Get the output values:

```bash
aws cloudformation describe-stacks \
  --stack-name vocmap-infra-dev \
  --query 'Stacks[0].Outputs' \
  --output table
```

Note `CognitoUserPoolArn` and `DynamoTableName` for the next step.

### 3. Deploy services

```bash
# Word-family service
cd services/word-family-service
sam build
sam deploy --guided \
  --parameter-overrides \
    Environment=dev \
    CognitoUserPoolArn=<CognitoUserPoolArn> \
    DynamoTableName=vocmap-dev
# Stack name: vocmap-word-family-service-dev

# Vocabulary service (includes S3 audio bucket + Cambridge enrichment Lambda)
cd ../vocabulary-service
yarn workspace @vocmap/vocabulary-service add cheerio
sam build
sam deploy --guided \
  --parameter-overrides \
    Environment=dev \
    CognitoUserPoolArn=<CognitoUserPoolArn> \
    DynamoTableName=vocmap-dev
# Stack name: vocmap-vocabulary-service-dev
```

Both deploys print API URLs in Outputs — note `WordFamilyApiUrl`, `VocabularyApiUrl`, and `AudioBucketUrl`.

### 4. Configure and run frontend

```bash
cd frontend
cp .env.example .env.local
```

Fill in `.env.local`:

```env
VITE_API_WORD_FAMILY_URL=https://<word-family-api-id>.execute-api.us-east-1.amazonaws.com/dev
VITE_API_VOCAB_URL=https://<vocab-api-id>.execute-api.us-east-1.amazonaws.com/dev
VITE_AUDIO_BUCKET_URL=https://vocmap-audio-dev.s3.amazonaws.com
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_AWS_REGION=us-east-1
```

```bash
yarn dev
# → http://localhost:5173
```

---

## API Reference

### Word Family Service

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/word-families/batch` | ✅ | Batch save word families (1–50 per request) |
| `GET` | `/word-families` | ✅ | List saved families, newest first (paginated) |
| `DELETE` | `/word-families/:familyId` | ✅ | Delete a word family |

**Query params for `GET /word-families`:** `limit` (1–100, default 50), `lastKey` (pagination cursor), `tag`

**Request body for `POST /word-families/batch`:**
```json
{
  "families": [
    {
      "title": "\"provide\" family",
      "words": [
        { "word": "provide",  "type": "verb", "typeCode": 2, "lang": "per", "mean": "فراهم کردن" },
        { "word": "provider", "type": "noun", "typeCode": 1, "lang": "per", "mean": "ارائه‌دهنده" }
      ],
      "tags": ["B2", "chapter-5"],
      "notes": "Common academic vocabulary"
    }
  ]
}
```

### Vocabulary Service

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/vocabulary/from-family/:familyId` | ✅ | Transform family into vocabulary entries (upsert + merge) |
| `GET` | `/vocabulary` | ✅ | List vocabulary entries, alphabetical (paginated) |
| `GET` | `/vocabulary/:wordKey` | ✅ | Get a single word entry |
| `POST` | `/vocabulary/:wordKey/enrich` | ✅ | Scrape Cambridge, upload audio to S3, merge into entry |

**Query params for `GET /vocabulary`:** `limit` (1–100, default 50), `lastKey`, `search` (prefix match on normalised word key)

**Vocabulary upsert behaviour:**
- New word → created with `means[]`, `relations[]`, `familyIds[]`
- Existing word → `means` deduplicated by `type + lang` pair, `relations` set-union, `familyIds` set-union
- Word key normalisation: lowercase, spaces → hyphens (`"figure out"` → `"figure-out"`)

---

## CI/CD Pipeline

```
feature/* → develop → main
               ↓          ↓
           staging     production
```

### CI (runs on every PR)
1. Lint + typecheck all workspaces
2. Unit tests with coverage
3. SAM build check (word-family-service, vocabulary-service)
4. Integration tests against dev stack (on `develop` push)

### CD (runs on merge)
1. Deploy infrastructure stack
2. Deploy word-family-service
3. Deploy vocabulary-service (creates S3 audio bucket on first deploy)
4. Build + deploy frontend to S3 + CloudFront invalidation
5. QA smoke tests gate on staging before production

### GitHub Secrets needed

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |
| `SAM_S3_BUCKET` | S3 bucket for SAM deployment artifacts |
| `COGNITO_USER_POOL_ARN` | Cognito User Pool ARN |
| `FRONTEND_S3_BUCKET` | S3 bucket for frontend static files |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |
| `TEST_USER_EMAIL` | QA test user email |
| `TEST_USER_PASSWORD` | QA test user password |

---

## Testing

### Unit tests

```bash
yarn workspace @vocmap/word-family-service test:unit
yarn workspace @vocmap/vocabulary-service test:unit
yarn workspace @vocmap/frontend test:unit
```

### Integration tests

Requires a deployed dev stack. Create a test user first (one time):

```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_8CmwMwDD6 \
  --username test@vocmap.com \
  --temporary-password Test1234! \
  --message-action SUPPRESS

aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_8CmwMwDD6 \
  --username test@vocmap.com \
  --password Test1234! \
  --permanent

export TEST_ID_TOKEN=<token>
export WORD_FAMILY_API_URL=https://<word-family-api-id>.execute-api.us-east-1.amazonaws.com/dev
export VOCAB_API_URL=https://<vocab-api-id>.execute-api.us-east-1.amazonaws.com/dev

yarn workspace @vocmap/word-family-service test:integration
yarn workspace @vocmap/vocabulary-service test:integration
```

---

## Teardown

```bash
# 1. Delete service stacks
aws cloudformation delete-stack --stack-name vocmap-word-family-service-dev
aws cloudformation delete-stack --stack-name vocmap-vocabulary-service-dev
aws cloudformation wait stack-delete-complete --stack-name vocmap-word-family-service-dev
aws cloudformation wait stack-delete-complete --stack-name vocmap-vocabulary-service-dev

# 2. Delete infrastructure stack (DynamoDB table is retained)
aws cloudformation delete-stack --stack-name vocmap-infra-dev
aws cloudformation wait stack-delete-complete --stack-name vocmap-infra-dev

# 3. Delete retained resources manually
aws dynamodb delete-table --table-name vocmap-dev
aws s3 rm s3://vocmap-audio-dev --recursive
aws s3 rb s3://vocmap-audio-dev

# 4. Clean local build artifacts
rm -rf services/word-family-service/.aws-sam \
       services/vocabulary-service/.aws-sam
rm -f  services/word-family-service/samconfig.toml \
       services/vocabulary-service/samconfig.toml
```

---

## Project Structure — Key Files

```
packages/shared/src/
├── entities/          # WordFamilyEntity · VocabEntry · CambridgeData
├── schemas/           # Zod schemas (shared FE + BE): word-family · vocabulary
├── dtos/              # API response types
└── types/             # dynamo-keys.ts (Keys helpers + normalizeWordKey)

services/word-family-service/src/
├── domain/            # WordFamilyDomain — pure factory + ownership guard
├── application/       # WordFamilyUseCases + IWordFamilyRepository interface
├── infrastructure/    # DynamoWordFamilyRepository (BatchWrite chunks of 25)
└── handlers/          # batch-save-families · get-families · delete-family

services/vocabulary-service/src/
├── domain/            # VocabularyDomain — fromFamily() · merge()
├── application/       # VocabularyUseCases + IVocabularyRepository interface
├── infrastructure/    # DynamoVocabularyRepository (upsert + merge per word)
├── scraper/           # cambridge.scraper.ts (cheerio · retry · audio download)
└── handlers/          # save-family-to-vocab · get-vocabulary · get-word · enrich-vocabulary

frontend/src/
├── config/            # api-client.ts · amplify.ts
├── services/          # word-family.service.ts · vocabulary.service.ts
├── viewmodels/        # word-family.viewmodel.ts · vocabulary.viewmodel.ts
├── hooks/             # useAuth.ts
├── components/        # layout/TopBar.tsx · common/ProtectedRoute.tsx
└── pages/             # LoginPage · WordFamilyPage · VocabularyPage
```

---

## License

MIT
