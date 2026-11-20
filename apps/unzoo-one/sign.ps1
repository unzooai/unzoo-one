#requires -Version 5.1
<#
Sign one file (exe, dll or msi) with Unzoo One's code-signing certificate.

Called by build-installer.ps1 for the runtime files it bundles, and by Tauri
(bundle.windows.signCommand) for the client and the MSI. Windows SmartScreen
warns about anything unsigned, and an installer that warns is one most people
do not finish.

Which certificate, from the environment:

  UNZOO_SIGN_THUMBPRINT   SHA-1 thumbprint of a certificate in the Windows
                          certificate store (CurrentUser\My or LocalMachine\My).
                          The usual setup for an EV certificate on a hardware
                          token or in a cloud HSM with a KSP.
  UNZOO_SIGN_PFX          Path to a .pfx file, with
  UNZOO_SIGN_PFX_PASSWORD its password.
  UNZOO_SIGN_TRUSTED      Azure Trusted Signing: path to its metadata.json
                          ({"Endpoint", "CodeSigningAccountName",
                          "CertificateProfileName"}), with
  UNZOO_SIGN_TRUSTED_DLIB the path to Azure.CodeSigning.Dlib.dll from the
                          Microsoft.Trusted.Signing.Client package. Signs in
                          with the Azure login on this machine (az login) or
                          AZURE_CLIENT_ID / AZURE_TENANT_ID / AZURE_CLIENT_SECRET.
  UNZOO_SIGN_TIMESTAMP    RFC 3161 timestamp server
                          (default http://timestamp.digicert.com). A timestamp
                          keeps the signature valid after the certificate
                          expires.

With none of them set, nothing is signed and the script says so: development
builds stay unsigned. A file that already carries a valid signature from
someone else (OpenConsole.exe is Microsoft's) is left as it is.

Usage:
  powershell -File apps\unzoo-one\sign.ps1 <file>
  powershell -File apps\unzoo-one\sign.ps1 -Check   # exit 0 if a certificate is configured
#>
[CmdletBinding()]
param(
  [Parameter(Position = 0)][string]$File,
  [switch]$Check
)
$ErrorActionPreference = "Stop"

function Configured {
  return [bool]($env:UNZOO_SIGN_THUMBPRINT -or $env:UNZOO_SIGN_PFX -or $env:UNZOO_SIGN_TRUSTED)
}

if ($Check) {
  if (Configured) { exit 0 } else { exit 1 }
}
if (-not $File) { throw "usage: sign.ps1 <file>" }
if (-not (Test-Path -LiteralPath $File)) { throw "no such file: $File" }
if (-not (Configured)) {
  Write-Host "    (unsigned: set UNZOO_SIGN_TRUSTED, UNZOO_SIGN_THUMBPRINT or UNZOO_SIGN_PFX to sign) $File"
  exit 0
}

# A valid signature -- Microsoft's on OpenConsole, or ours from an earlier
# pass -- stays: re-signing would only replace it.
$existing = Get-AuthenticodeSignature -LiteralPath $File
if ($existing.Status -eq "Valid") {
  Write-Host "    already signed by $($existing.SignerCertificate.Subject): $File"
  exit 0
}

function Find-SignTool {
  $onPath = Get-Command signtool.exe -ErrorAction SilentlyContinue
  if ($onPath) { return $onPath.Source }
  $arch = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { "arm64" } else { "x64" }
  $kits = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin"
  $found = Get-ChildItem $kits -Recurse -Filter signtool.exe -ErrorAction SilentlyContinue |
    Where-Object { $_.Directory.Name -eq $arch } |
    Sort-Object { [version]($_.Directory.Parent.Name -replace '[^\d.]', '') } |
    Select-Object -Last 1
  if (-not $found) { throw "signtool.exe not found: install the Windows SDK (Signing Tools)" }
  return $found.FullName
}

$signtool = Find-SignTool
$timestamp = if ($env:UNZOO_SIGN_TIMESTAMP) { $env:UNZOO_SIGN_TIMESTAMP }
  elseif ($env:UNZOO_SIGN_TRUSTED) { "http://timestamp.acs.microsoft.com" }
  else { "http://timestamp.digicert.com" }
$arguments = @("sign", "/fd", "sha256", "/tr", $timestamp, "/td", "sha256", "/d", "Unzoo One")
if ($env:UNZOO_SIGN_TRUSTED) {
  if (-not $env:UNZOO_SIGN_TRUSTED_DLIB -or -not (Test-Path -LiteralPath $env:UNZOO_SIGN_TRUSTED_DLIB)) {
    throw "UNZOO_SIGN_TRUSTED needs UNZOO_SIGN_TRUSTED_DLIB: the path to Azure.CodeSigning.Dlib.dll"
  }
  $arguments += @("/dlib", $env:UNZOO_SIGN_TRUSTED_DLIB, "/dmdf", $env:UNZOO_SIGN_TRUSTED)
} elseif ($env:UNZOO_SIGN_PFX) {
  $arguments += @("/f", $env:UNZOO_SIGN_PFX)
  if ($env:UNZOO_SIGN_PFX_PASSWORD) { $arguments += @("/p", $env:UNZOO_SIGN_PFX_PASSWORD) }
} else {
  $arguments += @("/sha1", $env:UNZOO_SIGN_THUMBPRINT)
}
$arguments += $File

# The timestamp server is a network call; it fails now and then.
for ($attempt = 1; $attempt -le 3; $attempt++) {
  & $signtool @arguments | Out-Host
  if ($LASTEXITCODE -eq 0) { Write-Host "    signed: $File"; exit 0 }
  Start-Sleep -Seconds (2 * $attempt)
}
throw "signing failed: $File"
