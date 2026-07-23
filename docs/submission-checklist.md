# AI Task Platform Submission Checklist

Complete every placeholder and verify each unchecked item before submitting the project. Checkboxes represent evidence that should be confirmed manually; they are intentionally left unchecked by default.

## 1. Repository Information

| Item | Submission value |
|---|---|
| Application Repository URL | `https://github.com/ayush31082005/AI-Task-Platform` |
| Infrastructure Repository URL | `https://github.com/ayush31082005/ai-task-platform-infra` |
| Branch Name | `main` |
| Commit Hash | `YOUR_COMMIT_HASH` |
| Docker Hub Username | `ayush31082005` |

## 2. Deliverables

- [ ] React Frontend
- [ ] Express Backend
- [ ] MongoDB
- [ ] Redis Queue
- [ ] Python Worker
- [ ] JWT Authentication
- [ ] Docker
- [ ] Docker Compose
- [ ] Kubernetes
- [ ] Argo CD
- [ ] GitHub Actions
- [ ] README
- [ ] Architecture Document
- [ ] Submission Checklist

## 3. Functional Testing

- [ ] Registration
- [ ] Login
- [ ] Create Task
- [ ] Run Task
- [ ] Uppercase
- [ ] Lowercase
- [ ] Reverse String
- [ ] Word Count
- [ ] Pending Status
- [ ] Running Status
- [ ] Success Status
- [ ] Failed Status
- [ ] Execution Logs

Record the tested commit and date:

- Commit: `YOUR_TESTED_COMMIT_HASH`
- Test date: `YYYY-MM-DD`
- Tester: `YOUR_NAME`

## 4. Docker Verification

Run from the repository root:

```bash
docker compose down
docker compose up --build
docker compose ps
```

Confirm that each service is running and healthy where a health check is configured:

- [ ] Frontend running
- [ ] Backend running
- [ ] Worker running
- [ ] MongoDB running
- [ ] Redis running
- [ ] Frontend reachable at `http://localhost:5173`
- [ ] Backend health endpoint returns success at `http://localhost:5000/api/health`
- [ ] Worker processes a queued task successfully

## 5. Kubernetes Verification

Run from a terminal connected to the intended Kubernetes cluster:

```bash
kubectl apply -k infrastructure/kubernetes
kubectl get all -n ai-task-platform
kubectl get ingress -n ai-task-platform
kubectl get pvc -n ai-task-platform
```

- [ ] Kustomize resources applied without errors
- [ ] Frontend pods Ready
- [ ] Backend pods Ready
- [ ] Worker pods Ready
- [ ] MongoDB pod Ready
- [ ] Redis pod Ready
- [ ] Frontend and backend ClusterIP Services created
- [ ] MongoDB and Redis ClusterIP Services created
- [ ] Ingress created for `ai-task.local`
- [ ] MongoDB PVC Bound
- [ ] Redis PVC Bound
- [ ] Worker HPA available
- [ ] Application reachable through Ingress

## 6. Argo CD Verification

- [ ] Argo CD Application created
- [ ] Application status is Synced
- [ ] Application health is Healthy
- [ ] Automated sync, prune, and self-heal confirmed
- [ ] Application resource tree reviewed
- [ ] Screenshot taken

## 7. GitHub Actions Verification

- [ ] Workflow executed
- [ ] Backend validation passed
- [ ] Frontend validation passed
- [ ] Python worker validation passed
- [ ] Infrastructure validation passed
- [ ] Docker images built
- [ ] Images pushed to Docker Hub
- [ ] Immutable Git SHA tags available
- [ ] Kubernetes manifests updated
- [ ] Manifest update committed with `[skip ci]`
- [ ] Entire CI/CD workflow passing

## 8. Screenshots Required

Add each screenshot to the final submission package and replace the placeholder description with its final filename or document page.

