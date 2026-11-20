#requires -Version 5.1
<#
Build the Unzoo One installer (Windows MSI).

One product, one installer: the desktop client (this app), its background
service (unterm-core), the terminal (unterm) and the CLI, with the helpers the
terminal needs. All of them land flat in the install directory, which is
where each looks for the others.

Steps:
  1. Release-build the runtime and the terminal (unterm/ workspace).
  2. Build the interface (npm run build:static -> dist/client).
  3. Stage the runtime files into src-tauri/payload.
  4. Sign them, when a certificate is configured (see sign.ps1).
  5. Bundle with Tauri (WiX); Tauri signs the client and the MSI with the same
     script. The MSI lands in src-tauri/target/release/bundle/msi.

Usage (from the repository root):
  powershell -File apps\unzoo-one\build-installer.ps1
  powershell -File apps\unzoo-one\build-installer.ps1 -SkipRuntimeBuild
  # A release: refuse to build without a certificate.
  $env:UNZOO_SIGN_THUMBPRINT = "<sha1>"; powershell -File apps\unzoo-one\build-installer.ps1 -RequireSignature
#>
[CmdletBinding()]
param(
  # Reuse unterm/target/release as it is (it was just built).
  [switch]$SkipRuntimeBuild,
  # Reuse dist/client as it is.
  [switch]$SkipInterfaceBuild,
  # Fail unless a signing certificate is configured: for release builds.
  [switch]$RequireSignature
)
$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$unterm = Join-Path $root "unterm"
$tauri = Join-Path $PSScriptRoot "src-tauri"
$release = Join-Path $unterm "target\release"

$sign = Join-Path $PSScriptRoot "sign.ps1"
& powershell -NoProfile -ExecutionPolicy Bypass -File $sign -Check
$signing = $LASTEXITCODE -eq 0
if ($RequireSignature -and -not $signing) {
  throw "no signing certificate: set UNZOO_SIGN_THUMBPRINT, or UNZOO_SIGN_PFX and UNZOO_SIGN_PFX_PASSWORD"
}
if (-not $signing) { Write-Host "==> building UNSIGNED (no UNZOO_SIGN_* set); Windows will warn when it is installed" }

function Run([string]$what, [scriptblock]$block) {
  Write-Host "==> $what"
  & $block
  if ($LASTEXITCODE -ne 0) { throw "$what failed (exit $LASTEXITCODE)" }
}

if (-not $SkipRuntimeBuild) {
  Push-Location $unterm
  # The programs' file details (Task Manager, Properties) name Unzoo One, the
  # product they are installed as; antivirus reputation is per product and
  # publisher, and a mismatch reads as something bundled in.
  $env:UNTERM_BRAND_PRODUCT = "Unzoo One"
  try { Run "runtime and terminal (release)" { cargo build --release -p unterm-app -p unterm-cli -p unterm-core } }
  finally { Pop-Location; Remove-Item Env:UNTERM_BRAND_PRODUCT -ErrorAction SilentlyContinue }
}

if (-not $SkipInterfaceBuild) {
  Push-Location $root
  try { Run "interface (static)" { npm run build:static } }
  finally { Pop-Location }
}
if (-not (Test-Path (Join-Path $root "dist\client\index.html"))) { throw "no interface build at dist\client" }

# Native helpers must match the build arch.
$arch = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { "arm64" } else { "x64" }
$helpers = if ($arch -eq "arm64") { Join-Path $unterm "assets\windows\arm64" } else { Join-Path $unterm "assets\windows" }

$payload = Join-Path $tauri "payload"
if (Test-Path $payload) { Remove-Item -Recurse -Force $payload }
New-Item -ItemType Directory -Path $payload | Out-Null

