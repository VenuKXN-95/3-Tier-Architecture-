# Manual Testing Guide for CI Quality Gates

This comprehensive guide details how to manually execute, verify, and debug all **CI Quality Gates** configured in [.github/workflows/ci.yml](file:///c:/devops/Practice/3-Tier%20Architecture%20with%20Mongo%20DB/.github/workflows/ci.yml) for the **3-Tier E-Commerce Application (FastAPI + React + MongoDB)**.

---

## 📋 Table of Contents
1. [Overview of CI Quality Gates](#overview-of-ci-quality-gates)
2. [Prerequisites & Environment Setup](#prerequisites--environment-setup)
3. [Python Backend Quality Gates](#1-python-backend-quality-gates)
4. [React Frontend Quality Gates](#2-react-frontend-quality-gates)
5. [Security & Docker Container Quality Gates](#3-security--docker-container-quality-gates)
6. [Automated Execution Script](#4-automated-local-execution-script)
7. [Troubleshooting & Remediation](#5-troubleshooting--remediation)

---

## 🎯 Overview of CI Quality Gates

Quality Gates are automated checkpoints that code must pass before merging into `main`, `master`, or `develop` branches. Running these gates locally ensures that continuous integration checks pass seamlessly on GitHub Actions.

```
       ┌─────────────────────────────────────────────────────────┐
       │                Local Manual CI Testing                  │
       └────────────────────────────┬────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Backend Gates   │      │  Frontend Gates  │      │ Security & Docker│
├──────────────────┤      ├──────────────────┤      ├──────────────────┤
│ • Black          │      │ • ESLint         │      │ • Gitleaks       │
│ • Flake8         │      │ • TypeScript tsc │      │ • Hadolint       │
│ • Pylint         │      │ • Vite Build     │      │ • Trivy          │
│ • Mypy           │      │ • npm audit      │      │ • Docker Build   │
│ • Bandit         │      └──────────────────┘      └──────────────────┘
│ • Pytest         │
└──────────────────┘
```

---

## 🛠️ Prerequisites & Environment Setup

Ensure you have the following installed on your machine:
* **Python**: `3.11` or higher
* **Node.js**: `v20.x` or higher
* **Docker Desktop**: Running (for container scans & MongoDB tests)

### Initializing Dependencies

#### Backend Setup
Navigate to the `backend` directory and install development dependencies:
```powershell
cd backend
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
```

#### Frontend Setup
Navigate to the `frontend` directory and install node modules:
```powershell
cd frontend
npm ci
```

---

## 1. Python Backend Quality Gates

All backend commands are run from the `backend/` directory.

### Gate 1: Code Formatting (Black)
Checks if Python code follows strict PEP 8 formatting standards without altering code.
```powershell
python -m black --check app tests
```
* **Pass condition**: `All done! XX files would be left unchanged.`
* **Fix command**: `python -m black app tests`

---

### Gate 2: Code Linting (Flake8)
Enforces syntax rules, line length limits (88 chars), and code cleanliness.
```powershell
python -m flake8 app tests --max-line-length=88 --extend-ignore=E203,W503,E402
```
* **Pass condition**: Zero output / exit code 0.

---

### Gate 3: Deep Code Analysis (Pylint)
Performs static analysis to find code smells, unused imports, and maintainability issues.
```powershell
python -m pylint --rcfile=pyproject.toml app
```
* **Pass condition**: Rating score of **9.00/10** or higher (configured in `pyproject.toml`).

---

### Gate 4: Static Type Checking (Mypy)
Validates type annotations across models, schemas, services, and repositories.
```powershell
python -m mypy --config-file pyproject.toml app
```
* **Pass condition**: `Success: no issues found in XX source files`.

---

### Gate 5: Security Code Analysis (Bandit)
Scans Python AST for security vulnerabilities (e.g., hardcoded credentials, unsafe calls).
```powershell
python -m bandit -r app -c pyproject.toml
```
* **Pass condition**: `No issues identified.`

---

### Gate 6: Dependency Security Audit (pip-audit)
Audits Python package dependencies against known vulnerability databases (CVEs).
```powershell
pip-audit -r requirements.txt --ignore-code PYSEC-2024-001
```
* **Pass condition**: `No known vulnerabilities found`.

---

### Gate 7: Unit & Integration Test Suite (Pytest)
Executes the backend test suite with coverage report output.

*Note: Start local MongoDB first if running database-dependent tests:*
```powershell
docker compose up -d mongodb
```

Run test suite:
```powershell
pytest tests --cov=app --cov-report=term-missing --cov-report=xml:coverage.xml
```
* **Pass condition**: All tests pass with no failures or unhandled exceptions.

---

## 2. React Frontend Quality Gates

All frontend commands are run from the `frontend/` directory.

### Gate 1: ESLint Code Linting
Checks React, TypeScript, and JSX code against ESLint rules.
```powershell
npm run lint
```
* **Pass condition**: Exit code 0 without lint errors.
* **Fix command**: `npm run lint -- --fix`

---

### Gate 2: TypeScript Type Verification (`tsc`)
Runs strict TypeScript compilation checks without generating output files.
```powershell
npx tsc --noEmit
```
* **Pass condition**: Zero compilation or type mismatch errors.

---

### Gate 3: Production Build Verification (Vite)
Compiles TypeScript and builds the optimized production assets into `dist/`.
```powershell
npm run build
```
* **Pass condition**: `✓ built in XXs` with generated HTML, CSS, and JS chunks.

---

### Gate 4: Frontend Dependency Audit (`npm audit`)
Scans `package-lock.json` for high or critical security vulnerabilities.
```powershell
npm audit --audit-level=high
```
* **Pass condition**: Zero high/critical vulnerabilities.

---

## 3. Security & Docker Container Quality Gates

Run from project root directory `3-Tier Architecture with Mongo DB/`.

### Gate 1: Secret Leak Detection (Gitleaks)
Scans git commit history and files for exposed API keys, private keys, or passwords.
```powershell
gitleaks detect --source . --verbose
```
* **Pass condition**: `No leaks found`.

---

### Gate 2: Dockerfile Linting (Hadolint)
Validates Dockerfile best practices and multi-stage build instructions.
```powershell
# Backend Dockerfile
docker run --rm -i hadolint/hadolint < backend/Dockerfile

# Frontend Dockerfile
docker run --rm -i hadolint/hadolint < frontend/Dockerfile
```
* **Pass condition**: Zero threshold errors.

---

### Gate 3: Repository Vulnerability Scan (Trivy)
Scans the file system for vulnerable dependencies and security flaws.
```powershell
trivy fs --ignore-unfixed --severity HIGH,CRITICAL .
```
* **Pass condition**: Zero unignored critical security findings.

---

### Gate 4: Docker Image Build Verification
Verifies container images compile successfully.
```powershell
docker build -t ecommerce-backend:ci ./backend
docker build -t ecommerce-frontend:ci ./frontend
```
* **Pass condition**: Successfully built images tagged `ecommerce-backend:ci` and `ecommerce-frontend:ci`.

---

## 4. Automated Local Execution Scripts with Self-Healing

To run all local quality gates with a single command (with automated self-healing for formatting/linting), use the provided helper scripts:

### Executing `scripts/ci.sh` (POSIX Bash / Linux / macOS / Git Bash)
From the project root:
```bash
./scripts/ci.sh
```

**Supported Command Line Options:**
* `./scripts/ci.sh --fix`: Enable automatic auto-repair of code formatting (Black) and linting (ESLint).
* `./scripts/ci.sh --backend-only`: Run Python backend quality gates only.
* `./scripts/ci.sh --frontend-only`: Run React frontend quality gates only.
* `./scripts/ci.sh --security-only`: Run security scanning and Docker linting gates only.
* `./scripts/ci.sh --skip-docker`: Skip Docker image build verification.
* `./scripts/ci.sh --fast`: Skip test suite execution and security audits for a rapid check.
* `./scripts/ci.sh --sonar`: Execute local SonarQube scanner if installed.

---

### Executing `run-ci-gates.ps1` (PowerShell / Windows)
From the project root:
```powershell
.\run-ci-gates.ps1
```

*(If script execution is restricted in PowerShell, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

**Supported PowerShell Switches:**
* `.\run-ci-gates.ps1 -Fix`: Enable automatic repair for formatting and linting (Enabled by default).
* `.\run-ci-gates.ps1 -BackendOnly`
* `.\run-ci-gates.ps1 -FrontendOnly`
* `.\run-ci-gates.ps1 -SecurityOnly`
* `.\run-ci-gates.ps1 -SkipDocker`
* `.\run-ci-gates.ps1 -Fast`

---

### ⚓ Git Pre-Push Hook Integration
You can automate running quality gates locally prior to every `git push` by adding a Git hook:

```bash
# Create Git pre-push hook
cat << 'EOF' > .git/hooks/pre-push
#!/bin/sh
echo "Running pre-push local CI quality gates..."
./run-ci-gates.sh --fast
EOF

# Make hook executable
chmod +x .git/hooks/pre-push
```

---

## 5. Troubleshooting & Remediation

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **Black check fails** | Code formatting drift | Run `python -m black app tests` inside `backend/` to auto-format. |
| **ESLint errors** | Style/lint violations | Run `npm run lint -- --fix` inside `frontend/`. |
| **Pytest MongoDB Connection Error** | MongoDB container offline | Run `docker compose up -d mongodb` or ensure MongoDB is running on port 27017/27018. |
| **Mypy type error** | Missing type hint / incompatible return type | Update function signatures or schemas with explicit typing. |
| **npm audit warnings** | Outdated NPM package advisory | Run `npm audit fix` inside `frontend/`. |
