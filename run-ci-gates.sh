#!/usr/bin/env bash
# ==============================================================================
# Automated CI Quality Gates Local Runner (POSIX Bash)
# Executes all CI quality gates matching .github/workflows/ci.yml
# ==============================================================================

set -u

# --- Color Formatting ---
if [ -t 1 ]; then
    COLOR_RESET="\033[0m"
    COLOR_BOLD="\033[1m"
    COLOR_GREEN="\033[1;32m"
    COLOR_RED="\033[1;31m"
    COLOR_YELLOW="\033[1;33m"
    COLOR_CYAN="\033[1;36m"
else
    COLOR_RESET=""
    COLOR_BOLD=""
    COLOR_GREEN=""
    COLOR_RED=""
    COLOR_YELLOW=""
    COLOR_CYAN=""
fi

# --- Flags & Arguments ---
RUN_BACKEND=true
RUN_FRONTEND=true
RUN_SECURITY=true
RUN_DOCKER=true
RUN_FAST=false

usage() {
    echo -e "${COLOR_BOLD}Usage:${COLOR_RESET} $0 [OPTIONS]"
    echo ""
    echo "Runs GitHub Actions CI checks locally before committing or pushing."
    echo ""
    echo -e "${COLOR_BOLD}Options:${COLOR_RESET}"
    echo "  -b, --backend-only   Run only Python Backend CI gates"
    echo "  -f, --frontend-only  Run only React Frontend CI gates"
    echo "  -s, --security-only  Run only Security and Docker linting gates"
    echo "      --skip-docker    Skip Docker image build verification & docker-based tools"
    echo "      --fast           Skip tests, security audits, and docker builds for quick check"
    echo "  -h, --help           Display this help message"
    echo ""
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -b|--backend-only)
            RUN_FRONTEND=false
            RUN_SECURITY=false
            RUN_DOCKER=false
            shift
            ;;
        -f|--frontend-only)
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
cd "$SCRIPT_DIR"

# Resolve Python executable
PYTHON_CMD="python"
if command -v python &> /dev/null && python -c "import sys" &> /dev/null; then
    PYTHON_CMD="python"
elif command -v python.exe &> /dev/null && python.exe -c "import sys" &> /dev/null; then
    PYTHON_CMD="python.exe"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
fi

# Summary Data Arrays
declare -a GATE_NAMES
declare -a GATE_STATUSES

TOTAL_GATES=0
FAILED_GATES=0
PASSED_GATES=0
SKIPPED_GATES=0

run_gate() {
    local name="$1"
    local cmd="$2"
    local allow_fail="${3:-false}"
    local is_optional="${4:-false}"

    echo -e "\n${COLOR_YELLOW}[RUNNING GATE]${COLOR_RESET} ${COLOR_BOLD}${name}${COLOR_RESET}..."
    TOTAL_GATES=$((TOTAL_GATES + 1))

    eval "$cmd"
    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo -e "${COLOR_GREEN}[PASSED]${COLOR_RESET} ${name}"
        GATE_NAMES+=("$name")
        GATE_STATUSES+=("PASSED")
        PASSED_GATES=$((PASSED_GATES + 1))
    else
        if [ "$allow_fail" = "true" ] || [ "$is_optional" = "true" ]; then
            echo -e "${COLOR_YELLOW}[WARNING/SKIPPED]${COLOR_RESET} ${name} (Non-fatal, exit code: ${exit_code})"
            GATE_NAMES+=("$name")
            GATE_STATUSES+=("SKIPPED")
            SKIPPED_GATES=$((SKIPPED_GATES + 1))
        else
            echo -e "${COLOR_RED}[FAILED]${COLOR_RESET} ${name} (Exit Code: ${exit_code})"
            GATE_NAMES+=("$name")
            GATE_STATUSES+=("FAILED")
            FAILED_GATES=$((FAILED_GATES + 1))
        fi
    fi
}

echo -e "${COLOR_CYAN}======================================================${COLOR_RESET}"
echo -e "${COLOR_CYAN}       RUNNING LOCAL CI QUALITY GATES                 ${COLOR_RESET}"
echo -e "${COLOR_CYAN}======================================================${COLOR_RESET}"
echo -e "Matching CI Pipeline: ${COLOR_BOLD}.github/workflows/ci.yml${COLOR_RESET}"
echo -e "Using Python: ${COLOR_BOLD}${PYTHON_CMD}${COLOR_RESET}\n"

