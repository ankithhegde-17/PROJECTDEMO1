param(
    [switch]$Install
)

$rootLauncher = Join-Path (Split-Path -Parent $PSScriptRoot) 'start.ps1'

if (-not (Test-Path -LiteralPath $rootLauncher)) {
    throw "PeoplePulse launcher was not found at: $rootLauncher"
}

if ($Install) {
    & $rootLauncher -Install
}
else {
    & $rootLauncher
}
