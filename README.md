# PrepSphere — Placement Preparation Platform

A unified placement preparation workspace for engineering students featuring LeetCode analytics, AI mentorship, mock interviews, a competitive leaderboard, knowledge base management, and more.

---

## Tech Stack

| Layer       | Technology                                                                  |
| ----------- | --------------------------------------------------------------------------- |
| **Frontend** | React 18 · Vite · Tailwind CSS · Radix UI · React Query · Recharts · React Router |
| **Backend**  | Node.js 20 · Express · Prisma ORM · BullMQ (job queues)                    |
| **Database** | PostgreSQL (Neon serverless)                                               |
| **Cache**    | Redis 7                                                                    |
| **AI / ML**  | Google Gemini API · LangChain · Pinecone (vector search)                   |
| **Infra**    | Docker · Docker Compose                                                    |

---

## Prerequisites

Make sure the following are installed on your machine:

- **Node.js** ≥ 20 — [https://nodejs.org](https://nodejs.org)
- **npm** ≥ 9 (ships with Node 20)
- **Docker & Docker Compose** — [https://docs.docker.com/get-docker](https://docs.docker.com/get-docker)
- **Git** — [https://git-scm.com](https://git-scm.com)

---

## Project Structure

```
FYP_2027/
├── backend/                # Express API server
│   ├── config/             # Database & Redis configuration
│   ├── controllers/        # Route handlers
│   ├── middleware/          # Auth & error middleware
│   ├── prisma/             # Prisma schema & migrations
│   ├── queues/             # BullMQ job queues
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic layer
│   ├── utils/              # Shared utilities
│   ├── workers/            # Background job workers
│   ├── docker-compose.yml  # Backend + Redis containers
│   ├── Dockerfile          # Backend container image
│   └── index.js            # Server entry point
│
├── frontend/               # React SPA (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React context providers
│   │   ├── features/       # Feature-specific modules
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   ├── pages/          # Page-level components
│   │   ├── routes/         # Route configuration
│   │   ├── services/       # API client & service functions
│   │   └── styles/         # Global CSS
│   ├── Dockerfile.frontend # Frontend container image
│   └── vite.config.js      # Vite configuration
│
└── README.md
```

---

## Getting Started

### 1 · Clone the Repository

```bash
git clone https://github.com/<your-username>/FYP_2027.git
cd FYP_2027
```

---

### 2 · Backend Setup

#### 2.1 — Install dependencies

```bash
cd backend
npm install
```

#### 2.2 — Configure environment variables

Create a `.env` file inside `backend/` (use the provided template):

```bash
cp .env.example .env
```

Then fill in the values:

```env
PORT=8000
NODE_ENV=development

# Database — Neon PostgreSQL connection string
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"

# Redis (use localhost when running Redis via Docker Compose)
REDIS_URL="redis://localhost:6379"

# JWT Authentication
JWT_SECRET="your_super_secret_jwt_key_here"
JWT_EXPIRES_IN="1d"

# (Optional) AI Features — required for AI Mentor & Knowledge Base
GEMINI_API_KEY="your_gemini_api_key"
PINECONE_API_KEY="your_pinecone_api_key"
PINECONE_INDEX_NAME="your_pinecone_index_name"
```

> **Note:** The AI Mentor, Knowledge Base, and Resume features require valid `GEMINI_API_KEY` and Pinecone credentials. The rest of the app works without them.

#### 2.3 — Start Redis & Backend with Docker Compose

This starts both the backend server and a Redis container:

```bash
docker compose up
```

The backend will be available at **http://localhost:8000**.

> On the first run, Docker will build the image and install dependencies inside the container. Subsequent runs use the cached image.

#### 2.4 — Push the database schema

In a separate terminal (while Docker is running):

```bash
cd backend
npx prisma db push
```

This creates all database tables in your Neon PostgreSQL instance.

#### 2.5 — Generate Prisma Client

```bash
npx prisma generate
```

> This step is automatically run during the Docker build, but you may need it locally for IDE autocompletion.

---

### 3 · Frontend Setup

#### 3.1 — Install dependencies

```bash
cd frontend
npm install
```

#### 3.2 — Start the development server

```bash
npm run dev
```

The frontend will be available at **http://localhost:3000**.

> The frontend expects the backend to be running on `http://localhost:8000/api`. If you change the backend port, update the `API_BASE_URL` in [`frontend/src/services/apiClient.js`](frontend/src/services/apiClient.js).

---

### 4 · Verify the Setup

1. Open **http://localhost:3000** in your browser.
2. Register a new account.
3. Log in and explore the Dashboard, Leaderboard, and Mentor features.

---

## Available Scripts

### Backend (`backend/`)

| Command               | Description                                  |
| --------------------- | -------------------------------------------- |
| `npm run dev`         | Start dev server with hot-reload (nodemon)   |
| `npm start`           | Start production server                      |
| `npm run db:push`     | Push Prisma schema changes to the database   |
| `npm run db:generate` | Regenerate Prisma Client                     |
| `docker compose up`   | Start backend + Redis via Docker             |
| `docker compose down` | Stop and remove containers                   |

### Frontend (`frontend/`)

| Command             | Description                             |
| ------------------- | --------------------------------------- |
| `npm run dev`       | Start Vite dev server (port 3000)       |
| `npm run build`     | Build production bundle to `dist/`      |
| `npm run preview`   | Preview the production build locally    |

---

## API Routes

All API endpoints are prefixed with `/api`:

| Module        | Base Route           | Description                     |
| ------------- | -------------------- | ------------------------------- |
| Auth          | `/api/auth`          | Register, login, token refresh  |
| User          | `/api/user`          | Profile management              |
| Dashboard     | `/api/dashboard`     | Dashboard data & stats          |
| LeetCode      | `/api/leetcode`      | LeetCode sync & stats           |
| Leaderboard   | `/api/leaderboard`   | Rankings & leaderboard          |
| Activity      | `/api/activity`      | Daily streaks & check-ins       |
| Mentor        | `/api/mentor`        | AI mentor chat                  |
| Interview     | `/api/interview`     | Mock interview sessions         |
| Knowledge     | `/api/knowledge`     | Knowledge base documents        |
| Resume        | `/api/resume`        | Resume analysis                 |
| AI Misc       | `/api/ai`            | Miscellaneous AI features       |

---

## Running Without Docker (Alternative)

If you prefer running without Docker, you need Redis installed locally:

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Ubuntu / Debian
sudo apt install redis-server
sudo systemctl start redis
```

Then start the backend directly:

```bash
cd backend
npm run dev
```

---

## Troubleshooting

| Problem                              | Solution                                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `ECONNREFUSED` on Redis              | Make sure Redis is running (`docker compose up` or `redis-server`)                           |
| Prisma Client not found              | Run `npx prisma generate` in the `backend/` directory                                        |
| Database connection fails            | Verify your `DATABASE_URL` in `.env` and ensure Neon allows your IP                          |
| Port 8000 already in use             | Stop the conflicting process or change `PORT` in `.env`                                      |
| Frontend can't reach backend         | Ensure backend is on port 8000; update `API_BASE_URL` in `apiClient.js` if different         |
| AI features return errors            | Set valid `GEMINI_API_KEY`, `PINECONE_API_KEY`, and `PINECONE_INDEX_NAME` in `.env`          |

---

## License

This project is part of a Final Year Project (FYP). All rights reserved.
