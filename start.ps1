param(
    [switch]$Install
)

$ErrorActionPreference = 'Stop'
$workspaceRoot = $PSScriptRoot
$backendRoot = Join-Path $workspaceRoot 'backend'
$frontendRoot = Join-Path $workspaceRoot 'frontend'
$pythonExe = Join-Path $backendRoot '.venv\Scripts\python.exe'
$requirements = Join-Path $backendRoot 'requirements.txt'

function Test-PeoplePulseEndpoint {
    param([string]$Url)

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

function Wait-ForEndpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$Attempts = 40
    )

    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        if (Test-PeoplePulseEndpoint -Url $Url) {
            Write-Host "[ready] $Name" -ForegroundColor Green
            return
        }
        Start-Sleep -Milliseconds 500
    }

    throw "$Name did not become ready. Check whether its configured port is already used by another application."
}

Write-Host 'Starting PeoplePulse...' -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $pythonExe)) {
    Write-Host '[setup] Creating the backend virtual environment...'
    & python -m venv (Join-Path $backendRoot '.venv')
}

if ($Install) {
    Write-Host '[setup] Installing backend dependencies...'
    & $pythonExe -m pip install -r $requirements
}

if (Test-PeoplePulseEndpoint -Url 'http://127.0.0.1:8000/api/health') {
    Write-Host '[ready] Backend is already running; no duplicate process started.' -ForegroundColor Green
}
else {
    Write-Host '[start] FastAPI backend on port 8000...'
    Start-Process -FilePath $pythonExe `
        -ArgumentList '-m', 'uvicorn', 'app.main:app', '--reload', '--host', '127.0.0.1', '--port', '8000' `
        -WorkingDirectory $backendRoot `
        -WindowStyle Hidden
    Wait-ForEndpoint -Name 'Backend' -Url 'http://127.0.0.1:8000/api/health'
}

if (-not (Test-Path -LiteralPath (Join-Path $frontendRoot 'node_modules'))) {
    Write-Host '[setup] Installing frontend dependencies...'
    & npm.cmd --prefix $frontendRoot install
}

if (Test-PeoplePulseEndpoint -Url 'http://localhost:5173/api/health') {
    Write-Host '[ready] Frontend is already running; no duplicate process started.' -ForegroundColor Green
}
else {
    Write-Host '[start] React frontend on port 5173...'
    Start-Process -FilePath 'npm.cmd' `
        -ArgumentList 'run', 'dev', '--', '--host', 'localhost', '--port', '5173', '--strictPort' `
        -WorkingDirectory $frontendRoot `
        -WindowStyle Hidden
    Wait-ForEndpoint -Name 'Frontend proxy' -Url 'http://localhost:5173/api/health'
}

Write-Host ''
Write-Host 'PeoplePulse is operational:' -ForegroundColor Cyan
Write-Host '  App:     http://localhost:5173'
Write-Host '  API:     http://127.0.0.1:8000/docs'
Write-Host '  Health:  http://127.0.0.1:8000/api/health'