| Screenshot | Placeholder | Required evidence |
|---|---|---|
| Login | `ADD_LOGIN_SCREENSHOT` | Login page and application branding |
| Dashboard | `ADD_DASHBOARD_SCREENSHOT` | Authenticated user and task statistics |
| Task Processing | `ADD_TASK_PROCESSING_SCREENSHOT` | Operation, status, result, and execution logs |
| Docker Containers | `ADD_DOCKER_SCREENSHOT` | All five Compose services running |
| Kubernetes Pods | `ADD_KUBERNETES_SCREENSHOT` | Ready pods in `ai-task-platform` |
| Argo CD Dashboard | `ADD_ARGOCD_SCREENSHOT` | Synced, Healthy, and resource tree |
| GitHub Actions Pipeline | `ADD_GITHUB_ACTIONS_SCREENSHOT` | Successful jobs for the final commit |

- [ ] Login screenshot added
- [ ] Dashboard screenshot added
- [ ] Task Processing screenshot added
- [ ] Docker Containers screenshot added
- [ ] Kubernetes Pods screenshot added
- [ ] Argo CD Dashboard screenshot added
- [ ] GitHub Actions Pipeline screenshot added

## 9. Assumptions

- Node.js 22+, Python 3.13+, Docker Desktop, Git, and `kubectl` are available where their corresponding workflows are run.
- Local source-mode execution has MongoDB on `127.0.0.1:27017` and Redis on `127.0.0.1:6379`; Docker Compose uses internal service names instead.
- Kubernetes has an nginx Ingress Controller, Metrics Server, and a default dynamic StorageClass.
- The Windows hosts file maps the cluster Ingress address to `ai-task.local` for local access.
- Docker Hub image repositories exist and GitHub Secrets contain a valid username and read/write access token.
- The Kubernetes `JWT_SECRET` placeholder is replaced securely outside source control before a real deployment.
- Argo CD can authenticate to the chosen Git repository and is watching the repository that contains `infrastructure/kubernetes`.
- The included single-replica MongoDB and Redis deployments are intended for assignment or development use rather than production high availability.

## 10. Known Limitations

- Redis uses a raw `LPUSH`/`BRPOP` list without acknowledgements, automatic retries, visibility timeouts, or a dead-letter queue.
- A worker failure after dequeue can leave a task stranded, and MongoDB persistence plus Redis publication are not transactional.
- Concurrent Run requests can enqueue duplicate executions because no idempotency key is implemented.
- The dashboard polls every two seconds and returns only the newest 100 tasks; cursor pagination and push updates are not implemented.
- JWTs are stored in browser `localStorage`, expire after seven days, and have no refresh or server-side revocation flow.
- MongoDB and Redis use one Kubernetes replica each.
- TLS, NetworkPolicies, automated backups, centralized monitoring, distributed tracing, and centralized logging are not currently installed.
- Worker HPA uses CPU utilization, which is an indirect signal for queue backlog.
- The committed Argo CD repository URL and Kubernetes JWT secret contain placeholders that require manual replacement.

## 11. Future Improvements

- Queue-length and oldest-job-age autoscaling using KEDA or Kubernetes custom metrics
- Prometheus metrics for APIs, workers, queue depth, Redis, MongoDB, and storage
- Grafana dashboards and production alerting
- Centralized structured logging with Loki or another logging backend
- Distributed tracing with OpenTelemetry
- Email, browser, or webhook notifications when tasks complete
- Reliable acknowledged queue processing, retries, idempotency, and dead-letter handling
- Managed high-availability MongoDB and Redis with tested backup recovery
- TLS, external secrets, NetworkPolicies, and progressive delivery

## 12. Final Submission Checklist

- [ ] README completed
- [ ] Architecture document completed
- [ ] GitHub repositories public
- [ ] Repository placeholders replaced
- [ ] Author name updated
- [ ] Docker images available
- [ ] Docker image tags match the final commit
- [ ] Argo CD configured
- [ ] CI/CD passing for the final commit
- [ ] Required screenshots attached
- [ ] Documentation reviewed
- [ ] Final testing completed
- [ ] Final commit hash recorded
- [ ] Ready for submission
