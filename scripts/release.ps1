# BroadcastKit Release Script v3.0
# Automatische Changelog-Generierung aus geaenderten Dateien
# Usage: .\scripts\release.ps1 -Type minor

param(
    [Parameter(Mandatory=$false)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("major", "minor", "patch", "beta")]
    [string]$Type = "patch",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Write-Step($message) {
    Write-Host "[->] " -NoNewline -ForegroundColor Cyan
    Write-Host $message -ForegroundColor White
}

function Write-Success($message) {
    Write-Host "[OK] " -NoNewline -ForegroundColor Green
    Write-Host $message
}

# Banner
Write-Host ""
Write-Host "  ____                      _               _   _  ___ _   " -ForegroundColor Magenta
Write-Host " | __ ) _ __ ___   __ _  __| | ___ __ _ ___| |_| |/ (_) |_ " -ForegroundColor Magenta
Write-Host " |  _ \| '__/ _ \ / _' |/ _' |/ __/ _' / __| __| ' /| | __|" -ForegroundColor Magenta
Write-Host " | |_) | | | (_) | (_| | (_| | (_| (_| \__ \ |_| . \| | |_" -ForegroundColor Magenta
Write-Host " |____/|_|  \___/ \__,_|\__,_|\___\__,_|___/\__|_|\_\_|\__|" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Release Script v3.0 - Auto Changelog" -ForegroundColor DarkGray
Write-Host ""

# Get current version
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$currentVersion = $packageJson.version
Write-Host "Current version: " -NoNewline
Write-Host $currentVersion -ForegroundColor Yellow

# Calculate new version
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
            if ($currentVersion -match "beta\.(\d+)") {
                $betaNum = [int]$Matches[1] + 1
            } else {
                $betaNum = 1
            }
            $Version = "$major.$minor.$patch-beta.$betaNum"
        }
    }
    if ($Type -ne "beta") { $Version = "$major.$minor.$patch" }
}

$isPrerelease = $Version -match "beta|alpha|rc"
$tagName = "v$Version"

Write-Host "New version: " -NoNewline
Write-Host $Version -ForegroundColor Green
Write-Host "Tag: " -NoNewline
Write-Host $tagName -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "`n[DRY RUN MODE]" -ForegroundColor Yellow
}

# Analyze changed files and generate changelog
Write-Step "Analysiere Aenderungen..."

$lastTag = git describe --tags --abbrev=0 2>$null
$features = @()
$fixes = @()
$improvements = @()

# Get changed files: committed since last tag + staged + unstaged
$changedFiles = @()

if ($lastTag) {
    # Files changed in commits since last tag
    $committedFiles = git diff --name-only "$lastTag..HEAD" 2>$null
    if ($committedFiles) { $changedFiles += $committedFiles }
}

# Also include staged and unstaged changes (current work)
$stagedFiles = git diff --cached --name-only 2>$null
$unstagedFiles = git diff --name-only 2>$null
if ($stagedFiles) { $changedFiles += $stagedFiles }
if ($unstagedFiles) { $changedFiles += $unstagedFiles }

# Remove duplicates
$changedFiles = $changedFiles | Select-Object -Unique

Write-Host "Gefundene geaenderte Dateien: $($changedFiles.Count)" -ForegroundColor DarkGray

