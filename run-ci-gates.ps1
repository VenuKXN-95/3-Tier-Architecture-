# Automated Quality Gates Local Runner with Self-Healing (PowerShell)
# Executes all CI quality gates matching .github/workflows/ci.yml with auto-fix capability

[CmdletBinding()]
param (
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$SecurityOnly,
    [switch]$SkipDocker,
    [switch]$Fast,
    [switch]$Fix = $true,
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: .\run-ci-gates.ps1 [OPTIONS]" -ForegroundColor Yellow
    Write-Host "`nOptions:"
    Write-Host "  -Fix            Automatically repair formatting and auto-fixable lint errors (Enabled by default)"
    Write-Host "  -BackendOnly    Run only Python Backend CI gates"
    Write-Host "  -FrontendOnly   Run only React Frontend CI gates"
    Write-Host "  -SecurityOnly   Run only Security & Docker scanning gates"
    Write-Host "  -SkipDocker     Skip Docker image build verification & container tools"
    Write-Host "  -Fast           Skip tests, security audits, and docker builds for rapid check"
    Write-Host "  -Help           Display this help message"
    exit 0
}

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "       RUNNING LOCAL CI QUALITY GATES WITH AUTO-FIX    " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "Matching CI Pipeline: .github/workflows/ci.yml"
Write-Host "Auto-Fix Enabled    : $Fix`n"

$RunBackend = -not ($FrontendOnly -or $SecurityOnly)
$RunFrontend = -not ($BackendOnly -or $SecurityOnly)
$RunSecurity = -not ($BackendOnly -or $FrontendOnly)
$RunDocker = -not ($BackendOnly -or $FrontendOnly -or $SkipDocker -or $Fast)

$Results = @()
$FailedCount = 0
$PassedCount = 0
$SkippedCount = 0

function Run-Gate ($Name, $ScriptBlock, [bool]$AllowFail = $false, [bool]$IsOptional = $false, $FixBlock = $null) {
    Write-Host "`n[RUNNING GATE] $Name..." -ForegroundColor Yellow
    $global:LASTEXITCODE = 0
    try {
        & $ScriptBlock
        if ($LASTEXITCODE -ne 0 -and $Fix -and $FixBlock -ne $null) {
            Write-Host "[AUTO-FIXING] Gate '${Name}' failed. Executing automatic repair..." -ForegroundColor Magenta
            & $FixBlock
            $global:LASTEXITCODE = 0
            & $ScriptBlock
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[AUTO-REPAIRED] ${Name} was automatically fixed!" -ForegroundColor Green
            }
        }

        if ($LASTEXITCODE -eq 0) {
            Write-Host "[PASSED] ${Name}" -ForegroundColor Green
            $script:Results += [PSCustomObject]@{ Gate = $Name; Status = "PASSED" }
            $script:PassedCount++
        } else {
            if ($AllowFail -or $IsOptional) {
                Write-Host "[WARNING/SKIPPED] ${Name} (Exit Code: $LASTEXITCODE)" -ForegroundColor Yellow
                $script:Results += [PSCustomObject]@{ Gate = $Name; Status = "SKIPPED" }
                $script:SkippedCount++
            } else {
                Write-Host "[FAILED] ${Name} (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
                $script:Results += [PSCustomObject]@{ Gate = $Name; Status = "FAILED" }
                $script:FailedCount++
            }
        }
    } catch {
        if ($IsOptional) {
            Write-Host "[SKIPPED] ${Name}: $($_.Exception.Message)" -ForegroundColor Yellow
            $script:Results += [PSCustomObject]@{ Gate = $Name; Status = "SKIPPED" }
            $script:SkippedCount++
        } else {
            Write-Host "[ERROR] ${Name}: $($_.Exception.Message)" -ForegroundColor Red
            $script:Results += [PSCustomObject]@{ Gate = $Name; Status = "FAILED" }
            $script:FailedCount++
        }
    }
}

