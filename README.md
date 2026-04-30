<div align="center">

# VocMap

**Production-grade serverless vocmaplication — AWS Lambda microservices + React MVVM frontend**

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
│   └── shared/              # Entities, DTOs, Zod schemas, DynamoDB key helpers
├── services/
│   ├── todo-service/        # Todo CRUD — 6 Lambda functions
│   └── keyword-service/     # Keyword management — 4 Lambda functions
├── infrastructure/
│   └── template.yaml        # DynamoDB + Cognito + CloudWatch (CloudFormation)
├── frontend/                # React + TypeScript + MVVM
└── .github/workflows/       # CI + CD pipelines
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

- Row-level isolation by `userId` in every PK — zero cross-user data leakage
- GSI1 on todos sorted by `createdAt` descending — efficient paginated list queries
- GSI1 on keywords grouped by `todoId` — O(1) keyword lookup per todo
- Conditional writes prevent duplicate creation and lost updates
- DynamoDB Transactions for atomic multi-keyword batch writes

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
```

Both deploys print API URLs in the Outputs section — note them for the frontend.

### 4. Configure and run frontend

```bash
cd frontend
cp .env.example .env.local
```

Fill in `.env.local` with values from the deploy outputs:

```env
VITE_API_TODO_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev
VITE_API_KEYWORD_URL=https://yyyyyyyyyy.execute-api.us-east-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
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
3. SAM build check
4. Integration tests against dev stack (on `develop` push)

### CD (runs on merge)
1. Deploy infrastructure stack
2. Deploy todo-service
3. Deploy keyword-service
4. Build + deploy frontend to S3 + CloudFront invalidation
5. QA smoke tests gate on staging before production

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
yarn workspace @vocmap/frontend test:unit
```

Expected output — 16 tests across 3 workspaces:
- todo-service: 5 passed (TodoUseCases — create, ownership, archive)
- keyword-service: 6 passed (KeywordUseCases — add, get, delete)
- frontend: 5 passed (TodoViewModel — active, archived, completed, description)

### Integration tests

Requires a deployed dev stack. First create a test user and get a token:

```bash
# Create test user (one time only)
aws cognito-idp admin-create-user \
  --user-pool-id <YOUR_POOL_ID> \
  --username test@todoapp.com \
  --temporary-password Test1234! \
  --message-action SUPPRESS

aws cognito-idp admin-set-user-password \
  --user-pool-id <YOUR_POOL_ID> \
  --username test@todoapp.com \
  --password Test1234! \
  --permanent

# Export env vars (all in same terminal session)
export TEST_ID_TOKEN=

export TODO_API_URL=https://<todo-api-id>.execute-api.us-east-1.amazonaws.com/dev
export KEYWORD_API_URL=https://<keyword-api-id>.execute-api.us-east-1.amazonaws.com/dev

# Run integration tests
yarn workspace @vocmap/todo-service test:integration
```

Expected output — 9/9 passed:
- Todo CRUD: create, list, get, update
- Keywords: add bulk, list, delete
- Archive + cleanup: archive, delete

---

## Teardown

```bash
# 1. Delete service stacks first
aws cloudformation delete-stack --stack-name vocmap-todo-service-dev
aws cloudformation delete-stack --stack-name vocmap-keyword-service-dev
aws cloudformation wait stack-delete-complete --stack-name vocmap-todo-service-dev
aws cloudformation wait stack-delete-complete --stack-name vocmap-keyword-service-dev

# 2. Delete infrastructure stack
# Note: DynamoDB table is retained due to DeletionPolicy: Retain
aws cloudformation delete-stack --stack-name vocmap-infra-dev
aws cloudformation wait stack-delete-complete --stack-name vocmap-infra-dev

# 3. Delete retained DynamoDB table
aws dynamodb delete-table --table-name vocmap-dev

# 4. Clean local artifacts
rm -rf services/todo-service/.aws-sam services/keyword-service/.aws-sam
rm -f services/todo-service/samconfig.toml services/keyword-service/samconfig.toml
```

---

## Project Structure — Key Files

```
packages/shared/src/
├── entities/          # TodoEntity, KeywordEntity interfaces
├── schemas/           # Zod validation schemas (shared FE + BE)
├── dtos/              # API response types
└── types/             # DynamoDB key helpers

services/todo-service/src/
├── domain/            # TodoDomain — pure business logic
├── application/       # TodoUseCases + ITodoRepository interface
├── infrastructure/    # DynamoTodoRepository
└── handlers/          # create-todo.ts, get-todos.ts, ...

frontend/src/
├── viewmodels/        # TodoViewModel — presentation logic, no React
├── services/          # React Query hooks (todo.service.ts, keyword.service.ts)
├── store/slices/      # selectedTodo.slice.ts, keywordFilter.slice.ts
├── hooks/             # useAuth, useSelectedTodo, useTodoForm
├── components/        # TodoCard, TodoDetailPanel, KeywordPanel, ...
└── pages/             # LoginPage, TodosPage
```

---

## License

MIT
