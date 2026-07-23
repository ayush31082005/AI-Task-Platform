# Argo CD GitOps setup

## What Argo CD is

Argo CD is a declarative continuous-delivery controller for Kubernetes. It
compares resources running in a cluster with manifests stored in Git and reports
whether the application is synchronized and healthy. With automated sync,
pruning, and self-healing enabled, Git becomes the desired-state source of truth.

This folder is a configuration template. Its presence does not mean Argo CD or
the application is already deployed.

## GitOps workflow

```text
Developer updates infrastructure repository
                    |
                    v
        Argo CD detects Git revision
                    |
                    v
    Kustomize renders Kubernetes manifests
                    |
                    v
 Argo CD applies changes to ai-task-platform
                    |
                    v
      Application becomes Synced/Healthy
```

The `Application` watches the `main` branch and
`infrastructure/kubernetes` path. Automated sync applies Git changes,
`selfHeal` reverses supported manual drift, and `prune` removes resources that
were removed from Git.

The Application ignores the live `data` field of `ai-task-secret` and enables
`RespectIgnoreDifferences=true`. This prevents Argo CD from replacing the
out-of-band JWT value with the safe placeholder committed for the assignment.

## Prerequisites

- A reachable Kubernetes cluster and configured `kubectl` context
- Kubernetes manifests pushed to the separate infrastructure repository
- `repoURL` in `application.yaml` points to the public infrastructure repository
- Argo CD repository access configured if the repository is private
- Optional: Argo CD CLI (`argocd`) installed locally

## Install Argo CD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --for=condition=Available deployment/argocd-server -n argocd --timeout=300s
kubectl get pods -n argocd
```

If the namespace already exists, `kubectl create namespace` may report
`AlreadyExists`; continue with the installation command.

## Access the UI

For local access, keep this command running in a separate terminal:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Open `https://localhost:8080`. A browser warning is expected for the local
self-signed certificate.

## Get the initial admin password

With the Argo CD CLI:

```bash
argocd admin initial-password -n argocd
```

Without the CLI:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 --decode
```

On PowerShell:

```powershell
$encoded = kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}"
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($encoded))
```

The initial username is `admin`. Change the password after the first login.

## Log in

Use the UI at `https://localhost:8080`, or use the CLI while port-forwarding:

```bash
argocd login localhost:8080 --username admin --password INITIAL_PASSWORD --insecure
argocd account update-password
```

Never store the admin password or repository credentials in this repository.

## Apply the Application

The public infrastructure repository URL is already configured in
`application.yaml`. Do not put credentials in the URL.

```bash
kubectl apply -n argocd -f infrastructure/argocd/application.yaml
kubectl get applications -n argocd
```

For a private repository, register it through Argo CD using a credential scoped
only to that repository.

## Sync the application

Automated sync is enabled, so Argo CD should reconcile after discovering the
repository. A manual sync can be initiated from the UI with **Sync**, or by CLI:

```bash
argocd app sync ai-task-platform
argocd app wait ai-task-platform --sync --health --timeout 300
```

## View health and application tree

```bash
argocd app get ai-task-platform
kubectl get application ai-task-platform -n argocd -o wide
kubectl get all -n ai-task-platform
```

In the UI, select **ai-task-platform**. The application details page shows the
resource tree, sync state, health state, Git revision, and individual Kubernetes
resources. Expand unhealthy nodes and open **Events** or **Logs** to diagnose
them.

## Assignment screenshot

After a verified deployment, capture the Argo CD application details page with:

- Application name `ai-task-platform`
- `Synced` status
- `Healthy` status
- Git revision/source visible
- Full application resource tree visible

Do not include passwords, repository tokens, Secret values, or other credentials
in the screenshot. A screenshot of an unverified/local YAML file is not evidence
of a successful deployment.

## Troubleshooting

### Repository not found or authentication failed

Confirm the placeholder was replaced, the repository exists, the manifests are
on `main`, and Argo CD has read access. For private repositories, configure a
repository credential in Argo CD rather than embedding it in `repoURL`.

### Application is OutOfSync

Refresh and sync it:

```bash
argocd app get ai-task-platform --refresh
argocd app sync ai-task-platform
```

Then inspect the failed resource and Argo CD controller logs:

```bash
kubectl logs -n argocd deployment/argocd-application-controller --tail=100
```

### Application is Degraded

```bash
kubectl get pods -n ai-task-platform
kubectl get events -n ai-task-platform --sort-by=.lastTimestamp
kubectl describe pod -n ai-task-platform POD_NAME
```

Typical causes include unpushed Docker images, an unreplaced Docker Hub
placeholder, unavailable PVC storage, missing ingress controller, or invalid
Secret configuration.

### Application CRD is missing

If Kubernetes reports that kind `Application` is unknown, Argo CD is not fully
installed. Reapply the Argo CD installation and wait for its pods to become
ready before applying `application.yaml`.

### UI is unavailable

Confirm `argocd-server` is ready and the port-forward terminal is still running:

```bash
kubectl get pods,svc -n argocd
```

## Delete the application

Delete only the Argo CD Application object:

```bash
kubectl delete -n argocd -f infrastructure/argocd/application.yaml
```

Because Argo CD uses a resources finalizer in some installation/configuration
patterns, deletion may also remove managed resources. Inspect the Application
before deletion and back up important data. To remove the workload explicitly:

```bash
kubectl delete -k infrastructure/kubernetes
```

PersistentVolume retention depends on the cluster StorageClass. Do not delete
PVCs or the namespace until data-retention requirements are confirmed.
