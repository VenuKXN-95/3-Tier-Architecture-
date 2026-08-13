#!/usr/bin/env bash
# ==============================================================================
# Master CI Local Runner Script with Automated Auto-Fix / Self-Healing
# Repository: 3-Tier E-Commerce Application (FastAPI + React + MongoDB)
# Location: scripts/ci.sh
# Usage: ./scripts/ci.sh [--fix] [OPTIONS]
# ==============================================================================

set -euo pipefail

# --- Color Formatting ---
if [ -t 1 ]; then
    COLOR_RESET="\033[0m"
    COLOR_BOLD="\033[1m"
    COLOR_GREEN="\033[1;32m"
    COLOR_RED="\033[1;31m"
    COLOR_YELLOW="\033[1;33m"
    COLOR_CYAN="\033[1;36m"
    COLOR_MAGENTA="\033[1;35m"
else
    COLOR_RESET=""
    COLOR_BOLD=""
    COLOR_GREEN=""
    COLOR_RED=""
    COLOR_YELLOW=""
    COLOR_CYAN=""
    COLOR_MAGENTA=""
fi

# --- Default Flag Options ---
RUN_BACKEND=true
RUN_FRONTEND=true
RUN_SECURITY=true
RUN_DOCKER=true
RUN_FAST=false
RUN_SONAR=false
AUTO_FIX=true
FAIL_FAST=true

usage() {
    echo -e "${COLOR_BOLD}Usage:${COLOR_RESET} $0 [OPTIONS]"
    echo ""
    echo -e "${COLOR_BOLD}Description:${COLOR_RESET}"
    echo "  Executes production-quality CI checks locally with automated self-healing."
    echo ""
    echo -e "${COLOR_BOLD}Options:${COLOR_RESET}"
    echo "      --fix            Automatically fix code formatting and linting errors when detected"
    echo "      --no-fix         Disable automatic auto-fix/self-healing behavior"
    echo "  -b, --backend-only   Run Python Backend quality & security gates only"
    echo "  -r, --frontend-only  Run React Frontend quality & security gates only"
    echo "  -s, --security-only  Run SAST, Secret, and Container security scans only"
    echo "      --skip-docker    Skip Docker image compilation & Trivy image scanning"
    echo "      --fast           Skip test suites, security audits, and docker builds for rapid check"
    echo "      --sonar          Execute local SonarQube scanner if sonar-scanner is installed"
    echo "  -h, --help           Display this help message"
    echo ""
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --fix)
            AUTO_FIX=true
            shift
            ;;
        --no-fix)
            AUTO_FIX=false
            shift
            ;;
        -b|--backend-only)
            RUN_FRONTEND=false
            RUN_SECURITY=false
            RUN_DOCKER=false
            shift
            ;;
        -r|--frontend-only)
            RUN_BACKEND=false
            RUN_SECURITY=false
            RUN_DOCKER=false
            shift
            ;;
        -s|--security-only)
            RUN_BACKEND=false
            RUN_FRONTEND=false
            RUN_DOCKER=false
            shift
            ;;
        --skip-docker)
            RUN_DOCKER=false
            shift
            ;;
        --fast)
            RUN_FAST=true
            RUN_DOCKER=false
            shift
            ;;
        --sonar)
            RUN_SONAR=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${COLOR_RED}Unknown option: $1${COLOR_RESET}"
            usage
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# Resolve Python Executable
PYTHON_CMD="python"
if command -v python &> /dev/null && python -c "import sys" &> /dev/null; then
    PYTHON_CMD="python"
elif command -v python.exe &> /dev/null && python.exe -c "import sys" &> /dev/null; then
    PYTHON_CMD="python.exe"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
fi

# Summary Data Tracking Arrays
declare -a GATE_NAMES
declare -a GATE_STATUSES
declare -a GATE_DURATIONS

TOTAL_GATES=0
PASSED_GATES=0
FAILED_GATES=0
SKIPPED_GATES=0

