# BroadcastKit Release Manager v5.0
# Interaktives Menue fuer Git Push und Release
# Usage: .\scripts\release.ps1

$ErrorActionPreference = "Stop"

function Write-Step($message) {
    Write-Host "[->] " -NoNewline -ForegroundColor Cyan
    Write-Host $message -ForegroundColor White
}

function Write-Success($message) {
    Write-Host "[OK] " -NoNewline -ForegroundColor Green
    Write-Host $message
}

function Write-Error($message) {
    Write-Host "[!!] " -NoNewline -ForegroundColor Red
    Write-Host $message -ForegroundColor Red
}

function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ____                      _               _   _  ___ _   " -ForegroundColor Magenta
    Write-Host " | __ ) _ __ ___   __ _  __| | ___ __ _ ___| |_| |/ (_) |_ " -ForegroundColor Magenta
    Write-Host " |  _ \| '__/ _ \ / _' |/ _' |/ __/ _' / __| __| ' /| | __|" -ForegroundColor Magenta
    Write-Host " | |_) | | | (_) | (_| | (_| | (_| (_| \__ \ |_| . \| | |_" -ForegroundColor Magenta
    Write-Host " |____/|_|  \___/ \__,_|\__,_|\___\__,_|___/\__|_|\_\_|\__|" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "  Release Manager v5.0" -ForegroundColor DarkGray
    Write-Host ""
}

function Get-CurrentVersion {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    return $packageJson.version
}

function Get-NewVersion($currentVersion, $type) {
    $versionParts = $currentVersion -replace "-beta.*", "" -split "\."
    $major = [int]$versionParts[0]
    $minor = [int]$versionParts[1]
    $patch = [int]$versionParts[2]
    
    switch ($type) {
        "major" { $major++; $minor = 0; $patch = 0 }
        "minor" { $minor++; $patch = 0 }
        "patch" { $patch++ }
    }
    return "$major.$minor.$patch"
}

function Show-MainMenu {
    $currentVersion = Get-CurrentVersion
    
    Write-Host "  Aktuelle Version: " -NoNewline
    Write-Host "v$currentVersion" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  ========================================" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Was moechtest du tun?" -ForegroundColor White
    Write-Host ""
    Write-Host "  [1] " -NoNewline -ForegroundColor Cyan
    Write-Host "Nur Push (Commit + Push ohne Release)"
    Write-Host "  [2] " -NoNewline -ForegroundColor Green
    Write-Host "Release erstellen (Build + Installer + GitHub Release)"
    Write-Host ""
    Write-Host "  [Q] " -NoNewline -ForegroundColor Red
    Write-Host "Beenden"
    Write-Host ""
    
    $choice = Read-Host "  Auswahl"
    return $choice
}

function Show-ReleaseTypeMenu {
    $currentVersion = Get-CurrentVersion
    
    Write-Host ""
    Write-Host "  ========================================" -ForegroundColor DarkGray
    Write-Host "  RELEASE TYP WAEHLEN" -ForegroundColor Cyan
    Write-Host "  ========================================" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Aktuelle Version: v$currentVersion" -ForegroundColor Yellow
    Write-Host ""
    
    $patchVersion = Get-NewVersion $currentVersion "patch"
    $minorVersion = Get-NewVersion $currentVersion "minor"
    $majorVersion = Get-NewVersion $currentVersion "major"
    
    Write-Host "  [1] " -NoNewline -ForegroundColor Green
    Write-Host "PATCH  " -NoNewline -ForegroundColor Green
    Write-Host "v$patchVersion" -NoNewline -ForegroundColor White
    Write-Host "  - Bug Fixes, kleine Aenderungen" -ForegroundColor DarkGray
    
    Write-Host "  [2] " -NoNewline -ForegroundColor Yellow
    Write-Host "MINOR  " -NoNewline -ForegroundColor Yellow
    Write-Host "v$minorVersion" -NoNewline -ForegroundColor White
    Write-Host "  - Neue Features, Verbesserungen" -ForegroundColor DarkGray
    
    Write-Host "  [3] " -NoNewline -ForegroundColor Red
    Write-Host "MAJOR  " -NoNewline -ForegroundColor Red
    Write-Host "v$majorVersion" -NoNewline -ForegroundColor White
    Write-Host "  - Breaking Changes, grosse Updates" -ForegroundColor DarkGray
    
    Write-Host ""
    Write-Host "  [0] " -NoNewline -ForegroundColor DarkGray
    Write-Host "Zurueck"
    Write-Host ""
    
    $choice = Read-Host "  Auswahl"
    
    switch ($choice) {
        "1" { return "patch" }
        "2" { return "minor" }
        "3" { return "major" }
        "0" { return $null }
        default { return $null }
    }
}

