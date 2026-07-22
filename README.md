# AI Task Processing Platform

A production-oriented asynchronous text-processing platform. Authenticated users
create tasks in a React dashboard, the Express API persists them in MongoDB and
queues execution in Redis, and independently scalable Python workers process the
jobs and save results and execution logs.

## Architecture summary

```text
Browser -> React/nginx -> Express API -> MongoDB
                         |             ^
                         v             |
                       Redis ------> Python workers
```

See [docs/architecture.md](docs/architecture.md) for scaling, recovery, security,
monitoring, staging, and production design details.

## Technology stack

- Frontend: React 19, Vite, React Router, nginx
- API: Node.js 22, Express 5, Mongoose
- Worker: Python 3, PyMongo, redis-py
- Data: MongoDB 8 and Redis 7 with AOF persistence
- Security: JWT, bcrypt, Helmet, CORS, rate limiting
- Platform: Docker Compose, Kubernetes/Kustomize, Argo CD, GitHub Actions

## Features

- Registration followed by login and protected frontend routes
- JWT-protected task APIs with per-user ownership checks
- Uppercase, lowercase, reverse-string, and word-count operations
- Asynchronous `Pending -> Running -> Success/Failed` execution
- Results, errors, timestamps, and execution logs
- Responsive dashboard with live polling
- Non-root application containers, health checks, and persistent local data

## Folder structure

```text
backend/                 Express API, models, routes, controllers
frontend/                React/Vite application and nginx configuration
worker/                  Python Redis consumer
infrastructure/
  kubernetes/            Kustomize-ready Kubernetes manifests
  argocd/                Argo CD Application and setup guide
.github/workflows/       CI/CD pipeline
docs/                    Architecture, CI setup, submission checklist
docker-compose.yml       Complete local stack
```

## Local development

Prerequisites: Node.js 22+, Python 3.13+, MongoDB, and Redis.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp worker/.env.example worker/.env

cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
cd worker && python -m venv .venv
```

Activate the worker environment and install dependencies:

```bash
# Git Bash on Windows
source worker/.venv/Scripts/activate
pip install -r worker/requirements.txt
python worker/worker.py
```

Run the backend, frontend, and worker in separate terminals. MongoDB must listen
on `27017`, and Redis on `6379`.

## Docker Compose

Create a local environment file and replace the JWT placeholder:

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: <http://localhost:5173>
- Backend health: <http://localhost:5000/api/health>

MongoDB and Redis are internal-only services. Named volumes preserve MongoDB
data and Redis AOF data. Stop and inspect the stack with:

```bash
docker compose down
docker compose up --build
docker compose ps
docker compose logs -f
```

## Environment variables

| Variable | Consumer | Purpose |
|---|---|---|
| `PORT` | Backend | API listen port, default `5000` |
| `MONGO_URI` | Backend/worker | MongoDB connection URI |
| `REDIS_URL` | Backend/worker | Redis connection URL |
| `JWT_SECRET` | Backend | Strong JWT signing secret |
| `CLIENT_URL` | Backend | Allowed browser origin |
| `VITE_API_URL` | Frontend build | API base URL; `/api` in containers |

Never commit `.env` files or real Kubernetes secrets.

## API endpoints

| Method | Route | Authentication |
|---|---|---|
| `GET` | `/api/health` | Public |
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/auth/me` | Bearer JWT |
| `POST` | `/api/tasks` | Bearer JWT |
| `GET` | `/api/tasks` | Bearer JWT |
| `GET` | `/api/tasks/:id` | Bearer JWT and owner |
| `POST` | `/api/tasks/:id/run` | Bearer JWT and owner |

## Task processing workflow

1. An authenticated user creates a task; MongoDB stores it as `Pending`.
2. The user selects **Run Task**; the API resets execution state and pushes its
   identifier to the Redis `ai_tasks` list.
3. A worker consumes the job and sets the task to `Running`.
4. The worker executes `uppercase`, `lowercase`, `reverse`, or `word_count`.
5. Result and logs are saved and status becomes `Success`; exceptions produce
   `Failed` with an error message.

## Kubernetes

Replace image placeholders and the JWT secret template before deployment. Ensure
an nginx Ingress controller, default StorageClass, Metrics Server, and DNS/hosts
entry for `ai-task.local` exist.

```bash
kubectl apply -k infrastructure/kubernetes
kubectl get all -n ai-task-platform
kubectl get ingress,pvc,hpa -n ai-task-platform
```

The HPA scales workers from 2 to 10 replicas using CPU. Production should use
Redis queue depth through KEDA or a custom metrics adapter instead.

## Argo CD and GitHub Actions

- Follow [infrastructure/argocd/README.md](infrastructure/argocd/README.md).
- Configure CI secrets using [docs/github-actions-setup.md](docs/github-actions-setup.md).
- Replace `YOUR_GITHUB_USERNAME` and `YOUR_DOCKERHUB_USERNAME` placeholders.
- Keep application and infrastructure content in separate repositories for the
  final submission; Argo CD watches the infrastructure repository.

## Security notes

- Passwords are hashed with bcrypt cost 12.
- JWTs expire after seven days; task routes verify the token and task owner.
- Helmet, environment-driven CORS, JSON size limits, and API rate limiting are
  enabled. Mongoose schemas validate sizes and operation values.
- Real secrets should come from a secret manager, Sealed Secrets, External
  Secrets, or a manual out-of-band Kubernetes Secret.

## Troubleshooting

- `ECONNREFUSED 127.0.0.1:6379`: start Redis or use Docker Compose.
- Task remains `Pending`: confirm the worker is running and inspect worker logs.
- CORS error: make `CLIENT_URL` exactly match the frontend origin.
- `ai-task.local` does not resolve: map it to the cluster ingress IP in the hosts
  file and verify the nginx Ingress controller.
- HPA shows unknown metrics: install and verify Kubernetes Metrics Server.
- Compose secret warning: copy `.env.example` to `.env` and replace the value.

## Assumptions and known constraints

- Local MongoDB and Redis are single-node assignment dependencies.
- The current Redis list consumer uses `BRPOP`; a worker crash after dequeue can
  lose an in-flight job. Production should use acknowledgements, retries, an
  idempotency key, and a dead-letter queue or Redis Streams/BullMQ/Celery.
- Polling is used instead of WebSockets. Task listing is capped at 100 records.
- TLS, managed databases, backup policies, and external secret management are
  deployment-environment responsibilities.

## Submission checklist

Use [docs/submission-checklist.md](docs/submission-checklist.md) to record the two
repository links, optional live URL, Argo CD screenshot, architecture document,
README, and assumptions before submission.
