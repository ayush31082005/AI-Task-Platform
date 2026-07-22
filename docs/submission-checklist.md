# Submission Checklist

Replace every placeholder and tick each item before submission.

- [ ] Application repository: `https://github.com/YOUR_GITHUB_USERNAME/AI-Task-Platform`
- [ ] Infrastructure repository: `https://github.com/YOUR_GITHUB_USERNAME/ai-task-platform-infra`
- [ ] Live URL (if available): `https://YOUR_DOMAIN`
- [x] Architecture document: `docs/architecture.md`
- [ ] Argo CD dashboard screenshot showing `Synced` and `Healthy`: `docs/argocd-dashboard.png`
- [x] Complete setup README: `README.md`
- [x] GitHub Actions setup: `docs/github-actions-setup.md`
- [ ] GitHub Actions main-branch run passes
- [ ] Immutable SHA-tagged images exist in Docker Hub
- [ ] Kubernetes secret template replaced out of band (not committed)
- [ ] Registration, login, ownership, logs, and all four operations tested

## Additional notes and assumptions

- Kubernetes uses an nginx Ingress controller and a default dynamic StorageClass.
- Metrics Server is required for the optional worker HPA.
- The provided MongoDB and Redis workloads are assignment/local-cluster examples;
  managed highly available services are recommended for production.
- Argo CD installation and the screenshot are manual external-environment steps.
