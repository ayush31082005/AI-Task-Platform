# GitHub Actions CI/CD setup

## Workflow overview

`.github/workflows/ci-cd.yml` validates the backend, frontend, Python worker,
Docker Compose, Kubernetes Kustomize configuration, and Argo CD YAML. After all
validation jobs pass, it builds the three Docker images. A push to `main` also
publishes the images and commits immutable image tags to the Kubernetes
Kustomization.

No test command is run because this repository currently has no real test script
or test suite. The workflow does not invent placeholder tests.

## Triggers

- `pull_request` targeting `main`
- `push` to `main`
- Manual `workflow_dispatch`

Concurrency cancels an older run for the same workflow and Git ref.

## Pull request behavior

Pull requests run backend/frontend lint, frontend production build, worker syntax
compilation, infrastructure validation, and all Docker image builds. Images use a
local validation name, are not pushed, and Docker Hub credentials are not read.
Kubernetes files are not modified. This behavior is safe for pull requests from
forks, which cannot access repository secrets.

## Main branch behavior

After validation succeeds, a main-branch push:

1. Logs in to Docker Hub using repository secrets.
2. Builds and pushes frontend, backend, and worker images.
3. Publishes both the immutable Git SHA tag and `latest`.
4. Uses Kustomize to update the three image mappings.
5. Validates the rendered Kustomization.
6. Commits only `infrastructure/kubernetes/kustomization.yaml` when changed.
7. Pushes `chore: update deployment images [skip ci]` to `main`.

The `[skip ci]` marker prevents the bot commit from recursively starting this
workflow. A manual dispatch validates and builds images but does not push or
modify manifests because publishing is restricted to a real push to `main`.

## Required GitHub Secrets

Add these under **Repository Settings > Secrets and variables > Actions**:

- `DOCKERHUB_USERNAME`: Docker Hub username or organization.
- `DOCKERHUB_TOKEN`: Docker Hub access token with permission to push the three
  repositories.

Do not use the Docker Hub account password.

## Create a Docker Hub access token

1. Sign in to Docker Hub.
2. Open **Account settings > Personal access tokens**.
3. Create a token with the minimum required read/write permission.
4. Copy it once and save it as the `DOCKERHUB_TOKEN` GitHub secret.
5. Save the matching account/organization name as `DOCKERHUB_USERNAME`.

Never put either value in YAML, frontend build variables, logs, or source code.

## Image names and tags

```text
DOCKERHUB_USERNAME/ai-task-frontend:GIT_SHA
DOCKERHUB_USERNAME/ai-task-backend:GIT_SHA
DOCKERHUB_USERNAME/ai-task-worker:GIT_SHA
```

Each image also receives `latest`. Kubernetes deployment is driven by the Git SHA
mapping because immutable tags make deployments traceable and reproducible.

## Kubernetes manifest update flow

The Kubernetes Deployments retain these logical source image names:

```text
YOUR_DOCKERHUB_USERNAME/ai-task-frontend
YOUR_DOCKERHUB_USERNAME/ai-task-backend
YOUR_DOCKERHUB_USERNAME/ai-task-worker
```

`kustomize edit set image` writes an `images` section into
`infrastructure/kubernetes/kustomization.yaml`, setting the Docker Hub namespace
and current `${{ github.sha }}` tag without fragile search-and-replace commands.

## Argo CD GitOps flow

After the manifest commit reaches Git, an Argo CD Application watching this
repository/path can detect the new revision, render Kustomize, and sync the new
images. This workflow does not contact a Kubernetes cluster or run `kubectl
apply`; deployment remains Argo CD's responsibility.

The current Argo CD template uses a separate `ai-task-platform-infra` repository
URL, while this assignment workflow is explicitly configured to commit to the
same application repository. Before deployment, choose one consistent model:
point Argo CD at this repository, or adapt the manifest-update job to check out
and write the separate infrastructure repository with a narrowly scoped token.

## Permissions and branch protection

Workflow-level permission is `contents: read`. Only the manifest-update job gets
`contents: write`. Docker secrets are consumed only by the main-push publishing
step and are never exposed to pull requests.

If `main` branch protection rejects direct bot pushes, keep the protection in
place. Use one of these reviewed alternatives:

- Allow GitHub Actions to bypass only this specific rule after security review.
- Change the update job to create a pull request using a narrowly scoped token.
- Store deployment manifests in a separate infrastructure repository and give a
  fine-grained token write access only to that repository.

Do not weaken branch protection automatically.

## Troubleshooting

### `npm ci` fails

Confirm both `backend/package-lock.json` and `frontend/package-lock.json` are
committed and synchronized with their package files.

### Docker login or push fails

Verify both secrets, token permissions, Docker Hub repository/organization
access, and rate limits. Tokens are unavailable to fork pull requests by design;
those builds use `push: false` and do not log in.

### Kustomize update fails

Confirm the three placeholder image names in Deployment manifests still match
the `kustomize edit set image` commands and run locally:

```bash
kustomize build infrastructure/kubernetes
```

### Manifest push is rejected

Review branch protection and GitHub Actions repository settings. The workflow
must be permitted to write repository contents for only the update job.

### Docker build cache problems

Re-run the job first. If necessary, delete the affected GitHub Actions cache from
the repository's **Actions > Caches** page.

## Rerun the workflow

Open **Actions > CI/CD**, select a failed run, and choose **Re-run failed jobs**.
To start a new manual validation, choose **Run workflow** on the `main` branch.

## Security notes

- Actions use stable major versions.
- Every job has a timeout.
- Pull requests never push images or update Git.
- Frontend receives only the non-secret `/api` build URL.
- Tokens are not printed or passed into Docker build arguments.
- Publishing uses immutable Git SHA tags.
- The manifest job stages only `kustomization.yaml`.

## Optional status badge

After the repository is published, add this badge where appropriate by replacing
the placeholder owner:

```markdown
[![CI/CD](https://github.com/YOUR_GITHUB_USERNAME/AI-Task-Platform/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/AI-Task-Platform/actions/workflows/ci-cd.yml)
```