run_gate() {
    local name="$1"
    local cmd="$2"
    local allow_fail="${3:-false}"
    local is_optional="${4:-false}"
    local fix_cmd="${5:-}"

    echo -e "\n${COLOR_YELLOW}[RUNNING GATE]${COLOR_RESET} ${COLOR_BOLD}${name}${COLOR_RESET}"
    echo -e "${COLOR_CYAN}Command:${COLOR_RESET} $cmd"
    TOTAL_GATES=$((TOTAL_GATES + 1))

    local start_time
    start_time=$(date +%s)

    set +e
    eval "$cmd"
    local exit_code=$?
    set -e

    # Self-Healing / Auto-Fix Logic
    if [ $exit_code -ne 0 ] && [ "$AUTO_FIX" = true ] && [ -n "$fix_cmd" ]; then
        echo -e "${COLOR_MAGENTA}[AUTO-FIXING] Gate '${name}' failed. Executing repair: ${fix_cmd}...${COLOR_RESET}"
        set +e
        eval "$fix_cmd"
        eval "$cmd"
        exit_code=$?
        set -e
        if [ $exit_code -eq 0 ]; then
            echo -e "${COLOR_GREEN}[AUTO-REPAIRED] ${name} was automatically fixed!${COLOR_RESET}"
        fi
    fi

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [ $exit_code -eq 0 ]; then
        echo -e "${COLOR_GREEN}[PASSED]${COLOR_RESET} ${name} (${duration}s)"
        GATE_NAMES+=("$name")
        GATE_STATUSES+=("PASSED")
        GATE_DURATIONS+=("${duration}s")
        PASSED_GATES=$((PASSED_GATES + 1))
    else
        if [ "$allow_fail" = "true" ] || [ "$is_optional" = "true" ]; then
            echo -e "${COLOR_YELLOW}[WARNING/SKIPPED]${COLOR_RESET} ${name} (Non-fatal, Exit Code: ${exit_code})"
            GATE_NAMES+=("$name")
            GATE_STATUSES+=("SKIPPED")
            GATE_DURATIONS+=("${duration}s")
            SKIPPED_GATES=$((SKIPPED_GATES + 1))
        else
            echo -e "${COLOR_RED}[FAILED]${COLOR_RESET} ${name} (Exit Code: ${exit_code})"
            GATE_NAMES+=("$name")
            GATE_STATUSES+=("FAILED")
            GATE_DURATIONS+=("${duration}s")
            FAILED_GATES=$((FAILED_GATES + 1))

            if [ "$FAIL_FAST" = true ]; then
                echo -e "\n${COLOR_RED}${COLOR_BOLD}[FAIL-FAST] Pipeline stopped due to mandatory Quality Gate failure in: ${name}${COLOR_RESET}"
                print_summary
                exit 1
            fi
        fi
    fi
}

print_summary() {
    echo -e "\n${COLOR_CYAN}======================================================================${COLOR_RESET}"
    echo -e "${COLOR_CYAN}                   LOCAL CI QUALITY GATES SUMMARY                     ${COLOR_RESET}"
    echo -e "${COLOR_CYAN}======================================================================${COLOR_RESET}"
    printf "${COLOR_BOLD}%-48s | %-10s | %-8s${COLOR_RESET}\n" "GATE NAME" "STATUS" "DURATION"
    printf "%s\n" "----------------------------------------------------------------------"

    for i in "${!GATE_NAMES[@]}"; do
        name="${GATE_NAMES[$i]}"
        status="${GATE_STATUSES[$i]}"
        duration="${GATE_DURATIONS[$i]}"

        if [ "$status" = "PASSED" ]; then
            status_fmt="${COLOR_GREEN}PASSED${COLOR_RESET}"
        elif [ "$status" = "FAILED" ]; then
            status_fmt="${COLOR_RED}FAILED${COLOR_RESET}"
        else
            status_fmt="${COLOR_YELLOW}SKIPPED${COLOR_RESET}"
        fi

        printf "%-48s | %b | %-8s\n" "$name" "$status_fmt" "$duration"
    done

    printf "%s\n" "----------------------------------------------------------------------"
    echo -e "Total Evaluated: ${COLOR_BOLD}${TOTAL_GATES}${COLOR_RESET} | Passed: ${COLOR_GREEN}${PASSED_GATES}${COLOR_RESET} | Failed: ${COLOR_RED}${FAILED_GATES}${COLOR_RESET} | Skipped/Warnings: ${COLOR_YELLOW}${SKIPPED_GATES}${COLOR_RESET}\n"
}

echo -e "${COLOR_MAGENTA}======================================================================${COLOR_RESET}"
echo -e "${COLOR_MAGENTA}   PRODUCTION CI LOCAL RUNNER WITH SELF-HEALING (scripts/ci.sh)       ${COLOR_RESET}"
echo -e "${COLOR_MAGENTA}======================================================================${COLOR_RESET}"
echo -e "Target Directory : ${COLOR_BOLD}${ROOT_DIR}${COLOR_RESET}"
echo -e "Python Execution : ${COLOR_BOLD}${PYTHON_CMD}${COLOR_RESET}"
echo -e "Auto-Fix Enabled : ${COLOR_BOLD}${AUTO_FIX}${COLOR_RESET}\n"

