# SnapAI

SnapAI is an AI-assisted expense tracker. Users sign in with Google, upload receipt images, and receive structured expense records with merchant, amount, currency, date, reason, and category. The dashboard summarizes spending and includes an **Ask your expenses** AI utility for questions about saved expenses.

## Features

- Google sign-in with JWT-based authenticated sessions
- Receipt image uploads through Cloudinary
- AI-powered receipt extraction and categorization
- Expense history and monthly summaries
- Category totals by currency
- Ask-your-expenses modal powered by an LLM
- Responsive dashboard built with Next.js and Tailwind CSS
- PostgreSQL persistence managed with SQLAlchemy and Alembic

## Repository Layout

```text
snap_ai/
├── backend_and_ai/          # FastAPI API, database models, migrations, AI graph
│   ├── app/
│   │   ├── api/v1/          # Auth, users, receipt processing, expense queries, Ask AI
│   │   ├── ai/              # LangGraph receipt extraction and categorization
│   │   ├── auth/            # JWT creation and request authentication
│   │   ├── db/              # SQLAlchemy engine and session management
│   │   ├── models/          # User and Expense database models
│   │   ├── schemas/         # Pydantic request and response schemas
│   │   └── services/        # Backend service orchestration
│   ├── alembic/             # Database migration scripts
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # Next.js dashboard
│   ├── src/app/             # Pages, layout, and global styles
│   ├── src/components/      # Reusable dashboard components, including Ask AI
│   ├── src/services/        # API, auth, and Cloudinary clients
│   └── package.json
└── requirements.txt         # Root Python dependency snapshot
```

## Prerequisites

Install or provision the following before running the project:

- Python 3.12 or newer
- Node.js and npm
- PostgreSQL
- A Google OAuth Web client ID
- An OpenAI API key
- A Cloudinary account with an unsigned upload preset

## Environment Variables

### Backend

Create `backend_and_ai/.env`:

```env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://user:password@localhost:5432/snapai
JWT_SECRET_KEY=use_a_long_random_secret
GOOGLE_CLIENT_ID=your_google_web_client_id
ENVIRONMENT=development
CHROMA_PERSIST_DIR=./chroma_db
```

`OPENAI_API_KEY`, `DATABASE_URL`, and `JWT_SECRET_KEY` are required for normal operation. `GOOGLE_CLIENT_ID` must match the client ID used by the frontend Google sign-in button. `CHROMA_PERSIST_DIR` is optional and defaults to `./chroma_db`.

The repository includes `backend_and_ai/.env.example`, but add `JWT_SECRET_KEY` when creating the real file. Never commit real API keys, database passwords, or JWT secrets.

### Frontend

Create or update `frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_web_client_id
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

`NEXT_PUBLIC_*` values are exposed to the browser. Do not put private credentials in them. The Cloudinary upload preset must be an unsigned preset configured for the intended upload folder and formats.

## Local Development

Run the backend and frontend in separate terminals.

### 1. Install and start the backend

```bash
cd backend_and_ai
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is available at `http://localhost:8000`.

Useful backend URLs:

- Health check: `http://localhost:8000/health`
- Interactive API docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 2. Install and start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in a browser. The frontend redirects unauthenticated users to `/login` and stores the returned access token in browser local storage.

### 3. Database migrations

Run migration commands from `backend_and_ai/` with the backend virtual environment active:

```bash
alembic upgrade head
```

To create a migration after changing a model:

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

The current migrations create the users table and expenses table with a user foreign key.

## API Reference

All routes below are mounted under `/api/v1`. Protected routes require:

```http
Authorization: Bearer <access_token>
```

### Authentication

#### `POST /api/v1/auth/google`

Verifies a Google credential and returns a JWT plus the user profile.

Request:

```json
{
  "token": "google_identity_token"
}
```

Response shape:

```json
{
  "access_token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "person@example.com",
    "full_name": "Example User"
  }
}
```

### User profile

#### `GET /api/v1/users/me`

Returns the authenticated user's profile.

### Expenses

#### `POST /api/v1/ai/process-expense`

Runs the receipt image URL through the extraction and categorization graph, saves the resulting expense for the authenticated user, and returns the structured result.

Request:

```json
{
  "image_url": "https://res.cloudinary.com/example/image/upload/receipt.jpg"
}
```

#### `GET /api/v1/ai/expenses`

Returns the authenticated user's saved expenses and category summary.

#### `GET /api/v1/ai/expenses-summary`

Returns the current-month date range, totals by currency, transaction count, and category totals.

### Ask your expenses

#### `POST /api/v1/ai/ask`

Sends the authenticated user's expense data and question to the configured LLM. The answer is based only on that user's stored expenses.

Request:

```json
{
  "question": "How much did I spend on food this month?"
}
```

Response:

```json
{
  "answer": "You spent $184.32 on food this month, across 12 transactions."
}
```

## Application Flow

### Sign-in

1. The frontend loads the Google Identity Services script on `/login`.
2. Google returns an identity credential.
3. The frontend sends it to `POST /api/v1/auth/google`.
4. The backend verifies the credential, creates or finds the user, and returns a seven-day JWT.
5. The frontend stores the token in `localStorage` under `access_token`.

### Receipt capture

1. The user selects a receipt in the dashboard.
2. The frontend uploads the image directly to Cloudinary.
3. The returned secure image URL is sent to `POST /api/v1/ai/process-expense`.
4. The backend runs the LangGraph receipt workflow.
5. The validated expense is saved to PostgreSQL and returned to the dashboard.

### Ask your expenses

The dashboard renders `AskExpensesButton` from `frontend/src/components/AskExpenses.tsx`. It opens a modal rather than navigating away. The component cycles through example questions, submits the selected question to `POST /api/v1/ai/ask`, and displays the returned answer in the modal chat view. It also handles loading, request errors, and users who have not saved any expenses yet.

## Frontend Commands

Run these from `frontend/`:

```bash
npm run dev       # Start the development server
npm run lint      # Run ESLint
npm run build     # Create a production build
npm run start     # Serve the production build
```

## Backend Commands

Run these from `backend_and_ai/` with the virtual environment active:

```bash
uvicorn app.main:app --reload --port 8000
alembic upgrade head
```

The backend also has a Dockerfile for deployment platforms that provide a `PORT` environment variable:

```bash
docker build -t snapai-backend ./backend_and_ai
docker run --env-file backend_and_ai/.env -p 8000:8000 snapai-backend
```

For production, use a managed PostgreSQL database, HTTPS, restricted CORS origins, a strong JWT secret, and provider credentials stored in the deployment platform's secret manager.

## Google OAuth Configuration

Configure the Google OAuth client with the frontend origin used during development and deployment, for example:

- Authorized JavaScript origin: `http://localhost:3000`
- Authorized JavaScript origin: your deployed frontend URL

## AI Evaluation

The receipt extraction and categorization pipeline has been systematically
evaluated against manually verified ground truth. See [EVALUATION.md](./EVALUATION.md)
for full results, including per-field accuracy, identified failure modes
(e.g. a hallucinated date on a receipt with no visible date, and a
merchant-vs-recipient extraction ambiguity on transfer receipts), and
planned fixes.

**Summary:** Amount 100%, Currency 100%, Date 89%, Category 78%, Merchant 22%
(see report for why merchant accuracy reflects a design ambiguity rather
than random failure).

