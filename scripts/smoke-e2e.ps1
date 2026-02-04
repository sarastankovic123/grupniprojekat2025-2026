param(
  [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step([string]$Message) {
  Write-Host "==> $Message"
}

function Invoke-JsonPost(
  [Parameter(Mandatory = $true)][string]$Url,
  [Parameter(Mandatory = $true)][hashtable]$Body,
  [hashtable]$Headers = @{}
) {
  $json = $Body | ConvertTo-Json -Depth 10
  return Invoke-RestMethod -Method Post -Uri $Url -ContentType "application/json" -Body $json -Headers $Headers
}

function Invoke-JsonGet(
  [Parameter(Mandatory = $true)][string]$Url,
  [hashtable]$Headers = @{}
) {
  return Invoke-RestMethod -Method Get -Uri $Url -Headers $Headers
}

function Invoke-MongoJson(
  [Parameter(Mandatory = $true)][string]$Database,
  [Parameter(Mandatory = $true)][string]$Js
) {
  $out = docker exec mongo mongosh --quiet $Database --eval $Js
  $out = ($out | Out-String).Trim()
  if ([string]::IsNullOrWhiteSpace($out) -or $out -eq "null") { return $null }
  return $out | ConvertFrom-Json
}

function Assert-NotNull($Value, [string]$Message) {
  if ($null -eq $Value) { throw $Message }
}

function Get-LatestLogLine(
  [Parameter(Mandatory = $true)][string]$Container,
  [Parameter(Mandatory = $true)][string]$Pattern
) {
  for ($i = 0; $i -lt 20; $i++) {
    $logs = @(cmd /c "docker logs --tail 500 $Container 2>&1")
    $lines = @($logs | Where-Object { $_ -match $Pattern })
    if ($lines.Count -gt 0) { return $lines[-1] }
    Start-Sleep -Milliseconds 250
  }
  return $null
}

function Get-LatestLogLineContains(
  [Parameter(Mandatory = $true)][string]$Container,
  [Parameter(Mandatory = $true)][string]$Needle
) {
  for ($i = 0; $i -lt 20; $i++) {
    $logs = @(cmd /c "docker logs --tail 500 $Container 2>&1")
    $lines = @($logs | Where-Object { $_ -is [string] -and $_.Contains($Needle) })
    if ($lines.Count -gt 0) { return $lines[-1] }
    Start-Sleep -Milliseconds 250
  }
  return $null
}

Write-Step "Checking gateway up"
try {
  $null = Invoke-WebRequest -Uri "$BaseUrl/api/content/artists" -Method Get -UseBasicParsing
} catch {
  throw "Gateway not reachable at $BaseUrl (try: docker compose up -d)"
}

$suffix = (Get-Random -Minimum 10000 -Maximum 99999)
$userEmail = "e2e_user_$suffix@example.com"
$userUsername = "e2euser$suffix"
$userPassword = "UserP@ssw0rd$suffix!"
$userEmailRe = [regex]::Escape($userEmail)

Write-Step "Registering user $userEmail"
$reg = Invoke-JsonPost "$BaseUrl/api/auth/register" @{
  username = $userUsername
  email = $userEmail
  firstName = "E2E"
  lastName = "User"
  password = $userPassword
  confirmPassword = $userPassword
}

Write-Step "Fetching user from Mongo"
$userDoc = Invoke-MongoJson "users_db" "var u=db.users.findOne({email:'$userEmail'},{_id:1,email:1,username:1,role:1,isConfirmed:1}); print(EJSON.stringify(u));"
Assert-NotNull $userDoc "User not found in users_db.users after registration"
$userId = $userDoc._id.'$oid'
Write-Step "User created _id=$userId role=$($userDoc.role) confirmed=$($userDoc.isConfirmed)"

Write-Step "Fetching confirm token from Mongo"
$confirmTokenDoc = Invoke-MongoJson "users_db" "var t=db.email_tokens.findOne({userId:ObjectId('$userId'), token:{`$regex:/^[a-f0-9]{64}$/}},{token:1,expiresAt:1}); print(EJSON.stringify(t));"
Assert-NotNull $confirmTokenDoc "Confirmation token not found in users_db.email_tokens"
$confirmToken = $confirmTokenDoc.token

Write-Step "Confirming email token"
$null = Invoke-JsonGet "$BaseUrl/api/auth/confirm?token=$confirmToken"

$userDoc2 = Invoke-MongoJson "users_db" "var u=db.users.findOne({_id:ObjectId('$userId')},{isConfirmed:1,role:1}); print(EJSON.stringify(u));"
Assert-NotNull $userDoc2 "User disappeared"
if (-not $userDoc2.isConfirmed) { throw "Email confirmation did not set isConfirmed=true" }

Write-Step "Requesting login OTP"
$null = Invoke-JsonPost "$BaseUrl/api/auth/login" @{ email = $userEmail; password = $userPassword }
Start-Sleep -Milliseconds 300

Write-Step "Fetching OTP from Mongo"
$otpDoc = Invoke-MongoJson "users_db" "var t=db.email_tokens.find({userId:ObjectId('$userId'), token:{`$regex:/^[0-9]{6}$/}, expiresAt:{`$gt:new Date()}}).sort({createdAt:-1}).limit(1).next(); print(EJSON.stringify(t));"
Assert-NotNull $otpDoc "OTP not found in users_db.email_tokens"
$otp = $otpDoc.token

Write-Step "Verifying OTP"
$verify = Invoke-JsonPost "$BaseUrl/api/auth/verify-otp" @{ email = $userEmail; otp = $otp }
Assert-NotNull $verify.accessToken "verify-otp response missing accessToken"
Assert-NotNull $verify.refreshToken "verify-otp response missing refreshToken"

Write-Step "Refreshing token (rotation)"
$refresh = Invoke-JsonPost "$BaseUrl/api/auth/refresh" @{ refresh_token = $verify.refreshToken }
Assert-NotNull $refresh.refresh_token "refresh response missing refresh_token"

Write-Step "Forgot password (creates password_reset_tokens doc)"
$null = Invoke-JsonPost "$BaseUrl/api/auth/forgot-password" @{ email = $userEmail }
Start-Sleep -Milliseconds 300

$resetDoc = Invoke-MongoJson "users_db" "var t=db.password_reset_tokens.findOne({userId:ObjectId('$userId')},{tokenHash:1,expiresAt:1,usedAt:1}); print(EJSON.stringify(t));"
Assert-NotNull $resetDoc "password_reset_tokens doc not found for user"

Write-Step "Resetting password using DEV log token"
$resetNeedle = "[DEV PASSWORD RESET] Send reset link to ${userEmail}:"
$resetLine = Get-LatestLogLineContains "users-service" $resetNeedle
Assert-NotNull $resetLine "Could not find password reset link in users-service logs (DEV mode)"
$resetToken = [regex]::Match($resetLine, "token=([a-f0-9]{64})").Groups[1].Value
if ([string]::IsNullOrWhiteSpace($resetToken)) { throw "Failed to parse reset token from logs: $resetLine" }

$newPassword = "NewP@ssw0rd$suffix!"
$null = Invoke-JsonPost "$BaseUrl/api/auth/reset-password" @{ token = $resetToken; newPassword = $newPassword }

$resetDoc2 = Invoke-MongoJson "users_db" "var t=db.password_reset_tokens.findOne({userId:ObjectId('$userId')},{usedAt:1}); print(EJSON.stringify(t));"
Assert-NotNull $resetDoc2 "password_reset_tokens doc missing after reset"
if ($null -eq $resetDoc2.usedAt) { throw "password_reset_tokens.usedAt not set after reset-password" }

Write-Step "Requesting magic link"
$null = Invoke-JsonPost "$BaseUrl/api/auth/magic-link/request" @{ email = $userEmail }
Start-Sleep -Milliseconds 300

$magicDoc = Invoke-MongoJson "users_db" "var t=db.magic_link_tokens.findOne({userId:ObjectId('$userId')},{tokenHash:1,expiresAt:1,usedAt:1}); print(EJSON.stringify(t));"
Assert-NotNull $magicDoc "magic_link_tokens doc not found for user"

Write-Step "Consuming magic link using DEV log token"
$magicNeedle = "[DEV MAGIC LINK] Send magic link to ${userEmail}:"
$magicLine = Get-LatestLogLineContains "users-service" $magicNeedle
Assert-NotNull $magicLine "Could not find magic link in users-service logs (DEV mode)"
$magicToken = [regex]::Match($magicLine, "token=([a-f0-9]{64})").Groups[1].Value
if ([string]::IsNullOrWhiteSpace($magicToken)) { throw "Failed to parse magic token from logs: $magicLine" }

$magicConsume = Invoke-JsonPost "$BaseUrl/api/auth/magic-link/consume" @{ token = $magicToken }
Assert-NotNull $magicConsume.access_token "magic-link/consume response missing access_token"

$magicDoc2 = Invoke-MongoJson "users_db" "var t=db.magic_link_tokens.findOne({userId:ObjectId('$userId')},{usedAt:1}); print(EJSON.stringify(t));"
Assert-NotNull $magicDoc2 "magic_link_tokens doc missing after consume"
if ($null -eq $magicDoc2.usedAt) { throw "magic_link_tokens.usedAt not set after consume" }

Write-Step "Admin: login and create artist/album/song"
$adminEmailLine = Get-Content .env | Where-Object { $_ -match '^BOOTSTRAP_ADMIN_EMAIL=' } | Select-Object -First 1
$adminPasswordLine = Get-Content .env | Where-Object { $_ -match '^BOOTSTRAP_ADMIN_PASSWORD=' } | Select-Object -First 1

$adminEmail = if ($adminEmailLine) { $adminEmailLine.Substring($adminEmailLine.IndexOf('=') + 1).Trim() } else { "" }
$adminPassword = if ($adminPasswordLine) { $adminPasswordLine.Substring($adminPasswordLine.IndexOf('=') + 1).Trim() } else { "" }
if ([string]::IsNullOrWhiteSpace($adminEmail) -or [string]::IsNullOrWhiteSpace($adminPassword)) {
  throw "BOOTSTRAP_ADMIN_EMAIL/BOOTSTRAP_ADMIN_PASSWORD not found in .env"
}

$null = Invoke-JsonPost "$BaseUrl/api/auth/login" @{ email = $adminEmail; password = $adminPassword }
Start-Sleep -Milliseconds 300

$adminDoc = Invoke-MongoJson "users_db" "var u=db.users.findOne({email:'$adminEmail'},{_id:1,role:1}); print(EJSON.stringify(u));"
Assert-NotNull $adminDoc "Admin user not found in users_db.users"
$adminId = $adminDoc._id.'$oid'

$adminOtpDoc = Invoke-MongoJson "users_db" "var t=db.email_tokens.find({userId:ObjectId('$adminId'), token:{`$regex:/^[0-9]{6}$/}, expiresAt:{`$gt:new Date()}}).sort({createdAt:-1}).limit(1).next(); print(EJSON.stringify(t));"
Assert-NotNull $adminOtpDoc "Admin OTP not found"
$adminVerify = Invoke-JsonPost "$BaseUrl/api/auth/verify-otp" @{ email = $adminEmail; otp = $adminOtpDoc.token }
$adminAccess = $adminVerify.accessToken
Assert-NotNull $adminAccess "Admin verify-otp missing accessToken"

$authz = @{ Authorization = "Bearer $adminAccess" }

$artistName = "E2E Artist $suffix"
$null = Invoke-JsonPost "$BaseUrl/api/content/artists" @{ name = $artistName; biography = "bio"; genres = @("rock") } $authz
Start-Sleep -Milliseconds 200

$artistDoc = Invoke-MongoJson "content_db" "var a=db.artists.findOne({name:'$artistName'},{_id:1,name:1}); print(EJSON.stringify(a));"
Assert-NotNull $artistDoc "Artist not found in content_db.artists after create"
$artistId = $artistDoc._id.'$oid'

$album = Invoke-JsonPost "$BaseUrl/api/content/artists/$artistId/albums" @{ title = "E2E Album $suffix"; releaseDate = "2026-01-15"; genres = @("rock") } $authz
Assert-NotNull $album.id "Album create response missing id"
$albumId = if ($album.id -is [string]) { $album.id } else { $album.id.'$oid' }

$song = Invoke-JsonPost "$BaseUrl/api/content/albums/$albumId/songs" @{ title = "E2E Song $suffix"; duration = 180 } $authz
Assert-NotNull $song.id "Song create response missing id"

Write-Step "Checking notifications DB for welcome message"
$notif = Invoke-MongoJson "notifications_db" "var n=db.notifications.findOne({userId:ObjectId('$userId')}); print(EJSON.stringify(n));"
if ($null -eq $notif) {
  Write-Warning "No notification found for new user in notifications_db.notifications (welcome notification may not be sent/received)"
}

Write-Host ""
Write-Host "OK: E2E smoke completed"
Write-Host "User: $userEmail (id=$userId, role=$($userDoc.role))"
Write-Host "Admin: $adminEmail (id=$adminId, role=$($adminDoc.role))"
