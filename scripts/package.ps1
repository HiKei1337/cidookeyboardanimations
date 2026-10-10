$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$version = (Get-Content -LiteralPath (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json).version
$stage = Join-Path ([IO.Path]::GetTempPath()) ('cidoo-package-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stage | Out-Null
$files = @('manifest.json','animation.js','bridge.js','connect.html','connect.js','hid.js','i18n.js','layout.js','popup.css','popup.html','popup.js','presets.js','project.js','studio.css','studio.html','studio.js','worker.js','LICENSE','NOTICE','README.md','README.en.md','update.cmd','update.ps1')
foreach ($file in $files) { Copy-Item -LiteralPath (Join-Path $root $file) -Destination $stage }
Copy-Item -LiteralPath (Join-Path $root '_locales') -Destination $stage -Recurse
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = Join-Path $root "cidoo-rgb-studio-v$version.zip"
if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip }
[IO.Compression.ZipFile]::CreateFromDirectory($stage, $zip)
Write-Host $zip
