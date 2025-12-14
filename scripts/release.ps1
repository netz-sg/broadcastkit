# BroadcastKit Release Script
# Usage: .\scripts\release.ps1 -Version "1.1.0" -Type "minor"
# Types: major, minor, patch, beta

param(
    [Parameter(Mandatory=$false)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("major", "minor", "patch", "beta")]
    [string]$Type = "patch",
    
    [Parameter(Mandatory=$false)]
    [string]$ReleaseNotes,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) { Write-Output $args }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Step($message) {
    Write-Host "`n[$([char]0x2192)] " -NoNewline -ForegroundColor Cyan
    Write-Host $message -ForegroundColor White
}

function Write-Success($message) {
    Write-Host "[OK] " -NoNewline -ForegroundColor Green
    Write-Host $message
}

function Write-Error($message) {
    Write-Host "[X] " -NoNewline -ForegroundColor Red
    Write-Host $message
}

# Banner
Write-Host ""
Write-Host "  ____                      _               _   _  ___ _   " -ForegroundColor Magenta
Write-Host " | __ ) _ __ ___   __ _  __| | ___ __ _ ___| |_| |/ (_) |_ " -ForegroundColor Magenta
Write-Host " |  _ \| '__/ _ \ / _`` |/ _`` |/ __/ _`` / __| __| ' /| | __|" -ForegroundColor Magenta
Write-Host " | |_) | | | (_) | (_| | (_| | (_| (_| \__ \ |_| . \| | |_ " -ForegroundColor Magenta
Write-Host " |____/|_|  \___/ \__,_|\__,_|\___\__,_|___/\__|_|\_\_|\__|" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Release Script v1.0" -ForegroundColor DarkGray
Write-Host ""

# Get current version from package.json
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$currentVersion = $packageJson.version
Write-Host "Current version: " -NoNewline
Write-Host $currentVersion -ForegroundColor Yellow

# Calculate new version if not provided
if (-not $Version) {
    $versionParts = $currentVersion -replace "-beta.*", "" -split "\."
    $major = [int]$versionParts[0]
    $minor = [int]$versionParts[1]
    $patch = [int]$versionParts[2]
    
    switch ($Type) {
        "major" { $major++; $minor = 0; $patch = 0 }
        "minor" { $minor++; $patch = 0 }
        "patch" { $patch++ }
        "beta" { 
            # Extract beta number if exists
            if ($currentVersion -match "beta\.(\d+)") {
                $betaNum = [int]$Matches[1] + 1
            } else {
                $betaNum = 1
            }
            $Version = "$major.$minor.$patch-beta.$betaNum"
        }
    }
    
    if ($Type -ne "beta") {
        $Version = "$major.$minor.$patch"
    }
}

$isPrerelease = $Version -match "beta|alpha|rc"
$tagName = "v$Version"

Write-Host "New version: " -NoNewline
Write-Host $Version -ForegroundColor Green
Write-Host "Tag: " -NoNewline
Write-Host $tagName -ForegroundColor Cyan
Write-Host "Pre-release: " -NoNewline
Write-Host $isPrerelease -ForegroundColor $(if ($isPrerelease) { "Yellow" } else { "Green" })

if ($DryRun) {
    Write-Host "`n[DRY RUN MODE - No changes will be made]" -ForegroundColor Yellow
}

# Confirm
Write-Host ""
$confirm = Read-Host "Continue with release? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Aborted." -ForegroundColor Red
    exit 1
}

# Step 1: Update package.json version
Write-Step "Updating package.json version..."
if (-not $DryRun) {
    # Read original file content to preserve formatting
    $packageContent = Get-Content "package.json" -Raw
    # Replace version using regex to preserve original formatting
    $packageContent = $packageContent -replace '"version":\s*"[^"]*"', "`"version`": `"$Version`""
    # Write back with UTF8 encoding without BOM
    [System.IO.File]::WriteAllText("$PWD\package.json", $packageContent, [System.Text.UTF8Encoding]::new($false))
    Write-Success "package.json updated to $Version"
}

