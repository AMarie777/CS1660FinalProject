# =============================================
# build-lambdas.ps1  (run this from inside backend/)
#
# Packages all Lambda functions in ./lambdas/
# into ZIP files including:
#   - index.js
#   - db/
#
# Output goes into: ./dist/
# =============================================

$ErrorActionPreference = "Stop"

# ROOT is the DIRECTORY where the script lives
$backendPath = Split-Path -Parent $MyInvocation.MyCommand.Path

$lambdasPath = Join-Path $backendPath "lambdas"
$dbPath = Join-Path $backendPath "db"
$distPath = Join-Path $backendPath "dist"

# Make dist/ if needed
if (!(Test-Path $distPath)) {
    New-Item -ItemType Directory -Path $distPath | Out-Null
}

Write-Host "Packaging Lambdas from: $lambdasPath"
Write-Host ""

# Loop through each lambda folder
Get-ChildItem -Path $lambdasPath -Directory | ForEach-Object {
    $lambdaName = $_.Name
    $lambdaFolder = $_.FullName

    Write-Host "Packaging $lambdaName ..."

    # Temp staging folder inside lambda
    $temp = Join-Path $lambdaFolder "package"

    if (Test-Path $temp) {
        Remove-Item $temp -Recurse -Force
    }

    New-Item -ItemType Directory -Path $temp | Out-Null

    # Copy lambda index.js
    Copy-Item -Path (Join-Path $lambdaFolder "index.js") -Destination $temp

    # Copy shared db folder
    Copy-Item -Recurse -Path $dbPath -Destination (Join-Path $temp "db")

    # Create ZIP inside dist/
    $zipPath = Join-Path $distPath "$lambdaName.zip"

    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }

    Compress-Archive -Path "$temp\*" -DestinationPath $zipPath

    Write-Host "Created: $zipPath"
}

Write-Host ""
Write-Host "ALL LAMBDAS PACKAGED SUCCESSFULLY!"
Write-Host "Your ZIP files are here:  backend/dist/"