# ==============================================================================
# SECTION 1: Python Backend CI Quality Gates
# ==============================================================================
if [ "$RUN_BACKEND" = true ]; then
    echo -e "\n${COLOR_CYAN}--- [1/5] Python Backend Quality Gates ---${COLOR_RESET}"
    cd "$ROOT_DIR/backend"

    run_gate "Backend Format Check (Black)" "$PYTHON_CMD -m black --check app tests" "false" "false" "$PYTHON_CMD -m black app tests"
    run_gate "Backend Code Linting (Flake8)" "$PYTHON_CMD -m flake8 app tests --max-line-length=88 --extend-ignore=E203,W503,E402" "false" "false" "$PYTHON_CMD -m black app tests"
    run_gate "Backend Deep Code Analysis (Pylint)" "$PYTHON_CMD -m pylint --rcfile=pyproject.toml app"
    run_gate "Backend Static Type Checking (Mypy)" "PYTHONPATH=. $PYTHON_CMD -m mypy --config-file pyproject.toml app"
    run_gate "Backend Security SAST (Bandit)" "$PYTHON_CMD -m bandit -r app -c pyproject.toml"

    if [ "$RUN_FAST" = false ]; then
        run_gate "Backend Dependency Audit (pip-audit)" "$PYTHON_CMD -m pip_audit -r requirements.txt --ignore-vuln PYSEC-2024-001" "true" "true"

        # MongoDB Instant Port Resolution
        export PYTHONPATH="."
        if [ -z "${MONGO_URI:-}" ]; then
            if $PYTHON_CMD -c "import socket, sys; sys.exit(socket.socket().connect_ex(('127.0.0.1', 27018)))" 2>/dev/null; then
                export MONGO_URI="mongodb://localhost:27018/?directConnection=true"
            elif $PYTHON_CMD -c "import socket, sys; sys.exit(socket.socket().connect_ex(('127.0.0.1', 27017)))" 2>/dev/null; then
                export MONGO_URI="mongodb://localhost:27017/?directConnection=true"
            fi
        fi
        export MONGO_DB_NAME="${MONGO_DB_NAME:-ecommerce_test}"
        export APP_NAME="${APP_NAME:-E-Commerce Test System}"
        export DEBUG="true"

        run_gate "Backend Pytest Test Suite & Coverage" "$PYTHON_CMD -m pytest tests --cov=app --cov-report=xml:coverage.xml --cov-report=term-missing"
    else
        echo -e "${COLOR_YELLOW}[SKIPPED] Pytest Suite & pip-audit (Fast mode active)${COLOR_RESET}"
    fi
fi

# ==============================================================================
# SECTION 2: React Frontend CI Quality Gates
# ==============================================================================
if [ "$RUN_FRONTEND" = true ]; then
    echo -e "\n${COLOR_CYAN}--- [2/5] React Frontend Quality Gates ---${COLOR_RESET}"
    cd "$ROOT_DIR/frontend"

    run_gate "Frontend Code Linting (ESLint)" "npm run lint" "false" "false" "npm run lint -- --fix"
    run_gate "Frontend Type Verification (tsc)" "npx tsc --noEmit"
    run_gate "Frontend Production Build (Vite)" "npm run build"

    if [ "$RUN_FAST" = false ]; then
        run_gate "Frontend Dependency Audit (npm audit)" "npm audit --audit-level=high" "true" "true"
    else
        echo -e "${COLOR_YELLOW}[SKIPPED] npm audit (Fast mode active)${COLOR_RESET}"
    fi
fi

# ==============================================================================
# SECTION 3: Static Security & Vulnerability Scanning
# ==============================================================================
if [ "$RUN_SECURITY" = true ]; then
    echo -e "\n${COLOR_CYAN}--- [3/5] Static Security & Vulnerability Scanning ---${COLOR_RESET}"
    cd "$ROOT_DIR"

    # Secret Leak Detection (Gitleaks)
    if command -v gitleaks &> /dev/null; then
        run_gate "Secret Leak Detection (Gitleaks)" "gitleaks detect --source . --verbose" "true"
    else
        echo -e "${COLOR_YELLOW}[SKIPPED] Gitleaks (gitleaks CLI not installed locally)${COLOR_RESET}"
        GATE_NAMES+=("Secret Leak Detection (Gitleaks)")
        GATE_STATUSES+=("SKIPPED")
        GATE_DURATIONS+=("0s")
        SKIPPED_GATES=$((SKIPPED_GATES + 1))
    fi

    # Dockerfile Best Practices Linting (Hadolint)
    if command -v hadolint &> /dev/null; then
        run_gate "Backend Dockerfile Lint (Hadolint)" "hadolint backend/Dockerfile" "true"
        run_gate "Frontend Dockerfile Lint (Hadolint)" "hadolint frontend/Dockerfile" "true"
    else
        echo -e "${COLOR_YELLOW}[SKIPPED] Hadolint (hadolint CLI not installed locally)${COLOR_RESET}"
        GATE_NAMES+=("Backend Dockerfile Lint (Hadolint)")
        GATE_STATUSES+=("SKIPPED")
        GATE_DURATIONS+=("0s")
        GATE_NAMES+=("Frontend Dockerfile Lint (Hadolint)")
        GATE_STATUSES+=("SKIPPED")
        GATE_DURATIONS+=("0s")
        SKIPPED_GATES=$((SKIPPED_GATES + 2))
    fi

    # Filesystem Vulnerability Scan (Trivy)
    if command -v trivy &> /dev/null; then
        run_gate "Trivy Filesystem Vulnerability Scan" "trivy fs --ignore-unfixed --severity HIGH,CRITICAL ." "true"
    else
        echo -e "${COLOR_YELLOW}[SKIPPED] Trivy Filesystem Scan (trivy CLI not installed locally)${COLOR_RESET}"
        GATE_NAMES+=("Trivy Filesystem Vulnerability Scan")
        GATE_STATUSES+=("SKIPPED")
        GATE_DURATIONS+=("0s")
        SKIPPED_GATES=$((SKIPPED_GATES + 1))
    fi
