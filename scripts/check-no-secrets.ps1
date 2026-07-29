$ErrorActionPreference = "Stop"

$tracked = git ls-files

if ($tracked -contains ".env") {
  Write-Error ".env is tracked. Remove it before committing."
}

$secretPatterns = @(
  "OPENROUTER_API_KEY=\S+",
  "sk-or-v1-[A-Za-z0-9_-]+",
  "JWT_SECRET=(?!replace-with-development-secret)\S+"
)

$filesToScan = $tracked | Where-Object {
  $_ -notmatch "pnpm-lock.yaml" -and
  $_ -ne "scripts/check-no-secrets.ps1" -and
  $_ -notmatch "node_modules" -and
  $_ -notmatch "\.git/"
}

foreach ($file in $filesToScan) {
  if (-not (Test-Path -LiteralPath $file)) {
    continue
  }

  $content = Get-Content -Raw -LiteralPath $file
  foreach ($pattern in $secretPatterns) {
    if ($content -match $pattern) {
      Write-Error "Potential secret found in $file"
    }
  }
}

Write-Host "No obvious committed secrets found."