# Step 2: Update license.txt version
Write-Step "Updating license.txt..."
if (-not $DryRun) {
    $licenseContent = Get-Content "build/license.txt" -Raw
    $licenseContent = $licenseContent -replace "BETA v[\d\.]+-?beta\.?\d*", "BETA v$Version"
    $licenseContent | Set-Content "build/license.txt" -Encoding ASCII -NoNewline
    Write-Success "license.txt updated"
}

# Step 3: Build the project
Write-Step "Building project..."
if (-not $DryRun) {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    Write-Success "Build completed"
}

# Step 4: Create installer
Write-Step "Creating installer..."
if (-not $DryRun) {
    npm run dist:installer
    if ($LASTEXITCODE -ne 0) { throw "Installer creation failed" }
    Write-Success "Installer created"
}

# Step 5: Find installer file
$installerPath = Get-ChildItem "installer" -Filter "*.exe" | Where-Object { $_.Name -match "Setup" } | Select-Object -First 1
if (-not $installerPath) {
    throw "Installer file not found!"
}
Write-Success "Found installer: $($installerPath.Name)"

# Step 6: Git commit
Write-Step "Committing changes..."
if (-not $DryRun) {
    git add -A
    git commit -m "chore: release v$Version"
    Write-Success "Changes committed"
}

# Step 7: Create git tag
Write-Step "Creating git tag..."
if (-not $DryRun) {
    git tag -a $tagName -m "BroadcastKit $tagName"
    Write-Success "Tag $tagName created"
}

# Step 8: Push to GitHub
Write-Step "Pushing to GitHub..."
if (-not $DryRun) {
    git push origin main
    git push origin $tagName
    Write-Success "Pushed to GitHub"
}

# Step 9: Generate release notes if not provided
if (-not $ReleaseNotes) {
    Write-Step "Generating release notes..."
    
    # Get commits since last tag
    $lastTag = git describe --tags --abbrev=0 HEAD^ 2>$null
    if ($lastTag) {
        $commits = git log "$lastTag..HEAD" --pretty=format:"- %s" --no-merges
    } else {
        $commits = "- Initial release"
    }
    
    $ReleaseNotes = @"
# BroadcastKit $tagName

Professionelle Stream Overlays fuer OBS Studio

## What's New

$commits

## Features

- **Lower Third Overlay** - 3 Styles: Clean Pro, Broadcast News, Esports HUD
- **Now Playing Widget** - Automatische Spielerkennung via RAWG API
- **Social Media Widget** - Rotierende Social Links (Twitch, YouTube, TikTok, Instagram, Twitter, Discord)
- **OBS Integration** - Auto-Connect und Echtzeit-Steuerung

## Installation

1. ``BroadcastKit Setup $Version.exe`` herunterladen
2. Installer ausfuehren
3. OBS Studio oeffnen
4. Browser Sources hinzufuegen:
   - Lower Third: ``http://localhost:3000/overlay/lower-third``
   - Now Playing: ``http://localhost:3000/overlay/now-playing``
   - Social Widget: ``http://localhost:3000/overlay/social-widget``

## System Requirements

- Windows 10/11 (64-bit)
- OBS Studio mit WebSocket Plugin (v5.x)
- Internetverbindung fuer Spielerkennung (RAWG API)
"@
}

# Step 10: Create GitHub release
Write-Step "Creating GitHub release..."
$prereleaseFlag = if ($isPrerelease) { "--prerelease" } else { "" }

if (-not $DryRun) {
    $releaseNotesFile = "release-notes-temp.md"
    $ReleaseNotes | Out-File -FilePath $releaseNotesFile -Encoding UTF8
    
    $ghCommand = "gh release create $tagName --title `"BroadcastKit $tagName`" --notes-file `"$releaseNotesFile`" $prereleaseFlag `"$($installerPath.FullName)`""
    Invoke-Expression $ghCommand
    
    Remove-Item $releaseNotesFile -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -ne 0) { throw "GitHub release creation failed" }
    Write-Success "GitHub release created"
}

# Done!
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Release $tagName completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Release URL: " -NoNewline
Write-Host "https://github.com/netz-sg/broadcastkit/releases/tag/$tagName" -ForegroundColor Cyan
Write-Host ""