# ==============================================================================
# 1. Python Backend CI Gates
# ==============================================================================
if [ "$RUN_BACKEND" = true ]; then
    echo -e "\n${COLOR_CYAN}--- [1/4] Python Backend CI Gates ---${COLOR_RESET}"
    cd "$SCRIPT_DIR/backend"

    run_gate "Backend Code Formatting (Black)" "$PYTHON_CMD -m black --check app tests"
    run_gate "Backend Code Linting (Flake8)" "$PYTHON_CMD -m flake8 app tests --max-line-length=88 --extend-ignore=E203,W503,E402"
    run_gate "Backend Deep Code Analysis (Pylint)" "$PYTHON_CMD -m pylint --rcfile=pyproject.toml app"
    run_gate "Backend Static Type Checking (Mypy)" "PYTHONPATH=. $PYTHON_CMD -m mypy --config-file pyproject.toml app"
    run_gate "Backend Security Analysis (Bandit)" "$PYTHON_CMD -m bandit -r app -c pyproject.toml"

    if [ "$RUN_FAST" = false ]; then
        run_gate "Backend Dependency Audit (pip-audit)" "$PYTHON_CMD -m pip_audit -r requirements.txt --ignore-vuln PYSEC-2024-001" "true" "true"

        echo -e "\n${COLOR_CYAN}Running Backend Pytest Suite...${COLOR_RESET}"
        export PYTHONPATH="."
        if [ -z "${MONGO_URI:-}" ]; then
            if (exec 3<>/dev/tcp/127.0.0.1/27018) 2>/dev/null; then
                export MONGO_URI="mongodb://localhost:27018/?directConnection=true"
            elif (exec 3<>/dev/tcp/127.0.0.1/27017) 2>/dev/null; then
                export MONGO_URI="mongodb://localhost:27017/?directConnection=true"
            fi
        fi
        export MONGO_DB_NAME="${MONGO_DB_NAME:-ecommerce_test}"
        export APP_NAME="${APP_NAME:-E-Commerce Test System}"
        export DEBUG="true"

        run_gate "Backend Pytest Test Suite" "$PYTHON_CMD -m pytest tests --cov=app --cov-report=xml:coverage.xml --cov-report=term-missing"
    else
        echo -e "${COLOR_YELLOW}[SKIPPED] Backend Pytest Suite & pip-audit (Fast mode enabled)${COLOR_RESET}"
    fi
fi

# ==============================================================================
# 2. React Frontend CI Gates
# ==============================================================================
if [ "$RUN_FRONTEND" = true ]; then
    echo -e "\n${COLOR_CYAN}--- [2/4] React Frontend CI Gates ---${COLOR_RESET}"
    cd "$SCRIPT_DIR/frontend"

    run_gate "Frontend Code Linting (ESLint)" "npm run lint"
    run_gate "Frontend Type Checking (tsc)" "npx tsc --noEmit"
    run_gate "Frontend Production Build (Vite)" "npm run build"

    if [ "$RUN_FAST" = false ]; then
        run_gate "Frontend Dependency Audit (npm audit)" "npm audit --audit-level=high" "true" "true"
    else
        echo -e "${COLOR_YELLOW}[SKIPPED] Frontend npm audit (Fast mode enabled)${COLOR_RESET}"
    fi
fi

# ==============================================================================
# 3. Security & Vulnerability Scanning
# ==============================================================================
if [ "$RUN_SECURITY" = true ]; then
    echo -e "\n${COLOR_CYAN}--- [3/4] Security & Vulnerability Scanning ---${COLOR_RESET}"
    cd "$SCRIPT_DIR"

    # Secret Leak Detection (Gitleaks)
    if command -v gitleaks &> /dev/null; then
        run_gate "Secret Leak Detection (Gitleaks)" "gitleaks detect --source . --verbose" "true"
    elif command -v docker &> /dev/null && [ "$RUN_DOCKER" = true ]; then
        run_gate "Secret Leak Detection (Gitleaks Docker)" "docker run --rm -v \"$SCRIPT_DIR:/path\" zricethezav/gitleaks:latest detect --source=\"/path\" --verbose" "true" "true"
    else
        echo -e "${COLOR_YELLOW}[SKIPPED] Secret Leak Detection (gitleaks tool not installed locally)${COLOR_RESET}"
        GATE_NAMES+=("Secret Leak Detection (Gitleaks)")
        GATE_STATUSES+=("SKIPPED")
        SKIPPED_GATES=$((SKIPPED_GATES + 1))
    fi

    # Dockerfile Linting (Hadolint)
    if command -v hadolint &> /dev/null; then
        run_gate "Lint Backend Dockerfile (Hadolint)" "hadolint backend/Dockerfile" "true"
        run_gate "Lint Frontend Dockerfile (Hadolint)" "hadolint frontend/Dockerfile" "true"
    elif command -v docker &> /dev/null && [ "$RUN_DOCKER" = true ]; then
        run_gate "Lint Backend Dockerfile (Hadolint Docker)" "docker run --rm -i hadolint/hadolint < backend/Dockerfile" "true" "true"
        run_gate "Lint Frontend Dockerfile (Hadolint Docker)" "docker run --rm -i hadolint/hadolint < frontend/Dockerfile" "true" "true"
    else
        echo -e "${COLOR_YELLOW}[SKIPPED] Hadolint Dockerfile Linting (hadolint tool not installed locally)${COLOR_RESET}"
        GATE_NAMES+=("Lint Backend Dockerfile (Hadolint)")
        GATE_STATUSES+=("SKIPPED")
        GATE_NAMES+=("Lint Frontend Dockerfile (Hadolint)")
        GATE_STATUSES+=("SKIPPED")
        SKIPPED_GATES=$((SKIPPED_GATES + 2))
    fi

    # Repository Vulnerability Scan (Trivy)
    if command -v trivy &> /dev/null; then
        run_gate "Repository Vulnerability Scan (Trivy)" "trivy fs --ignore-unfixed --severity HIGH,CRITICAL ." "true"
    elif command -v docker &> /dev/null && [ "$RUN_DOCKER" = true ]; then
        run_gate "Repository Vulnerability Scan (Trivy Docker)" "docker run --rm -v \"$SCRIPT_DIR:/root/src\" aquasecurity/trivy:latest fs --ignore-unfixed --severity HIGH,CRITICAL /root/src" "true" "true"
    else
        echo -e "${COLOR_YELLOW}[SKIPPED] Repository Vulnerability Scan (trivy tool not installed locally)${COLOR_RESET}"
        GATE_NAMES+=("Repository Vulnerability Scan (Trivy)")
        GATE_STATUSES+=("SKIPPED")
        SKIPPED_GATES=$((SKIPPED_GATES + 1))
    fi
