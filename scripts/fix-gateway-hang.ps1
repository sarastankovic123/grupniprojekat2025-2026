param(
  [string]$ProjectRoot = ".",
  [string]$PublicApiUrl = "http://localhost:8080/api/content/artists",
  [int]$TimeoutSec = 8,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step([string]$Message) {
  Write-Host "==> $Message"
}

function Test-UrlFast(
  [Parameter(Mandatory = $true)][string]$Url,
  [int]$TimeoutSeconds = 8
) {
  try {
    $null = Invoke-WebRequest -Method Get -Uri $Url -TimeoutSec $TimeoutSeconds -UseBasicParsing
    return $true
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $code = [int]$_.Exception.Response.StatusCode
      # Any HTTP response means request path is alive (even 401/404).
      if ($code -ge 100 -and $code -le 599) { return $true }
    }
    return $false
  }
}

function Test-GatewayDnsToUsers {
  try {
    $result = docker exec api-gateway sh -lc "getent hosts users-service" 2>&1
    return ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace(($result | Out-String)))
  } catch {
    return $false
  }
}

Write-Step "Checking gateway responsiveness: $PublicApiUrl"
$apiOk = Test-UrlFast -Url $PublicApiUrl -TimeoutSeconds $TimeoutSec

Write-Step "Checking Docker DNS: api-gateway -> users-service"
$dnsOk = Test-GatewayDnsToUsers

if ($apiOk -and $dnsOk) {
  Write-Host "OK: Gateway and service DNS look healthy. No action needed."
  exit 0
}

Write-Warning "Detected unhealthy state (apiOk=$apiOk, dnsOk=$dnsOk)."
Write-Step "Recreating users-service, api-gateway, nginx"

$composeCmd = "docker compose up -d --force-recreate --no-deps users-service api-gateway nginx"
if ($DryRun) {
  Write-Host "[DryRun] $composeCmd"
  exit 0
}

Push-Location $ProjectRoot
try {
  Invoke-Expression $composeCmd
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose recreate failed"
  }
} finally {
  Pop-Location
}

Write-Step "Waiting for services to settle"
Start-Sleep -Seconds 4

$apiOkAfter = Test-UrlFast -Url $PublicApiUrl -TimeoutSeconds $TimeoutSec
$dnsOkAfter = Test-GatewayDnsToUsers

if ($apiOkAfter -and $dnsOkAfter) {
  Write-Host "OK: Recovery completed (apiOk=$apiOkAfter, dnsOk=$dnsOkAfter)."
  exit 0
}

Write-Error "Recovery incomplete (apiOk=$apiOkAfter, dnsOk=$dnsOkAfter). Check: docker compose logs --tail=120 users-service api-gateway nginx"
exit 1