function Do-Push {
    Write-Host ""
    Write-Host "  ========================================" -ForegroundColor DarkGray
    Write-Host "  GIT PUSH" -ForegroundColor Cyan
    Write-Host "  ========================================" -ForegroundColor DarkGray
    Write-Host ""
    
    # Show status
    Write-Step "Git Status..."
    $status = git status --short
    if ($status) {
        Write-Host $status -ForegroundColor Gray
    } else {
        Write-Host "  Keine Aenderungen." -ForegroundColor DarkGray
    }
    
    Write-Host ""
    $commitMsg = Read-Host "  Commit Message (leer = abbrechen)"
    
    if ([string]::IsNullOrWhiteSpace($commitMsg)) {
        Write-Error "Abgebrochen."
        return
    }
    
    Write-Step "Staging all changes..."
    git add -A
    
    Write-Step "Committing..."
    git commit -m $commitMsg
    
    Write-Step "Pushing to GitHub..."
    git push origin main
    
    Write-Success "Push erfolgreich!"
    Write-Host ""
    Read-Host "  Druecke ENTER um fortzufahren"
}

function Do-Release($type) {
    $currentVersion = Get-CurrentVersion
    $newVersion = Get-NewVersion $currentVersion $type
    $tagName = "v$newVersion"
    
    Write-Host ""
    Write-Host "  ========================================" -ForegroundColor DarkGray
    Write-Host "  RELEASE $tagName" -ForegroundColor Green
    Write-Host "  ========================================" -ForegroundColor DarkGray
    Write-Host ""
    
    # Release Notes eingeben
    Write-Host "  RELEASE NOTES EINGEBEN" -ForegroundColor Cyan
    Write-Host "  (Leere Zeile = Kategorie beenden)" -ForegroundColor DarkGray
    Write-Host ""
    
    # Features
    Write-Host "  NEUE FEATURES:" -ForegroundColor Green
    $features = @()
    while ($true) {
        $input = Read-Host "    +"
        if ([string]::IsNullOrWhiteSpace($input)) { break }
        $features += "- $input"
    }
    
    # Fixes
    Write-Host ""
    Write-Host "  BUG FIXES:" -ForegroundColor Red
    $fixes = @()
    while ($true) {
        $input = Read-Host "    +"
        if ([string]::IsNullOrWhiteSpace($input)) { break }
        $fixes += "- $input"
    }
    
    # Improvements
    Write-Host ""
    Write-Host "  VERBESSERUNGEN:" -ForegroundColor Yellow
    $improvements = @()
    while ($true) {
        $input = Read-Host "    +"
        if ([string]::IsNullOrWhiteSpace($input)) { break }
        $improvements += "- $input"
    }
    
    # Zusammenfassung
    Write-Host ""
    Write-Host "  ----------------------------------------" -ForegroundColor DarkGray
    Write-Host "  ZUSAMMENFASSUNG: $tagName" -ForegroundColor Cyan
    Write-Host "  ----------------------------------------" -ForegroundColor DarkGray
    if ($features.Count -gt 0) {
        Write-Host "  Features: $($features.Count)" -ForegroundColor Green
    }
    if ($fixes.Count -gt 0) {
        Write-Host "  Fixes: $($fixes.Count)" -ForegroundColor Red
    }
    if ($improvements.Count -gt 0) {
        Write-Host "  Verbesserungen: $($improvements.Count)" -ForegroundColor Yellow
    }
    Write-Host ""
    
    $confirm = Read-Host "  Release starten? (y/N)"
    if ($confirm -ne "y") {
        Write-Error "Abgebrochen."
        return
    }
    
    Write-Host ""
    
    # Update package.json
    Write-Step "Updating package.json auf $newVersion..."
    $packageContent = Get-Content "package.json" -Raw
    $packageContent = $packageContent -replace '"version":\s*"[^"]+"', "`"version`": `"$newVersion`""
    $packageContent | Set-Content "package.json" -NoNewline
    Write-Success "package.json aktualisiert"
    
    # Build
    Write-Step "Building..."
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build fehlgeschlagen!" }
    Write-Success "Build erfolgreich"
    
    # Installer
    Write-Step "Erstelle Installer..."
    npm run dist:installer
    if ($LASTEXITCODE -ne 0) { throw "Installer-Erstellung fehlgeschlagen!" }
    Write-Success "Installer erstellt"
    
    # Check installer
    $installerName = "BroadcastKit Setup $newVersion.exe"
    $installerPath = "installer\$installerName"
    if (-not (Test-Path $installerPath)) {
        throw "Installer nicht gefunden: $installerPath"
    }
    
    # Git
    Write-Step "Git Commit..."
    git add -A
    git commit -m "chore: release $tagName"
    Write-Success "Commit erstellt"
    
    Write-Step "Git Tag..."
    git tag -a $tagName -m "BroadcastKit $tagName"
    Write-Success "Tag $tagName erstellt"
    
    Write-Step "Push to GitHub..."
    git push origin main
    git push origin $tagName
    Write-Success "Gepusht"
    
    # Release Notes bauen
    $releaseNotes = "# BroadcastKit $tagName`n`nProfessionelle Stream Overlays fuer OBS Studio`n"
    
    if ($features.Count -gt 0) {
        $releaseNotes += "`n## :sparkles: Neue Features`n`n"
        $releaseNotes += ($features -join "`n") + "`n"
    }
    if ($fixes.Count -gt 0) {
        $releaseNotes += "`n## :bug: Bug Fixes`n`n"
        $releaseNotes += ($fixes -join "`n") + "`n"
    }
    if ($improvements.Count -gt 0) {
        $releaseNotes += "`n## :wrench: Verbesserungen`n`n"
        $releaseNotes += ($improvements -join "`n") + "`n"
    }
    
    $releaseNotes += @"

## :cd: Installation

1. ``BroadcastKit Setup $newVersion.exe`` herunterladen
2. Installer ausfuehren
3. Browser Sources in OBS hinzufuegen

| Overlay | URL |
|---------|-----|
| Lower Third | ``http://localhost:3000/overlay/lower-third`` |
| Now Playing | ``http://localhost:3000/overlay/now-playing`` |
| Social Widget | ``http://localhost:3000/overlay/social-widget`` |
| Stream Scenes | ``http://localhost:3000/overlay/scene-*`` |

## :computer: Systemanforderungen

- Windows 10/11 64-bit
- OBS Studio mit WebSocket Plugin (v5.x)
"@
    
    # GitHub Release - Upload ALL required files for auto-update
    Write-Step "Erstelle GitHub Release..."
    $notesFile = "installer\release-notes.md"
    $releaseNotes | Out-File -FilePath $notesFile -Encoding utf8
    
    # Files needed for auto-update
    $blockmapPath = "installer\$installerName.blockmap"
    $latestYmlPath = "installer\latest.yml"
    
    # Build the upload command with all files
    $uploadFiles = "`"$installerPath`""
    if (Test-Path $blockmapPath) {
        $uploadFiles += " `"$blockmapPath`""
        Write-Host "    + $installerName.blockmap" -ForegroundColor DarkGray
    }
    if (Test-Path $latestYmlPath) {
        $uploadFiles += " `"$latestYmlPath`""
        Write-Host "    + latest.yml" -ForegroundColor DarkGray
    }
    
    $cmd = "gh release create $tagName $uploadFiles --title `"BroadcastKit $tagName`" --notes-file `"$notesFile`""
    Invoke-Expression $cmd
    Remove-Item $notesFile -ErrorAction SilentlyContinue
    Write-Success "GitHub Release erstellt (mit Auto-Update Dateien)"
    
    # Done
    Write-Host ""
    Write-Host "  ========================================" -ForegroundColor Green
    Write-Host "  RELEASE $tagName ERFOLGREICH!" -ForegroundColor Green
    Write-Host "  ========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  https://github.com/netz-sg/broadcastkit/releases/tag/$tagName" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "  Druecke ENTER um fortzufahren"
}

# Main Loop
while ($true) {
    Show-Banner
    $choice = Show-MainMenu
    
    switch ($choice) {
        "1" { Do-Push }
        "2" {
            Show-Banner
            $releaseType = Show-ReleaseTypeMenu
            if ($releaseType) {
                Do-Release $releaseType
            }
        }
        "q" { 
            Write-Host ""
            Write-Host "  Auf Wiedersehen!" -ForegroundColor Magenta
            Write-Host ""
            exit 0 
        }
        "Q" { 
            Write-Host ""
            Write-Host "  Auf Wiedersehen!" -ForegroundColor Magenta
            Write-Host ""
            exit 0 
        }
    }
}
