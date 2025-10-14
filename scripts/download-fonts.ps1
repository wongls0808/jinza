# Downloads Noto Sans SC Regular/Bold to public/fonts
# Usage: Run in project root with PowerShell

$ErrorActionPreference = 'Stop'

$fontsDir = Join-Path $PSScriptRoot '..' | Join-Path -ChildPath 'public/fonts'
New-Item -ItemType Directory -Force -Path $fontsDir | Out-Null

$targets = @(
  @{ Url = 'https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf'; Name = 'NotoSansCJKsc-Regular.otf' },
  @{ Url = 'https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Bold.otf';    Name = 'NotoSansCJKsc-Bold.otf' }
)

foreach ($t in $targets) {
  $out = Join-Path $fontsDir $t.Name
  if (Test-Path $out) {
    Write-Host "Exists: $($t.Name)"
    continue
  }
  Write-Host "Downloading $($t.Name) ..."
  Invoke-WebRequest -Uri $t.Url -OutFile $out
}

Write-Host "Done. Fonts are in public/fonts"