$flat = @(
  (Join-Path $release "unterm.exe"),
  (Join-Path $release "unterm-cli.exe"),
  (Join-Path $release "unterm-core.exe"),
  (Join-Path $helpers "conhost\conpty.dll"),
  (Join-Path $helpers "conhost\OpenConsole.exe"),
  (Join-Path $helpers "angle\libEGL.dll"),
  (Join-Path $helpers "angle\libGLESv2.dll")
)
foreach ($file in $flat) {
  if (-not (Test-Path $file)) { throw "missing: $file" }
  Copy-Item $file $payload
}
# Software-GL fallback for the terminal: x64 only.
New-Item -ItemType Directory -Path (Join-Path $payload "mesa") | Out-Null
if ($arch -ne "arm64") {
  Copy-Item (Join-Path $unterm "assets\windows\mesa\opengl32.dll") (Join-Path $payload "mesa")
}
New-Item -ItemType Directory -Path (Join-Path $payload "defaults") | Out-Null
Copy-Item (Join-Path $unterm "assets\unterm.conf") (Join-Path $payload "defaults")
$fonts = Join-Path $payload "assets\fonts"
New-Item -ItemType Directory -Path $fonts -Force | Out-Null
foreach ($font in "SymbolsNerdFontMono-Regular.ttf", "NotoColorEmoji.ttf", "JetBrainsMono-Regular.ttf") {
  Copy-Item (Join-Path $unterm "assets\fonts\$font") $fonts
}
# Names the install for the runtime's programs nobody hands UNTERM_PRODUCT_NAME
# to (the bridge an AI client starts): Unzoo One's state, Core and port, apart
# from a standalone Unterm's.
[System.IO.File]::WriteAllText((Join-Path $payload "unterm-product.txt"), "Unzoo One")
# What the terminal bridge tells the agents in other clients, beside unterm-cli.exe.
Copy-Item (Join-Path $PSScriptRoot "mcp-instructions.md") $payload
# Built-in skills, beside unterm-core.exe where the runtime looks for them.
# Each file is also listed under bundle.resources in tauri.conf.json.
Copy-Item -Recurse (Join-Path $PSScriptRoot "skills") (Join-Path $payload "skills")
$listed = Get-Content (Join-Path $tauri "tauri.conf.json") -Raw
foreach ($file in Get-ChildItem (Join-Path $payload "skills") -Recurse -File) {
  $relative = $file.FullName.Substring($payload.Length + 1).Replace('\', '/')
  if ($listed -notmatch [regex]::Escape("payload/$relative")) { throw "skills/$($relative.Substring(7)) is not listed in tauri.conf.json bundle.resources" }
}
Write-Host "==> staged $((Get-ChildItem $payload -Recurse -File).Count) runtime files"

$buildArgs = @("--no-install", "tauri", "build")
if ($signing) {
  foreach ($binary in Get-ChildItem $payload -Recurse -Include *.exe, *.dll) {
    Run "sign $($binary.Name)" { & powershell -NoProfile -ExecutionPolicy Bypass -File $sign $binary.FullName }
  }
  # Tauri signs what it builds -- the client and each MSI -- with the same script.
  $override = Join-Path $tauri "target\sign-config.json"
  New-Item -ItemType Directory -Force -Path (Split-Path $override) | Out-Null
  @{ bundle = @{ windows = @{ signCommand = @{
    cmd  = "powershell"
    args = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $sign, "%1")
  } } } } | ConvertTo-Json -Depth 6 | ForEach-Object {
    # No byte-order mark: Windows PowerShell's utf8 writes one, and JSON parsers refuse it.
    [IO.File]::WriteAllText($override, $_, (New-Object Text.UTF8Encoding $false))
  }
  $buildArgs += @("--config", $override)
}

Push-Location $PSScriptRoot
try { Run "installer (tauri build)" { npx @buildArgs } }
finally { Pop-Location }

$msis = Get-ChildItem (Join-Path $tauri "target\release\bundle\msi") -Filter *.msi | Sort-Object LastWriteTime | Select-Object -Last 2
foreach ($msi in $msis) {
  $signature = Get-AuthenticodeSignature $msi.FullName
  $by = if ($signature.SignerCertificate) { $signature.SignerCertificate.Subject } else { "nobody" }
  Write-Host "==> $($msi.FullName) (signature: $($signature.Status), by $by)"
  if ($RequireSignature -and -not $signature.SignerCertificate) { throw "$($msi.Name) came out unsigned" }
}
