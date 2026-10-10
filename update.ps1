param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'

function Invoke-CidooUpdate {
    param([string]$ExtensionDirectory, [switch]$NoBrowser)
    $root = [IO.Path]::GetFullPath($ExtensionDirectory)
    $manifestPath = Join-Path $root 'manifest.json'
    $current = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    if ($current.name -ne '__MSG_extensionName__' -or $current.manifest_version -ne 3) {
        throw 'This folder is not a CIDOO RGB Studio installation.'
    }
    $lock = $null
    try {
        $lock = [IO.File]::Open((Join-Path $root '.cidoo-update.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Write-Host 'Checking GitHub for updates...'
        $release = Invoke-RestMethod -Uri 'https://api.github.com/repos/HiKei1337/cidookeyboardanimations/releases/latest' -Headers @{ 'User-Agent' = 'CIDOO-RGB-Studio-Updater'; Accept = 'application/vnd.github+json' }
        if ($release.draft -or $release.prerelease -or $release.tag_name -notmatch '^v(\d+\.\d+\.\d+(?:\.\d+)?)$') { throw 'Invalid stable release.' }
        $version = $Matches[1]
        if ([version]$version -le [version]$current.version) {
            Write-Host "Already up to date: $($current.version)"
            return
        }
        $assetName = "cidoo-rgb-studio-v$version.zip"
        $assets = @($release.assets | Where-Object { $_.name -eq $assetName })
        if ($assets.Count -ne 1) { throw 'The release ZIP is missing or ambiguous.' }
        $asset = $assets[0]
        $expectedUrl = "https://github.com/HiKei1337/cidookeyboardanimations/releases/download/v$version/$assetName"
        if ($asset.browser_download_url -ne $expectedUrl -or $asset.size -gt 20971520) { throw 'Unexpected release download.' }
        $work = Join-Path ([IO.Path]::GetTempPath()) ('cidoo-update-' + [guid]::NewGuid().ToString('N'))
        $stage = Join-Path $work 'new'
        $backup = Join-Path $work 'backup'
        New-Item -ItemType Directory -Path $stage, $backup -Force | Out-Null
        $zip = Join-Path $work 'release.zip'
        Write-Host "Downloading $version..."
        Invoke-WebRequest -Uri $expectedUrl -OutFile $zip -UseBasicParsing
        if ((Get-Item -LiteralPath $zip).Length -ne $asset.size) { throw 'Incomplete download. Existing files have not been changed.' }
        if ($asset.digest -match '^sha256:([a-fA-F0-9]{64})$') {
            if ((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash -ne $Matches[1]) { throw 'Download checksum mismatch.' }
        }
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $archive = [IO.Compression.ZipFile]::OpenRead($zip)
        $files = @()
        $required = @('manifest.json','animation.js','bridge.js','connect.html','connect.js','hid.js','i18n.js','layout.js','popup.css','popup.html','popup.js','presets.js','project.js','studio.css','studio.html','studio.js','worker.js','_locales/en/messages.json','_locales/ru/messages.json')
        $allowed = $required + @('LICENSE','NOTICE','README.md','README.en.md','update.cmd','update.ps1')
        try {
            $total = 0
            foreach ($entry in $archive.Entries) {
                $name = $entry.FullName.Replace('\','/')
                if ($name.EndsWith('/')) {
                    if ($name -notin @('_locales/','_locales/en/','_locales/ru/')) { throw "Unexpected ZIP directory: $name" }
                    continue
                }
                if ($name -notin $allowed -or $name -in $files) { throw "Unexpected or duplicate ZIP file: $name" }
                $total += $entry.Length
                if ($total -gt 20971520) { throw 'Unpacked release is too large.' }
                $destination = Join-Path $stage $name
                New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($destination)) -Force | Out-Null
                [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destination, $false)
                $files += $name
            }
        } finally { $archive.Dispose() }
        foreach ($name in $required) { if ($name -notin $files) { throw "Release is missing $name" } }
        $next = Get-Content -LiteralPath (Join-Path $stage 'manifest.json') -Raw | ConvertFrom-Json
        if ($next.version -ne $version -or $next.name -ne $current.name -or $next.manifest_version -ne 3) { throw 'Release manifest does not match.' }
        # Back up every destination before changing any file. Never touch local projects or unrelated files.
        $existing = @()
        foreach ($name in $files) {
            $target = Join-Path $root $name
            if (Test-Path -LiteralPath $target) {
                $saved = Join-Path $backup $name
                New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($saved)) -Force | Out-Null
                Copy-Item -LiteralPath $target -Destination $saved -Force
                $existing += $name
            }
        }
        $changed = @()
        try {
            # Manifest last: Chrome sees the new version only after all runtime files are copied.
            foreach ($name in @($files | Where-Object { $_ -ne 'manifest.json' }) + @('manifest.json')) {
                $target = Join-Path $root $name
                New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($target)) -Force | Out-Null
                $changed += $name
                Copy-Item -LiteralPath (Join-Path $stage $name) -Destination $target -Force
            }
        } catch {
            $originalError = $_
            try {
                foreach ($name in $changed) {
                    $target = Join-Path $root $name
                    if ($name -in $existing) { Copy-Item -LiteralPath (Join-Path $backup $name) -Destination $target -Force }
                    elseif (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Force }
                }
            } catch { throw "Could not restore all files. Restore the backup from $backup into $root before reloading Chrome. $($_.Exception.Message)" }
            throw $originalError
        }
        Write-Host "Updated to $version. Backup: $backup"
        Write-Host 'Open chrome://extensions and click Reload on CIDOO RGB Studio.'
        Write-Host 'Do not remove and reinstall the extension. Your saved projects stay in Chrome.'
        if (-not $NoBrowser) { Start-Process 'chrome.exe' -ArgumentList 'chrome://extensions' -ErrorAction SilentlyContinue }
    } finally { if ($lock) { $lock.Dispose() } }
}

if ($MyInvocation.InvocationName -ne '.') {
    Write-Host 'CIDOO RGB Studio update / obnovlenie'
    Write-Host 'Stop keyboard playback before continuing. / Ostanovite animatsiyu.'
    try {
        $answer = Read-Host 'Continue? [Y/N]'
        if ($answer -notmatch '^(y|yes)$') { exit 0 }
        Invoke-CidooUpdate -ExtensionDirectory $PSScriptRoot -NoBrowser:$NoBrowser
    } catch {
        Write-Host "Update failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host 'Do not reinstall. Read the error above before reloading Chrome.'
        exit 1
    }
}
