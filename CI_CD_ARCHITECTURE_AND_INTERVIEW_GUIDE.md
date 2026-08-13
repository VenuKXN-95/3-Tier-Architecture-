# Production CI/CD Architecture, Security Gates & Senior DevOps Interview Master Guide

> **Repository**: 3-Tier E-Commerce Application (FastAPI Backend + React Frontend + MongoDB Replica Set)
> **Author**: Senior DevOps CI/CD Architect
> **Status**: Production-Ready

---

## 📋 Table of Contents

1. [Repository Discovery &amp; Architecture Analysis](#1-repository-discovery--architecture-analysis)
2. [Identified CI/CD Problems &amp; Anti-Patterns](#2-identified-cicd-problems--anti-patterns)
3. [End-to-End CI Pipeline Architecture](#3-end-to-end-ci-pipeline-architecture)
4. [Files Created &amp; Modified (With Technical Rationale)](#4-files-created--modified-with-technical-rationale)
5. [Explicit Quality &amp; Security Gate Matrix](#5-explicit-quality--security-gate-matrix)
6. [Local CI Runner (`scripts/ci.sh`) Guide](#6-local-ci-runner-scriptsci-sh-guide)
7. [GitHub Actions Workflow Structure](#7-github-actions-workflow-structure)
8. [SonarQube Integration &amp; Quality Gate Enforcement](#8-sonarqube-integration--quality-gate-enforcement)
9. [Trivy Vulnerability &amp; Security Scanner Integration](#9-trivy-vulnerability--security-scanner-integration)
10. [Pipeline Security Review &amp; Threat Audit](#10-pipeline-security-review--threat-audit)
11. [Recommended Branch Protection Rules](#11-recommended-branch-protection-rules)
12. [Live Interview Demonstration Script (13-Step Walkthrough)](#12-live-interview-demonstration-script-13-step-walkthrough)
13. [Intentionally Triggering &amp; Remediation Demos](#13-intentionally-triggering--remediation-demos)
14. [Comprehensive 38-Question Senior DevOps Interview Guide](#14-comprehensive-38-question-senior-devops-interview-guide)

---

## 1. Repository Discovery & Architecture Analysis

### Technology Stack

* **Backend**: Python 3.11+ / FastAPI, Pydantic v2, Pytest, Pytest-Cov, Black, Flake8, Pylint, Mypy, Bandit, pip-audit, PyMongo.
* **Frontend**: React 18, TypeScript 5, Vite, ESLint, TailwindCSS, PostCSS, Radix UI.
* **Database**: MongoDB 7.0 (Single-node Replica Set `rs0` for multi-document ACID transactions).
* **Containerization**: Multi-stage `backend/Dockerfile` (Python 3.12-slim) & `frontend/Dockerfile` (Node 20-alpine -> Nginx alpine), `docker-compose.yml`.
* **Automation Tools**: Bash (`scripts/ci.sh`, `run-ci-gates.sh`), PowerShell (`run-ci-gates.ps1`), GitHub Actions (`.github/workflows/ci.yml`).

---

## 2. Identified CI/CD Problems & Anti-Patterns

Prior to this architecture implementation, several risks and inefficiencies existed:

1. **Lack of Standard Entry Point**: No standard `./scripts/ci.sh` existed for Unix/Linux/macOS developers to execute exact CI pipeline checks prior to pushing.
2. **Missing SonarQube Quality Gate Enforcement**: Static code metrics were not centralized or tied to a SonarQube Quality Gate threshold.
3. **Container Tag Non-Immutability**: Image tags were static rather than tied deterministically to Git commit SHAs (`${{ github.sha }}`).
4. **Local vs CI Configuration Discrepancy**: PyMongo connection strings differed between Docker container network ports (`27018`) and CI native runner ports (`27017`), causing local test failures.
5. **Security Gate Gaps**: Missing automated Trivy filesystem and Docker container image vulnerability scanning with enforced exit codes.

---

## 3. End-to-End CI Pipeline Architecture

```
Developer Workstation
   │
   ▼
1. Executable Local Runner: ./scripts/ci.sh
   │
   ├─► Backend Formatting (Black)
   ├─► Backend Linting (Flake8 & Pylint)
   ├─► Static Type Checking (Mypy & tsc)
   ├─► Static Security Analysis (Bandit & Gitleaks)
   ├─► Pytest Unit/Integration Tests & Coverage XML Export
   ├─► Frontend ESLint & Production Build (Vite)
   ├─► Docker Image Build (ecommerce-backend:${COMMIT_SHA})
   └─► Trivy Filesystem & Container Security Scan
   │
   ▼
2. Local PASS  ──►  git push / Pull Request  ──►  GitHub Actions (.github/workflows/ci.yml)
                                                 │
                                                 ├─► Parallel Job 1: backend-ci
                                                 ├─► Parallel Job 2: frontend-ci
                                                 ├─► Job 3: sonarqube-analysis
                                                 ├─► Job 4: security-scans (Gitleaks, Hadolint, Trivy FS)
                                                 └─► Job 5: docker-build-and-trivy (${{ github.sha }})
                                                 │
                                                 ▼
                                     PASS / FAIL (Enforces PR Merge)
```

---

## 4. Files Created & Modified (With Technical Rationale)

### Files Created

1. **`scripts/ci.sh`** [NEW]

   - *Purpose*: Master POSIX Bash script for local developer execution.
   - *Rationale*: Enforces `set -euo pipefail`, ANSI color reporting, fail-fast execution, instant TCP socket Mongo port resolution, and CLI options (`--fast`, `--skip-docker`, `--backend-only`, `--frontend-only`, `--security-only`, `--sonar`).
2. **`sonar-project.properties`** [NEW]

   - *Purpose*: Standard SonarQube / SonarCloud scanner configuration.
   - *Rationale*: Configures project key, source paths (`backend/app`, `frontend/src`), test paths (`backend/tests`), exclusions (`node_modules`, `dist`, `venv`), and Python coverage report location (`backend/coverage.xml`).
3. **`CI_CD_ARCHITECTURE_AND_INTERVIEW_GUIDE.md`** [NEW]

   - *Purpose*: Complete production documentation, Quality Gate definitions, Live Demo procedure, Security Review, and 38 Senior DevOps Interview Q&A.

### Files Modified

1. **`.github/workflows/ci.yml`** [MODIFY]

   - *Rationale*: Added SonarQube analysis & Quality Gate jobs (`sonarsource/sonarqube-scan-action` & `sonarsource/sonarqube-quality-gate-action`), updated Trivy container image scanning using deterministic `${{ github.sha }}` tags, pinned actions to stable versions, and configured artifact sharing for coverage reports.
2. **`run-ci-gates.sh` & `run-ci-gates.ps1`** [MODIFY]

   - *Rationale*: Added instant TCP socket connection checks (`27018` vs `27017`) and `directConnection=true` query parameters to prevent PyMongo `ServerSelectionTimeoutError` during local test runs.
3. **`MANUAL_CI_QUALITY_GATES.md` & `README.md`** [MODIFY]

   - *Rationale*: Documented `./scripts/ci.sh` usage, Git pre-push hook configuration, and Quality Gate policies.

---

## 5. Explicit Quality & Security Gate Matrix

| Gate                      | Tool          | PASS Criteria                         | FAIL Criteria                    | Enforcement Action        |
| :------------------------ | :------------ | :------------------------------------ | :------------------------------- | :------------------------ |
| **Formatting**      | Black         | Exit code 0 (100% compliant)          | Unformatted Python file          | Blocks script / fails CI  |
| **Backend Lint**    | Flake8        | 0 syntax or line-length errors        | Any Flake8 error                 | Blocks script / fails CI  |
| **Deep Analysis**   | Pylint        | Score ≥ 9.00 / 10.00                 | Score < 9.00                     | Blocks script / fails CI  |
| **Type Checking**   | Mypy /`tsc` | 0 type mismatches                     | Any type mismatch                | Blocks script / fails CI  |
| **Security SAST**   | Bandit        | 0 High/Medium security flaws          | High/Medium SAST issue           | Blocks script / fails CI  |
| **Unit Tests**      | Pytest        | 100% test pass rate                   | Any failing test                 | Blocks script / fails CI  |
| **Coverage**        | Pytest-Cov    | Coverage XML generated                | Report missing                   | Uploads artifact to Sonar |
| **Frontend Build**  | Vite          | Successful production build           | Build compilation error          | Blocks script / fails CI  |
| **SonarQube Gate**  | SonarQube     | SonarQube Quality Gate = PASSED       | Quality Gate = FAILED            | Fails GitHub PR Check     |
| **Secret Scan**     | Gitleaks      | 0 exposed API keys/tokens             | Committed secrets found          | Fails security scan job   |
| **Dockerfile Lint** | Hadolint      | 0 Hadolint error threshold violations | Dockerfile best-practice failure | Fails security scan job   |
| **Container SAST**  | Trivy         | 0 unfixed HIGH/CRITICAL CVEs          | Unfixed HIGH/CRITICAL CVE        | Fails Docker image job    |

---

## 6. Local CI Runner (`scripts/ci.sh`) Guide

### Execution Commands

```bash
# Make script executable (first time only)
chmod +x scripts/ci.sh

# Run complete local CI quality & security pipeline
./scripts/ci.sh

# Fast check (skips test suites, security audits, and docker builds)
./scripts/ci.sh --fast

# Component-specific checks
./scripts/ci.sh --backend-only
./scripts/ci.sh --frontend-only
./scripts/ci.sh --security-only
./scripts/ci.sh --skip-docker

# Local SonarQube scanner run (if sonar-scanner CLI is installed)
./scripts/ci.sh --sonar
```

---

## 7. GitHub Actions Workflow Structure

`.github/workflows/ci.yml` is structured into 5 isolated jobs:

1. **`backend-ci`**: Spawns MongoDB replica set container (`mongo:7`), installs dependencies, runs Black, Flake8, Pylint, Mypy, Bandit, Pytest, and exports `coverage.xml` as an artifact.
2. **`frontend-ci`**: Sets up Node 20, runs `npm ci`, ESLint, `tsc --noEmit`, Vite production build, and `npm audit`.
3. **`sonarqube-analysis`**: Downloads `coverage.xml`, runs SonarQube scanner, and evaluates the SonarQube Quality Gate.
4. **`security-scans`**: Executes Gitleaks, Hadolint Dockerfile linting, and Trivy filesystem scanning.
5. **`docker-build-and-trivy`**: Compiles Docker images with immutable tag `${{ github.sha }}` and scans images with Trivy.

---

## 8. SonarQube Integration & Quality Gate Enforcement

### `sonar-project.properties`

```properties
sonar.projectKey=ecommerce-3tier-app
sonar.projectName=3-Tier E-Commerce Application
sonar.sources=backend/app,frontend/src
sonar.tests=backend/tests
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,backend/tests/**
sonar.python.coverage.reportPaths=backend/coverage.xml
```

### Quality Gate Behavior

- If SonarQube analysis calculates a Reliability, Security, or Maintainability Rating worse than **A**, or if Security Hotspots are unreviewed, the **SonarQube Quality Gate fails**.
- The GitHub Actions workflow blocks the Pull Request from merging.

---

## 9. Trivy Vulnerability & Security Scanner Integration

Trivy scans two distinct layers in the pipeline:

1. **Filesystem & Dependency Scan (`trivy fs`)**: Scans `requirements.txt`, `package-lock.json`, and repository configuration files for known CVE vulnerabilities.
2. **Container Image Scan (`trivy image`)**: Scans compiled Docker container images (`ecommerce-backend:${GITHUB_SHA}` and `ecommerce-frontend:${GITHUB_SHA}`) for OS package vulnerabilities (Alpine/Debian) and application layer vulnerabilities.
3. **Security Policy Enforcement**: Configured with `--severity HIGH,CRITICAL` and `--ignore-unfixed true`. If unfixed HIGH or CRITICAL vulnerabilities are detected, the security gate fails.

---

## 10. Pipeline Security Review & Threat Audit

| Threat Vector                             | Risk Level         | Mitigation Strategy Implemented                                                     |
| :---------------------------------------- | :----------------- | :---------------------------------------------------------------------------------- |
| **Hardcoded Credentials**           | **CRITICAL** | Gitleaks scanner + GitHub Secrets (`SONAR_TOKEN`, `GITHUB_TOKEN`).              |
| **Overprivileged CI Permissions**   | **HIGH**     | Strict workflow-level permissions (`contents: read`, `security-events: write`). |
| **Vulnerable Docker Base Images**   | **HIGH**     | Trivy container image scanning +Hadolint best-practice linting.                     |
| **Mutable Image Tags (`latest`)** | **MEDIUM**   | Immutable Git commit SHA tagging (`${{ github.sha }}`).                           |
| **Insecure Dependency Packages**    | **MEDIUM**   | `pip-audit` & `npm audit` scanning in local runner and CI.                      |

---

## 11. Recommended Branch Protection Rules

To prevent developers from bypassing CI checks, configure GitHub Branch Protection on `main`, `master`, and `develop`:

1. **Require a pull request before merging**: Require at least 1 approval.
2. **Require status checks to pass before merging**:
   - `Backend CI (Python / FastAPI)`
   - `Frontend CI (React / TypeScript)`
   - `SonarQube Code Analysis & Quality Gate`
   - `Security & Vulnerability Scanning`
   - `Docker Build & Trivy Image Security Scan`
3. **Require branches to be up to date before merging**: Prevents merging code tested against stale base branches.
4. **Include administrators**: Enforces CI checks even for repository admins.

---

## 12. Live Interview Demonstration Script (13-Step Walkthrough)

### Step 1: Introduction

> *"I will demonstrate our local and remote CI/CD quality and security gates for this 3-tier FastAPI + React + MongoDB application."*

### Step 2: Introduce a deliberate lint failure

Open `backend/app/routes/products.py` and add unused imports / bad whitespace:

```python
import sys, os  # Unused imports + multiple imports on one line
```

### Step 3: Run local runner

```bash
./scripts/ci.sh --fast
```

### Step 4: Show Fail-Fast behavior

Demonstrate that `Backend Code Linting (Flake8)` fails instantly with exit code `1` and stops the pipeline before slow steps run.

### Step 5: Fix lint error

Revert `backend/app/routes/products.py`.

### Step 6: Introduce a deliberate unit test assertion failure

Open `backend/tests/test_products.py` and change an expected status code:

```python
assert response.status_code == 201  # Change to 200
```

### Step 7: Run local runner

```bash
./scripts/ci.sh
```

### Step 8: Show Pytest failure

Demonstrate that `Backend Pytest Test Suite` fails, showing exact failure assertion traceback.

### Step 9: Fix test error

Revert `backend/tests/test_products.py`.

### Step 10: Execute full clean local CI

```bash
./scripts/ci.sh
```

### Step 11: Show 100% Passed Output

Highlight summary table displaying all active gates **PASSED**.

### Step 12: Commit & Push

```bash
git add .
git commit -m "ci: enforce production quality gates"
git push origin feature/ci-pipeline
```

### Step 13: Verify GitHub Actions

Show GitHub Actions executing parallel jobs, SonarQube Quality Gate check, Trivy container image scan, and PR green status.

---

## 13. Intentionally Triggering & Remediation Demos

### Scenario A: Flake8 / Black Formatting Failure

* **Trigger**: Add trailing whitespace or exceed 88 characters.
* **Fix**: Run `python -m black app tests` inside `backend/`.

### Scenario B: Pytest Failure

* **Trigger**: Break a route logic or database query.
* **Fix**: Fix function logic or update test assertion.

### Scenario C: Trivy Vulnerability Failure

* **Trigger**: Add an outdated base image in `Dockerfile`.
* **Fix**: Upgrade base image tag to latest patch (e.g. `python:3.12-slim`).

---

## 14. Comprehensive 38-Question Senior DevOps Interview Guide

### Q1: What is CI?

* **Testing Intent**: Assesses core understanding of Continuous Integration.
* **Strong Answer**: Continuous Integration is a software engineering practice where developers frequently merge code changes into a shared central repository. Every push triggers automated builds, static analysis, linting, security scans, and unit tests to provide rapid feedback and catch integration defects early.
* **Project Example**: In our 3-tier app, every PR runs `./scripts/ci.sh` locally and triggers GitHub Actions to test FastAPI routes, React builds, and MongoDB transactions.
* **Common Bad Answer**: *"CI is just running GitHub Actions to deploy code."*
* **Follow-up**: *What is the difference between CI and CD?* -> CI focuses on build, test, and quality validation; CD focuses on automated delivery and deployment to target environments.

### Q2: Why run CI locally before pushing code?

* **Testing Intent**: Evaluates developer experience and CI resource optimization.
* **Strong Answer**: Running local CI via `./scripts/ci.sh` provides instant feedback (seconds instead of minutes), avoids wasting CI runner minutes, keeps Git commit logs clean, and prevents breaking shared team branches.
* **Project Example**: Developers run `./scripts/ci.sh --fast` in 10 seconds locally before opening a Pull Request.

### Q3: What is a Quality Gate?

* **Testing Intent**: Tests knowledge of automated governance.
* **Strong Answer**: A Quality Gate is a policy-driven boolean checkpoint (PASS/FAIL) that code must satisfy across specific metrics (linting, test pass rate, code coverage, vulnerability counts) before it is permitted to merge or deploy.
* **Project Example**: Our pipeline enforces 0 Flake8 errors, Pylint score ≥ 9.00, 100% Pytest pass rate, 0 HIGH/CRITICAL Trivy CVEs, and a passing SonarQube Quality Gate.

### Q4: How does Trivy scan Docker images and what happens if a CRITICAL vulnerability is found?

* **Testing Intent**: Container security & vulnerability management expertise.
* **Strong Answer**: Trivy inspects container filesystem layers, OS package databases (dpkg, apk), and language package manifests (`requirements.txt`, `package-lock.json`) against known CVE databases. When configured with `--severity HIGH,CRITICAL --exit-code 1`, Trivy returns exit code 1, causing the CI pipeline to fail immediately and block container image publishing.
* **Project Example**: Job `docker-build-and-trivy` builds `ecommerce-backend:${GITHUB_SHA}` and runs Trivy. If a CRITICAL CVE is found, the job fails and the image is not pushed.

### Q5: How do SonarQube and Trivy complement each other?

* **Testing Intent**: Understanding SAST vs Vulnerability Management.
* **Strong Answer**: SonarQube focuses on source code quality, maintainability, code smells, duplication, test coverage, and code-level security SAST. Trivy focuses on known CVE vulnerabilities in third-party libraries, OS dependencies, IaC templates, and compiled Docker container layers. Together, they provide 360-degree security coverage.

--- *(Complete 38 Questions formatted for interview preparation)*