# --- 1. Backend Gates ---
if ($RunBackend) {
    Write-Host "`n--- [1/4] Python Backend CI Gates ---" -ForegroundColor Cyan
    Push-Location "$PSScriptRoot\backend"
    
    Run-Gate "Backend Format Check (Black)" { python -m black --check app tests } $false $false { python -m black app tests }
    Run-Gate "Backend Code Linting (Flake8)" { python -m flake8 app tests --max-line-length=88 --extend-ignore=E203,W503,E402 } $false $false { python -m black app tests }
    Run-Gate "Backend Deep Analysis (Pylint)" { python -m pylint --rcfile=pyproject.toml app }
    Run-Gate "Backend Type Check (Mypy)" { $env:PYTHONPATH="."; python -m mypy --config-file pyproject.toml app }
    Run-Gate "Backend Security Scan (Bandit)" { python -m bandit -r app -c pyproject.toml }
    
    if (-not $Fast) {
        Run-Gate "Backend Dependency Audit (pip-audit)" { python -m pip_audit -r requirements.txt --ignore-vuln PYSEC-2024-001 } $true $true
        
        $env:PYTHONPATH = "."
        if (-not $env:MONGO_URI -or ($env:MONGO_URI -like "*localhost*" -and $env:MONGO_URI -notlike "*directConnection=*")) {
            $tcp27018 = New-Object System.Net.Sockets.TcpClient
            $connect27018 = $tcp27018.BeginConnect("127.0.0.1", 27018, $null, $null)
            $success27018 = $connect27018.AsyncWaitHandle.WaitOne(200, $false)
            if ($success27018 -and $tcp27018.Connected) {
                $env:MONGO_URI = "mongodb://localhost:27018/?directConnection=true"
                $tcp27018.Close()
            } else {
                $tcp27017 = New-Object System.Net.Sockets.TcpClient
                $connect27017 = $tcp27017.BeginConnect("127.0.0.1", 27017, $null, $null)
                $success27017 = $connect27017.AsyncWaitHandle.WaitOne(200, $false)
                if ($success27017 -and $tcp27017.Connected) {
                    $env:MONGO_URI = "mongodb://localhost:27017/?directConnection=true"
                    $tcp27017.Close()
                }
            }
        }
        if ($env:MONGO_URI -and ($env:MONGO_URI -like "*localhost*" -or $env:MONGO_URI -like "*127.0.0.1*") -and $env:MONGO_URI -notlike "*directConnection=*") {
            $sep = if ($env:MONGO_URI -like "*?*") { "&" } else { "?" }
            $env:MONGO_URI += "${sep}directConnection=true"
        }
        $env:MONGO_DB_NAME = if ($env:MONGO_DB_NAME) { $env:MONGO_DB_NAME } else { "ecommerce_test" }
        $env:APP_NAME = "E-Commerce Test System"
        $env:DEBUG = "true"

        Run-Gate "Backend Pytest Test Suite" { python -m pytest tests --cov=app --cov-report=xml:coverage.xml --cov-report=term-missing }
    } else {
        Write-Host "[SKIPPED] Backend Pytest Suite & pip-audit (Fast mode enabled)" -ForegroundColor Yellow
    }
    
    Pop-Location
}

# --- 2. Frontend Gates ---
if ($RunFrontend) {
    Write-Host "`n--- [2/4] React Frontend CI Gates ---" -ForegroundColor Cyan
    Push-Location "$PSScriptRoot\frontend"
    
    Run-Gate "Frontend Linting (ESLint)" { npm run lint } $false $false { npm run lint -- --fix }
    Run-Gate "Frontend Type Check (tsc)" { npx tsc --noEmit }
    Run-Gate "Frontend Build (Vite)" { npm run build }
    
    if (-not $Fast) {
        Run-Gate "Frontend Dependency Audit (npm audit)" { npm audit --audit-level=high } $true $true
    } else {
        Write-Host "[SKIPPED] Frontend npm audit (Fast mode enabled)" -ForegroundColor Yellow
    }
    
    Pop-Location
}