# Analyze each changed file and categorize
foreach ($file in $changedFiles) {
    if ([string]::IsNullOrWhiteSpace($file)) { continue }
    
    # New overlay files = Feature
    if ($file -match "overlays/scene-.*\.html$") {
        $sceneName = [regex]::Match($file, "scene-(.+)\.html").Groups[1].Value
        $sceneNames = @{
            "starting" = "Starting Soon"
            "brb" = "Be Right Back"
            "ending" = "Stream Ending"
            "technical" = "Technical Difficulties"
        }
        if ($sceneNames.ContainsKey($sceneName)) {
            $entry = "**Stream Scene: $($sceneNames[$sceneName])** - Neues Fullscreen Overlay"
            if ($features -notcontains "- $entry") { $features += "- $entry" }
        }
    }
    elseif ($file -match "overlays/.*\.html$" -and $file -notmatch "scene-") {
        # Check if it's a modification (responsive, fix, etc) by looking at diff
        $diffContent = git diff "$lastTag..HEAD" -- $file 2>$null
        if ($diffContent -match "clamp\(|vw|vh|100vw|100vh") {
            $overlayName = [regex]::Match($file, "overlays/(.+)\.html").Groups[1].Value
            $entry = "**$overlayName Overlay** - Responsive Design fuer alle Aufloesungen"
            if ($improvements -notcontains "- $entry") { $improvements += "- $entry" }
        }
        if ($diffContent -match "classList\.add\('visible'\)|\.visible") {
            $overlayName = [regex]::Match($file, "overlays/(.+)\.html").Groups[1].Value
            $entry = "**$overlayName** - Wird jetzt standardmaessig angezeigt"
            if ($fixes -notcontains "- $entry") { $fixes += "- $entry" }
        }
        if ($diffContent -match "fetch\('/api/config'\)") {
            $overlayName = [regex]::Match($file, "overlays/(.+)\.html").Groups[1].Value
            $entry = "**$overlayName** - Laed Einstellungen automatisch"
            if ($improvements -notcontains "- $entry") { $improvements += "- $entry" }
        }
    }
    
    # New component files = Feature
    elseif ($file -match "components/.*Control\.tsx$") {
        $componentName = [regex]::Match($file, "components/(.+)Control\.tsx").Groups[1].Value
        # Check if new file
        $existsInLastTag = git show "${lastTag}:$file" 2>$null
        if (-not $existsInLastTag) {
            $entry = "**$componentName** - Neues Control Panel im Dashboard"
            if ($features -notcontains "- $entry") { $features += "- $entry" }
        }
    }
    
    # Store changes = might be fix or improvement
    elseif ($file -match "store\.ts$") {
        $diffContent = git diff "$lastTag..HEAD" -- $file 2>$null
        if ($diffContent -match "isRunning:\s*true") {
            $entry = "Social Widget startet jetzt automatisch"
            if ($fixes -notcontains "- $entry") { $fixes += "- $entry" }
        }
        if ($diffContent -match "interface.*Scene|streamScenes") {
            $entry = "**Stream Scenes Config** - Neue Konfigurationsoptionen"
            if ($features -notcontains "- $entry") { $features += "- $entry" }
        }
    }
    
    # Config files
    elseif ($file -match "postcss\.config") {
        $entry = "PostCSS Konfiguration hinzugefuegt/repariert"
        if ($fixes -notcontains "- $entry") { $fixes += "- $entry" }
    }
    
    # Release script
    elseif ($file -match "release\.ps1$") {
        $entry = "Release Script mit automatischer Changelog-Generierung"
        if ($improvements -notcontains "- $entry") { $improvements += "- $entry" }
    }
    
    # Server changes
    elseif ($file -match "server\.ts$") {
        $diffContent = git diff "$lastTag..HEAD" -- $file 2>$null
        if ($diffContent -match "scene-") {
            $entry = "Server-Routes fuer Stream Scenes"
            if ($features -notcontains "- $entry") { $features += "- $entry" }
        }
    }
}

# Show detected changes
Write-Host ""
if ($features.Count -gt 0) {
    Write-Host "Erkannte Features: $($features.Count)" -ForegroundColor Green
}
if ($fixes.Count -gt 0) {
    Write-Host "Erkannte Fixes: $($fixes.Count)" -ForegroundColor Red
}
if ($improvements.Count -gt 0) {
    Write-Host "Erkannte Verbesserungen: $($improvements.Count)" -ForegroundColor Yellow
}

# Confirm
Write-Host ""
$confirm = Read-Host "Continue with release? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Aborted." -ForegroundColor Red
    exit 1
}

# Step 1: Update package.json
Write-Step "Updating package.json..."
if (-not $DryRun) {
    $packageContent = Get-Content "package.json" -Raw
    $packageContent = $packageContent -replace '"version":\s*"[^"]*"', "`"version`": `"$Version`""
    [System.IO.File]::WriteAllText("$PWD\package.json", $packageContent, [System.Text.UTF8Encoding]::new($false))
    Write-Success "package.json updated to $Version"
}

# Step 2: Update license.txt
Write-Step "Updating license.txt..."
if (-not $DryRun) {
    $licenseContent = Get-Content "build/license.txt" -Raw
    $licenseContent = $licenseContent -replace "BETA v[\d\.]+-?beta\.?\d*", "BETA v$Version"
    $licenseContent | Set-Content "build/license.txt" -Encoding ASCII -NoNewline
    Write-Success "license.txt updated"
}

# Step 3: Build
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

# Step 5: Find installer
$installerPath = Get-ChildItem "installer" -Filter "*.exe" | Where-Object { $_.Name -match "Setup" } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $installerPath) { throw "Installer not found!" }
Write-Success "Found: $($installerPath.Name)"

