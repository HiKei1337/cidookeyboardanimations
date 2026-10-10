$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '../update.ps1')
Add-Type -AssemblyName System.IO.Compression.FileSystem
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('cidoo-updater-test-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testRoot | Out-Null
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$script:fixtureZip = Join-Path $testRoot 'release.zip'
$script:failDownload = $false
$script:failCopy = $false
function Assert($condition, $message) { if (-not $condition) { throw $message } }
function Invoke-RestMethod { return $script:release }
function Invoke-WebRequest {
    param($Uri, $OutFile, [switch]$UseBasicParsing)
    if ($script:failDownload) { throw 'Offline' }
    Microsoft.PowerShell.Management\Copy-Item -LiteralPath $script:fixtureZip -Destination $OutFile
}
function Copy-Item {
    param($LiteralPath, $Destination, [switch]$Force)
    if ($script:failCopy -and $LiteralPath -like '*\new\popup.js') {
        $script:failCopy = $false
        throw 'Simulated disk failure'
    }
    Microsoft.PowerShell.Management\Copy-Item -LiteralPath $LiteralPath -Destination $Destination -Force:$Force
}
function Prepare {
    $source = Join-Path $testRoot ([guid]::NewGuid().ToString('N'))
    $target = Join-Path $testRoot ([guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $source, $target | Out-Null
    $runtime = @('manifest.json','animation.js','bridge.js','connect.html','connect.js','hid.js','i18n.js','layout.js','popup.css','popup.html','popup.js','presets.js','project.js','studio.css','studio.html','studio.js','worker.js')
    foreach ($file in $runtime) { Copy-Item -LiteralPath (Join-Path $repo $file) -Destination (Join-Path $source $file) }
    Microsoft.PowerShell.Management\Copy-Item -LiteralPath (Join-Path $repo '_locales') -Destination $source -Recurse
    Microsoft.PowerShell.Management\Copy-Item -Path (Join-Path $source '*') -Destination $target -Recurse
    $old = Get-Content -LiteralPath (Join-Path $target 'manifest.json') -Raw | ConvertFrom-Json
    $old.version = '1.0.0'
    $old | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath (Join-Path $target 'manifest.json')
    $next = Get-Content -LiteralPath (Join-Path $source 'manifest.json') -Raw | ConvertFrom-Json
    $next.version = '2.0.0'
    $next | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath (Join-Path $source 'manifest.json')
    Set-Content -LiteralPath (Join-Path $target 'popup.js') -Value 'old version'
    Set-Content -LiteralPath (Join-Path $target 'my-animation.json') -Value 'keep me'
    if (Test-Path -LiteralPath $script:fixtureZip) { Remove-Item -LiteralPath $script:fixtureZip }
    [IO.Compression.ZipFile]::CreateFromDirectory($source, $script:fixtureZip)
    $script:release = @{ tag_name='v2.0.0'; assets=@(@{name='cidoo-rgb-studio-v2.0.0.zip'; size=(Get-Item $script:fixtureZip).Length; browser_download_url='https://github.com/HiKei1337/cidookeyboardanimations/releases/download/v2.0.0/cidoo-rgb-studio-v2.0.0.zip'; digest=('sha256:' + (Get-FileHash $script:fixtureZip).Hash)}) }
    return $target
}
function ExpectFailure($target) {
    $failed = $false
    try { Invoke-CidooUpdate -ExtensionDirectory $target -NoBrowser } catch { $failed = $true }
    Assert $failed 'Expected failure'
    Assert ((Get-Content (Join-Path $target 'manifest.json') -Raw | ConvertFrom-Json).version -eq '1.0.0') 'Version changed after failure'
    Assert ((Get-Content (Join-Path $target 'popup.js') -Raw).Trim() -eq 'old version') 'Files changed after failure'
}
$target = Prepare
Invoke-CidooUpdate -ExtensionDirectory $target -NoBrowser
Assert ((Get-Content (Join-Path $target 'manifest.json') -Raw | ConvertFrom-Json).version -eq '2.0.0') 'Update failed'
Assert ((Get-Content (Join-Path $target 'my-animation.json') -Raw).Trim() -eq 'keep me') 'Unrelated file changed'
$script:failDownload = $true
Invoke-CidooUpdate -ExtensionDirectory $target -NoBrowser # same version must not download
$target = Prepare
ExpectFailure $target
$script:failDownload = $false
$target = Prepare
$script:release.assets[0].browser_download_url = 'https://example.com/malware.zip'
ExpectFailure $target
$target = Prepare
$script:release.assets[0].digest = 'sha256:' + ('0' * 64)
ExpectFailure $target
$target = Prepare
$archive = [IO.Compression.ZipFile]::Open($script:fixtureZip, 'Update')
$entry = $archive.CreateEntry('../outside.js'); $writer = New-Object IO.StreamWriter($entry.Open()); $writer.Write('bad'); $writer.Dispose(); $archive.Dispose()
$script:release.assets[0].size = (Get-Item $script:fixtureZip).Length
$script:release.assets[0].digest = 'sha256:' + (Get-FileHash $script:fixtureZip).Hash
ExpectFailure $target
Assert (-not (Test-Path (Join-Path $testRoot 'outside.js'))) 'ZIP escaped its folder'
$target = Prepare
$script:failCopy = $true
ExpectFailure $target
Write-Host 'Updater tests passed: update, no-op, offline, download URL, checksum, ZIP traversal, rollback, local files.'
