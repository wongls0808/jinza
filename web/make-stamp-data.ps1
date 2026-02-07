$stampPath = Join-Path $PSScriptRoot "stamp.png"
$outPath = Join-Path $PSScriptRoot "stamp-data.js"
$bytes = [IO.File]::ReadAllBytes($stampPath)
$base64 = [Convert]::ToBase64String($bytes)
$js = "window.STAMP_DATA_URL='data:image/png;base64,$base64';"
[IO.File]::WriteAllText($outPath, $js)