# Step 6: Git commit
Write-Step "Committing changes..."
if (-not $DryRun) {
    git add -A
    git commit -m "chore: release v$Version"
    Write-Success "Changes committed"
}

# Step 7: Create tag
Write-Step "Creating git tag..."
if (-not $DryRun) {
    git tag -a $tagName -m "BroadcastKit $tagName"
    Write-Success "Tag $tagName created"
}

# Step 8: Push
Write-Step "Pushing to GitHub..."
if (-not $DryRun) {
    git push origin main
    git push origin $tagName
    Write-Success "Pushed to GitHub"
}

# Step 9: Build release notes
Write-Step "Building release notes..."

$notesBuilder = @()
$notesBuilder += "# BroadcastKit $tagName"
$notesBuilder += ""
$notesBuilder += "Professionelle Stream Overlays fuer OBS Studio"
$notesBuilder += ""

if ($features.Count -gt 0) {
    $notesBuilder += "## :sparkles: Neue Features"
    $notesBuilder += ""
    $notesBuilder += $features
    $notesBuilder += ""
}

if ($fixes.Count -gt 0) {
    $notesBuilder += "## :bug: Bugfixes"
    $notesBuilder += ""
    $notesBuilder += $fixes
    $notesBuilder += ""
}

if ($improvements.Count -gt 0) {
    $notesBuilder += "## :wrench: Verbesserungen"
    $notesBuilder += ""
    $notesBuilder += $improvements
    $notesBuilder += ""
}

# Always include feature overview
$notesBuilder += "## :package: Alle Features"
$notesBuilder += ""
$notesBuilder += "- **Lower Third Overlay** - 3 Styles: Clean Pro, Broadcast News, Esports HUD"
$notesBuilder += "- **Now Playing Widget** - Automatische Spielerkennung via RAWG API"
$notesBuilder += "- **Social Media Widget** - Rotierende Social Links"
$notesBuilder += "- **Stream Scenes** - Starting Soon, BRB, Ending, Technical Difficulties"
$notesBuilder += "- **OBS Integration** - Auto-Connect und Echtzeit-Steuerung"
$notesBuilder += ""

# Installation
$notesBuilder += "## :cd: Installation"
$notesBuilder += ""
$notesBuilder += "1. ``BroadcastKit Setup $Version.exe`` herunterladen"
$notesBuilder += "2. Installer ausfuehren"
$notesBuilder += "3. Browser Sources in OBS hinzufuegen"
$notesBuilder += ""
$notesBuilder += "| Overlay | URL |"
$notesBuilder += "|---------|-----|"
$notesBuilder += "| Lower Third | ``http://localhost:3000/overlay/lower-third`` |"
$notesBuilder += "| Now Playing | ``http://localhost:3000/overlay/now-playing`` |"
$notesBuilder += "| Social Widget | ``http://localhost:3000/overlay/social-widget`` |"
$notesBuilder += "| Starting Soon | ``http://localhost:3000/overlay/scene-starting`` |"
$notesBuilder += "| Be Right Back | ``http://localhost:3000/overlay/scene-brb`` |"
$notesBuilder += "| Stream Ending | ``http://localhost:3000/overlay/scene-ending`` |"
$notesBuilder += "| Tech. Difficulties | ``http://localhost:3000/overlay/scene-technical`` |"
$notesBuilder += ""

$notesBuilder += "## :computer: Systemanforderungen"
$notesBuilder += ""
$notesBuilder += "- Windows 10/11 64-bit"
$notesBuilder += "- OBS Studio mit WebSocket Plugin (v5.x)"

$ReleaseNotes = $notesBuilder -join "`n"

# Preview in dry run
if ($DryRun) {
    Write-Host "`n--- RELEASE NOTES PREVIEW ---" -ForegroundColor Yellow
    Write-Host $ReleaseNotes
    Write-Host "--- END PREVIEW ---`n" -ForegroundColor Yellow
}

# Step 10: Create GitHub release
Write-Step "Creating GitHub release..."

if (-not $DryRun) {
    $releaseNotesFile = "release-notes-temp.md"
    $ReleaseNotes | Out-File -FilePath $releaseNotesFile -Encoding UTF8
    
    $prereleaseArg = ""
    if ($isPrerelease) { $prereleaseArg = "--prerelease" }
    
    gh release create $tagName --title "BroadcastKit $tagName" --notes-file "$releaseNotesFile" $prereleaseArg "$($installerPath.FullName)"
    
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