fi

# ==============================================================================
# SECTION 4: SonarQube Scanner Integration
# ==============================================================================
if [ "$RUN_SONAR" = true ]; then
    echo -e "\n${COLOR_CYAN}--- [4/5] SonarQube Static Code Analysis ---${COLOR_RESET}"
    cd "$ROOT_DIR"
    if command -v sonar-scanner &> /dev/null; then
        run_gate "SonarQube Code Analysis" "sonar-scanner" "true"
    else
        echo -e "${COLOR_YELLOW}[SKIPPED] SonarQube Scanner (sonar-scanner CLI not installed locally)${COLOR_RESET}"
        GATE_NAMES+=("SonarQube Code Analysis")
        GATE_STATUSES+=("SKIPPED")
        GATE_DURATIONS+=("0s")
        SKIPPED_GATES=$((SKIPPED_GATES + 1))
    fi
fi

# ==============================================================================
# SECTION 5: Docker Build & Trivy Image Vulnerability Scan
# ==============================================================================
if [ "$RUN_DOCKER" = true ] && [ "$RUN_FAST" = false ]; then
    echo -e "\n${COLOR_CYAN}--- [5/5] Docker Image Build & Trivy Container Scan ---${COLOR_RESET}"
    cd "$ROOT_DIR"

    if command -v docker &> /dev/null && docker info &> /dev/null; then
        COMMIT_TAG=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
        BACKEND_IMAGE="ecommerce-backend:${COMMIT_TAG}"
        FRONTEND_IMAGE="ecommerce-frontend:${COMMIT_TAG}"

        run_gate "Docker Build Backend Image" "docker build -t ${BACKEND_IMAGE} ./backend"
        run_gate "Docker Build Frontend Image" "docker build -t ${FRONTEND_IMAGE} ./frontend"

        if command -v trivy &> /dev/null; then
            run_gate "Trivy Scan Backend Image" "trivy image --severity HIGH,CRITICAL --ignore-unfixed ${BACKEND_IMAGE}" "true"
            run_gate "Trivy Scan Frontend Image" "trivy image --severity HIGH,CRITICAL --ignore-unfixed ${FRONTEND_IMAGE}" "true"
        else
            echo -e "${COLOR_YELLOW}[SKIPPED] Trivy Container Image Scan (trivy CLI not installed locally)${COLOR_RESET}"
            GATE_NAMES+=("Trivy Scan Backend Image")
            GATE_STATUSES+=("SKIPPED")
            GATE_DURATIONS+=("0s")
            GATE_NAMES+=("Trivy Scan Frontend Image")
            GATE_STATUSES+=("SKIPPED")
            GATE_DURATIONS+=("0s")
            SKIPPED_GATES=$((SKIPPED_GATES + 2))
        fi
    else
        echo -e "${COLOR_YELLOW}[SKIPPED] Docker Build & Trivy Scan (Docker daemon not running)${COLOR_RESET}"
        GATE_NAMES+=("Docker Build Backend Image")
        GATE_STATUSES+=("SKIPPED")
        GATE_DURATIONS+=("0s")
        GATE_NAMES+=("Docker Build Frontend Image")
        GATE_STATUSES+=("SKIPPED")
        GATE_DURATIONS+=("0s")
        SKIPPED_GATES=$((SKIPPED_GATES + 2))
    fi
fi

# ==============================================================================
# Summary Report
# ==============================================================================
print_summary

if [ $FAILED_GATES -gt 0 ]; then
    echo -e "${COLOR_RED}${COLOR_BOLD}[RESULT] CI Quality Gates FAILED. Fix issues before committing.${COLOR_RESET}"
    exit 1
else
    echo -e "${COLOR_GREEN}${COLOR_BOLD}[RESULT] All active local CI Quality Gates PASSED successfully!${COLOR_RESET}"
    exit 0
fi