fi

# ==============================================================================
# 4. Docker Build Verification
# ==============================================================================
if [ "$RUN_DOCKER" = true ] && [ "$RUN_FAST" = false ]; then
    echo -e "\n${COLOR_CYAN}--- [4/4] Docker Build Verification ---${COLOR_RESET}"
    cd "$SCRIPT_DIR"

    if command -v docker &> /dev/null && docker info &> /dev/null; then
        run_gate "Build Backend Image (Docker)" "docker build -t ecommerce-backend:ci ./backend"
        run_gate "Build Frontend Image (Docker)" "docker build -t ecommerce-frontend:ci ./frontend"
    else
        echo -e "${COLOR_YELLOW}[SKIPPED] Docker Build Verification (Docker daemon is not running)${COLOR_RESET}"
        GATE_NAMES+=("Build Backend Image (Docker)")
        GATE_STATUSES+=("SKIPPED")
        GATE_NAMES+=("Build Frontend Image (Docker)")
        GATE_STATUSES+=("SKIPPED")
        SKIPPED_GATES=$((SKIPPED_GATES + 2))
    fi
fi

# ==============================================================================
# Summary Table Report
# ==============================================================================
echo -e "\n${COLOR_CYAN}======================================================${COLOR_RESET}"
echo -e "${COLOR_CYAN}               CI QUALITY GATES SUMMARY               ${COLOR_RESET}"
echo -e "${COLOR_CYAN}======================================================${COLOR_RESET}"

printf "${COLOR_BOLD}%-50s | %-12s${COLOR_RESET}\n" "GATE NAME" "STATUS"
printf "%s\n" "-------------------------------------------------------------------"

for i in "${!GATE_NAMES[@]}"; do
    name="${GATE_NAMES[$i]}"
    status="${GATE_STATUSES[$i]}"

    if [ "$status" = "PASSED" ]; then
        status_fmt="${COLOR_GREEN}PASSED${COLOR_RESET}"
    elif [ "$status" = "FAILED" ]; then
        status_fmt="${COLOR_RED}FAILED${COLOR_RESET}"
    else
        status_fmt="${COLOR_YELLOW}SKIPPED${COLOR_RESET}"
    fi

    printf "%-50s | %b\n" "$name" "$status_fmt"
done

printf "%s\n" "-------------------------------------------------------------------"
echo -e "Total Gates Evaluated: ${COLOR_BOLD}${TOTAL_GATES}${COLOR_RESET}"
echo -e "Passed: ${COLOR_GREEN}${PASSED_GATES}${COLOR_RESET} | Failed: ${COLOR_RED}${FAILED_GATES}${COLOR_RESET} | Skipped/Warnings: ${COLOR_YELLOW}${SKIPPED_GATES}${COLOR_RESET}\n"

if [ $FAILED_GATES -gt 0 ]; then
    echo -e "${COLOR_RED}${COLOR_BOLD}[RESULT] CI Quality Gates FAILED. Fix errors before pushing.${COLOR_RESET}"
    exit 1
else
    echo -e "${COLOR_GREEN}${COLOR_BOLD}[RESULT] All active CI Quality Gates PASSED successfully!${COLOR_RESET}"
    exit 0
fi