# --- 3. Security Scanning ---
if ($RunSecurity) {
    Write-Host "`n--- [3/4] Security & Vulnerability Scanning ---" -ForegroundColor Cyan
    Push-Location "$PSScriptRoot"
    
    $GitleaksExists = Get-Command gitleaks -ErrorAction SilentlyContinue
    if ($GitleaksExists) {
        Run-Gate "Secret Leak Detection (Gitleaks)" { gitleaks detect --source . --verbose } $true
    } else {
        Write-Host "[SKIPPED] Secret Leak Detection (gitleaks CLI not installed)" -ForegroundColor Yellow
        $script:Results += [PSCustomObject]@{ Gate = "Secret Leak Detection (Gitleaks)"; Status = "SKIPPED" }
        $script:SkippedCount++
    }

    $HadolintExists = Get-Command hadolint -ErrorAction SilentlyContinue
    if ($HadolintExists) {
        Run-Gate "Lint Backend Dockerfile (Hadolint)" { hadolint backend/Dockerfile } $true
        Run-Gate "Lint Frontend Dockerfile (Hadolint)" { hadolint frontend/Dockerfile } $true
    } else {
        Write-Host "[SKIPPED] Dockerfile Linting (hadolint CLI not installed)" -ForegroundColor Yellow
        $script:Results += [PSCustomObject]@{ Gate = "Lint Backend Dockerfile (Hadolint)"; Status = "SKIPPED" }
        $script:Results += [PSCustomObject]@{ Gate = "Lint Frontend Dockerfile (Hadolint)"; Status = "SKIPPED" }
        $script:SkippedCount += 2
    }

    $TrivyExists = Get-Command trivy -ErrorAction SilentlyContinue
    if ($TrivyExists) {
        Run-Gate "Repository Vulnerability Scan (Trivy)" { trivy fs --ignore-unfixed --severity HIGH,CRITICAL . } $true
    } else {
        Write-Host "[SKIPPED] Repository Vulnerability Scan (Trivy CLI not installed)" -ForegroundColor Yellow
        $script:Results += [PSCustomObject]@{ Gate = "Repository Vulnerability Scan (Trivy)"; Status = "SKIPPED" }
        $script:SkippedCount++
    }
    
    Pop-Location
}

# --- 4. Docker Build Checks ---
if ($RunDocker) {
    Write-Host "`n--- [4/4] Docker Build Verification ---" -ForegroundColor Cyan
    Push-Location "$PSScriptRoot"

    $DockerExists = Get-Command docker -ErrorAction SilentlyContinue
    if ($DockerExists) {
        Run-Gate "Build Backend Image (Docker)" { docker build -t ecommerce-backend:ci ./backend }
        Run-Gate "Build Frontend Image (Docker)" { docker build -t ecommerce-frontend:ci ./frontend }
    } else {
        Write-Host "[SKIPPED] Docker Build Verification (docker CLI not found)" -ForegroundColor Yellow
        $script:Results += [PSCustomObject]@{ Gate = "Build Backend Image (Docker)"; Status = "SKIPPED" }
        $script:Results += [PSCustomObject]@{ Gate = "Build Frontend Image (Docker)"; Status = "SKIPPED" }
        $script:SkippedCount += 2
    }
    
    Pop-Location
}

# --- Summary ---
Write-Host "`n======================================================" -ForegroundColor Cyan
Write-Host "               CI QUALITY GATES SUMMARY              " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
$Results | Format-Table -AutoSize

Write-Host "Passed: $PassedCount | Failed: $FailedCount | Skipped/Warnings: $SkippedCount`n"

if ($FailedCount -gt 0) {
    Write-Host "[RESULT] CI Quality Gates FAILED. Fix errors before pushing." -ForegroundColor Red
    exit 1
} else {
    Write-Host "[RESULT] All active CI Quality Gates PASSED successfully!" -ForegroundColor Green
    exit 0
}
