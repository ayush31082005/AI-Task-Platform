# Kubernetes deployment

These manifests deploy the complete AI Task Platform into the
`ai-task-platform` namespace using Kustomize.

## Prerequisites

- A Kubernetes cluster with a default `StorageClass`
- `kubectl`
- nginx Ingress Controller
- Metrics Server for the worker HPA
- Three images in Docker Hub:
  - `YOUR_DOCKERHUB_USERNAME/ai-task-frontend:latest`
  - `YOUR_DOCKERHUB_USERNAME/ai-task-backend:latest`
  - `YOUR_DOCKERHUB_USERNAME/ai-task-worker:latest`

## Build and push the images

From the application repository root, replace `YOUR_DOCKERHUB_USERNAME`:

```bash
docker login
docker build -t YOUR_DOCKERHUB_USERNAME/ai-task-frontend:latest frontend
docker build -t YOUR_DOCKERHUB_USERNAME/ai-task-backend:latest backend
docker build -t YOUR_DOCKERHUB_USERNAME/ai-task-worker:latest worker
docker push YOUR_DOCKERHUB_USERNAME/ai-task-frontend:latest
docker push YOUR_DOCKERHUB_USERNAME/ai-task-backend:latest
docker push YOUR_DOCKERHUB_USERNAME/ai-task-worker:latest
```

Replace every `YOUR_DOCKERHUB_USERNAME` occurrence before applying:

```powershell
Get-ChildItem infrastructure\kubernetes\*-deployment.yaml |
  ForEach-Object { (Get-Content $_.FullName) -replace 'YOUR_DOCKERHUB_USERNAME', 'YOUR_USERNAME' | Set-Content $_.FullName }
```

Create the real JWT Secret out of band instead of committing it. The checked-in
`secret.yaml` contains only an obvious placeholder.

## Enable nginx Ingress

Docker Desktop: enable Kubernetes in Docker Desktop settings, then install the
community nginx Ingress Controller:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.1/deploy/static/provider/cloud/deploy.yaml
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=300s
```

For Minikube, use `minikube addons enable ingress`. Follow the provider-specific
installation guide for other clusters.

## Validate and apply

```bash
kubectl kustomize infrastructure/kubernetes
kubectl apply -k infrastructure/kubernetes
kubectl get all -n ai-task-platform
kubectl get ingress -n ai-task-platform
kubectl get pvc -n ai-task-platform
```

Wait for application rollouts:

```bash
kubectl rollout status deployment/frontend -n ai-task-platform
kubectl rollout status deployment/backend -n ai-task-platform
kubectl rollout status deployment/worker -n ai-task-platform
```

## Configure `ai-task.local` on Windows

Get the ingress address:

```bash
kubectl get ingress ai-task-ingress -n ai-task-platform
```

Open Notepad as Administrator and edit:

```text
C:\Windows\System32\drivers\etc\hosts
```

Add the ingress IP, for example:

```text
127.0.0.1 ai-task.local
```

The correct IP depends on the cluster. Open `http://ai-task.local` after DNS and
the ingress controller are ready.

## Logs and troubleshooting

```bash
kubectl logs -n ai-task-platform deployment/frontend --tail=100
kubectl logs -n ai-task-platform deployment/backend --tail=100
kubectl logs -n ai-task-platform deployment/worker --tail=100
kubectl logs -n ai-task-platform deployment/mongo --tail=100
kubectl logs -n ai-task-platform deployment/redis --tail=100
kubectl describe pod -n ai-task-platform POD_NAME
kubectl get events -n ai-task-platform --sort-by=.lastTimestamp
```

`ImagePullBackOff` normally means the placeholder was not replaced, the image was
not pushed, or registry credentials are missing. Pending PVCs indicate that the
cluster has no suitable default `StorageClass`.

## Scale the worker

The worker Deployment is independent and can be manually scaled:

```bash
kubectl scale deployment/worker -n ai-task-platform --replicas=4
```

The included CPU HPA uses 2–10 replicas at 70% average CPU and requires Metrics
Server. Queue-length-based scaling with KEDA or custom Redis metrics is preferred
in production because queue depth and oldest-job age reflect demand better than
CPU usage.

## Remove the deployment

```bash
kubectl delete -k infrastructure/kubernetes
```

Deleting the namespace or PVCs can remove persisted assignment data. Confirm the
desired retention policy before deleting storage.

## Known limitations

- MongoDB and Redis use one replica each and are not highly available.
- PVC provisioning depends on the cluster's default `StorageClass`.
- The Secret manifest is a template, not a production secret-management system.
- Images use `latest` only because the assignment requires it; immutable tags or
  digests are preferred for production.
- TLS, NetworkPolicies, backups, and managed data services are not included.
- CPU-based HPA is a fallback; Redis queue-length-based scaling is recommended.
