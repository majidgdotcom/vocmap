<div align="center">

# VocMap

**Production-grade serverless vocabulary application — AWS Lambda microservices + React MVVM frontend**

![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![AWS SAM](https://img.shields.io/badge/AWS-SAM-orange?logo=amazon-aws)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![DynamoDB](https://img.shields.io/badge/DynamoDB-Single--Table-blue?logo=amazon-dynamodb)
![License](https://img.shields.io/badge/license-MIT-green)

A full-stack serverless monorepo built with clean architecture principles, AWS Lambda microservices, and a React MVVM frontend.

</div>

---

## Features

- ✅ **Todo CRUD** — create, read, update, delete, archive
- 🏷 **Multi-keyword tagging** — add multiple keywords per todo, filter by keyword
- 📚 **Vocabulary Map** — save validated word-family JSON blocks to DynamoDB in batch, tag and browse your personal vocabulary
- 🔐 **Auth** — Amazon Cognito JWT authentication (sign up, sign in, confirm)
- ⚡ **Serverless** — independent Lambda per endpoint, pay-per-request DynamoDB
- 🧱 **Clean architecture** — Domain → Application → Infrastructure → Handler per service
- 📦 **Monorepo** — shared Zod schemas and TypeScript types across backend and frontend
- 🔄 **CI/CD** — GitHub Actions with separate CI and CD pipelines, 3-environment flow

---

## Architecture

```
vocmap/
├── packages/
│   └── shared/                 # Entities, DTOs, Zod schemas, DynamoDB key helpers
├── services/
│   ├── todo-service/           # Todo CRUD — 6 Lambda functions
│   ├── keyword-service/        # Keyword management — 4 Lambda functions
│   └── vocabulary-service/     # Word-family batch save — 3 Lambda functions
├── infrastructure/
│   └── template.yaml           # DynamoDB + Cognito + CloudWatch (CloudFormation)
├── frontend/                   # React + TypeScript + MVVM
└── .github/workflows/          # CI + CD pipelines
```

### Backend — Clean Architecture (per service)

```
src/
├── domain/          # Pure business rules, no dependencies
├── application/     # Use-cases + repository interfaces (ports)
├── infrastructure/  # DynamoDB adapter (adapters)
└── handlers/        # Lambda entrypoints — one per endpoint
```

### DynamoDB — Single-Table Design

| PK | SK | GSI1PK | GSI1SK | Type |
|---|---|---|---|---|
| `USER#<userId>` | `TODO#<todoId>` | `USER#<userId>` | `CREATED#<iso>` | TODO |
| `USER#<userId>` | `KEYWORD#<todoId>#<kwId>` | `TODO#<todoId>` | `KEYWORD#<kwId>` | KEYWORD |
| `USER#<userId>` | `FAMILY#<familyId>` | `USER#<userId>` | `SAVED#<iso>` | WORD_FAMILY |

- Row-level isolation by `userId` in every PK — zero cross-user data leakage
- GSI1 on todos sorted by `createdAt` descending — efficient paginated list queries
- GSI1 on keywords grouped by `todoId` — O(1) keyword lookup per todo
- GSI1 on word families sorted by `savedAt` descending — same index, distinct `SAVED#` prefix
- Conditional writes prevent duplicate creation and lost updates
- DynamoDB BatchWrite (chunks of 25) for atomic multi-family saves with exponential back-off retry on `UnprocessedItems`

### API Gateway + Cognito Auth Flow

```
Browser → API Gateway → Cognito Authorizer → Lambda
                ↑
         JWT validated here
         (never reaches Lambda without valid token)
```

CORS configured with `AddDefaultAuthorizerToCorsPreflight: false` so preflight `OPTIONS` requests pass without auth headers.

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Functions | AWS Lambda (one per endpoint) |
| API | Amazon API Gateway + Cognito Authorizer |
| Database | DynamoDB (single-table, GSI, TTL) |
| IaC | AWS SAM + ESBuild bundling |
| Validation | Zod (shared with frontend) |
| Auth | Amazon Cognito User Pools |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite + ESBuild |
| Server state | TanStack React Query v5 |
| UI state | Redux Toolkit |
| Forms | react-hook-form + useFieldArray + Zod |
| Auth | AWS Amplify v6 (Cognito only) |
| Pattern | MVVM — ViewModels decouple UI from logic |
| Routing | React Router v6 |

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

All shared resources — DynamoDB, Cognito User Pool, and CloudWatch log groups — are deployed in a single CloudFormation stack:

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

Note the `CognitoUserPoolArn` and `DynamoTableName` — you'll need them in the next step.

### 3. Deploy services

```bash
# Todo service
cd services/todo-service
sam build
sam deploy --guided \
  --parameter-overrides \
    Environment=dev \
    CognitoUserPoolArn=<CognitoUserPoolArn from stack outputs> \
    DynamoTableName=vocmap-dev
# Stack name: vocmap-todo-service-dev

# Keyword service
cd ../keyword-service
sam build
sam deploy --guided \
  --parameter-overrides \
    Environment=dev \
    CognitoUserPoolArn=<CognitoUserPoolArn from stack outputs> \
    DynamoTableName=vocmap-dev
# Stack name: vocmap-keyword-service-dev

# Vocabulary service
cd ../vocabulary-service
sam build
sam deploy --guided \
  --parameter-overrides \
    Environment=dev \
    CognitoUserPoolArn=<CognitoUserPoolArn from stack outputs> \
    DynamoTableName=vocmap-dev
# Stack name: vocmap-vocabulary-service-dev
```

All three deploys print API URLs in the Outputs section — note them for the frontend.

### 4. Configure and run frontend

```bash
cd frontend
cp .env.example .env.local
```

Fill in `.env.local` with values from the deploy outputs:

```env
VITE_API_TODO_URL=https://<todo-api-id>.execute-api.us-east-1.amazonaws.com/dev
VITE_API_KEYWORD_URL=https://<keyword-api-id>.execute-api.us-east-1.amazonaws.com/dev
VITE_API_VOCAB_URL=https://<vocab-api-id>.execute-api.us-east-1.amazonaws.com/dev
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

### Todo Service

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/todos` | ✅ | Create todo |
| `GET` | `/todos` | ✅ | List todos (paginated) |
| `GET` | `/todos/:id` | ✅ | Get todo by ID |
| `PUT` | `/todos/:id` | ✅ | Update todo |
| `DELETE` | `/todos/:id` | ✅ | Delete todo |
| `POST` | `/todos/:id/archive` | ✅ | Archive todo |

**Query params for `GET /todos`:** `status` (`ACTIVE`\|`COMPLETED`\|`ARCHIVED`), `keywordId`, `limit`, `lastKey`

### Keyword Service

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/todos/:id/keywords` | ✅ | Add keywords (bulk) |
| `GET` | `/todos/:id/keywords` | ✅ | List keywords for todo |
| `DELETE` | `/todos/:id/keywords/:kwId` | ✅ | Delete a keyword |
| `GET` | `/keywords/:kwId/todos` | ✅ | Get todos by keyword |

### Vocabulary Service

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/word-families/batch` | ✅ | Batch save word families (1–50) |
| `GET` | `/word-families` | ✅ | List saved families (paginated) |
| `DELETE` | `/word-families/:familyId` | ✅ | Delete a word family |

**Query params for `GET /word-families`:** `limit` (1–100, default 50), `lastKey` (pagination cursor), `tag` (filter by tag)

**Request body for `POST /word-families/batch`:**
```json
{
  "families": [
    {
      "title": "\"provide\" family",
      "words": [
        { "word": "provide",  "type": "verb",      "typeCode": 2, "mean": "فراهم کردن" },
        { "word": "provider", "type": "noun",      "typeCode": 1, "mean": "ارائه‌دهنده" },
        { "word": "provision","type": "noun",      "typeCode": 1, "mean": "تأمین" }
      ],
      "tags": ["B2", "chapter-5"],
      "notes": "Common academic vocabulary"
    }
  ]
}
```

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
3. SAM build check (todo, keyword, vocabulary)
4. Integration tests against dev stack (on `develop` push)

### CD (runs on merge)
1. Deploy infrastructure stack
2. Deploy todo-service
3. Deploy keyword-service
4. Deploy vocabulary-service
5. Build + deploy frontend to S3 + CloudFront invalidation
6. QA smoke tests gate on staging before production

### GitHub Secrets needed

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |
| `SAM_S3_BUCKET` | S3 bucket for SAM artifacts |
| `COGNITO_USER_POOL_ARN` | Cognito User Pool ARN |
| `FRONTEND_S3_BUCKET` | S3 bucket for frontend |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution |
| `TEST_USER_EMAIL` | QA test user |
| `TEST_USER_PASSWORD` | QA test password |

---

## Testing

### Unit tests

```bash
yarn workspace @vocmap/todo-service test:unit
yarn workspace @vocmap/keyword-service test:unit
yarn workspace @vocmap/vocabulary-service test:unit
yarn workspace @vocmap/frontend test:unit
```

### Integration tests

Requires a deployed dev stack. First create a test user and get a token:

```bash
# Create test user (one time only)
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

# Export env vars
export TEST_ID_TOKEN=<token>
export TODO_API_URL=https://<todo-api-id>.execute-api.us-east-1.amazonaws.com/dev
export KEYWORD_API_URL=https://<keyword-api-id>.execute-api.us-east-1.amazonaws.com/dev
export VOCAB_API_URL=https://bqgk7zdbm9.execute-api.us-east-1.amazonaws.com/dev

# Run integration tests
yarn workspace @vocmap/todo-service test:integration
yarn workspace @vocmap/vocabulary-service test:integration
```

---

## Teardown

```bash
# 1. Delete service stacks first
aws cloudformation delete-stack --stack-name vocmap-todo-service-dev
aws cloudformation delete-stack --stack-name vocmap-keyword-service-dev
aws cloudformation delete-stack --stack-name vocmap-vocabulary-service-dev
aws cloudformation wait stack-delete-complete --stack-name vocmap-todo-service-dev
aws cloudformation wait stack-delete-complete --stack-name vocmap-keyword-service-dev
aws cloudformation wait stack-delete-complete --stack-name vocmap-vocabulary-service-dev

# 2. Delete infrastructure stack
# Note: DynamoDB table is retained due to DeletionPolicy: Retain
aws cloudformation delete-stack --stack-name vocmap-infra-dev
aws cloudformation wait stack-delete-complete --stack-name vocmap-infra-dev

# 3. Delete retained DynamoDB table
aws dynamodb delete-table --table-name vocmap-dev

# 4. Clean local artifacts
rm -rf services/todo-service/.aws-sam \
       services/keyword-service/.aws-sam \
       services/vocabulary-service/.aws-sam
rm -f  services/todo-service/samconfig.toml \
       services/keyword-service/samconfig.toml \
       services/vocabulary-service/samconfig.toml
```

---

## Project Structure — Key Files

```
packages/shared/src/
├── entities/          # TodoEntity, KeywordEntity, WordFamilyEntity
├── schemas/           # Zod validation schemas (shared FE + BE)
├── dtos/              # API response types
└── types/             # DynamoDB key helpers

services/todo-service/src/
├── domain/            # TodoDomain — pure business logic
├── application/       # TodoUseCases + ITodoRepository interface
├── infrastructure/    # DynamoTodoRepository
└── handlers/          # create-todo.ts, get-todos.ts, ...

services/keyword-service/src/
├── domain/            # KeywordDomain
├── application/       # KeywordUseCases + IKeywordRepository interface
├── infrastructure/    # DynamoKeywordRepository
└── handlers/          # add-keywords.ts, get-keywords.ts, ...

services/vocabulary-service/src/
├── domain/            # WordFamilyDomain — pure factory + ownership guard
├── application/       # WordFamilyUseCases + IWordFamilyRepository interface
├── infrastructure/    # DynamoWordFamilyRepository (BatchWrite, chunks of 25)
└── handlers/          # batch-save-families.ts, get-families.ts, delete-family.ts

frontend/src/
├── viewmodels/        # TodoViewModel — presentation logic, no React
├── services/          # React Query hooks (todo, keyword, word-family)
├── store/slices/      # selectedTodo.slice.ts, keywordFilter.slice.ts
├── hooks/             # useAuth, useSelectedTodo, useTodoForm
├── components/        # TodoCard, TodoDetailPanel, KeywordPanel, ...
└── pages/             # LoginPage, TodosPage, WordFamilyPage
```

---

## License

MIT
