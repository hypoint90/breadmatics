# 간단한 로컬 미리보기 서버 (Node/Python 없이 PowerShell 만으로 동작)
# 실행:  powershell -ExecutionPolicy Bypass -File tools/serve.ps1
# 접속:  http://localhost:5500
param([int]$Port = 5500)

$root = Split-Path -Parent $PSScriptRoot
$types = @{
  ".html" = "text/html; charset=utf-8"; ".css" = "text/css; charset=utf-8"; ".js" = "text/javascript; charset=utf-8"
  ".webp" = "image/webp"; ".png" = "image/png"; ".jpg" = "image/jpeg"; ".svg" = "image/svg+xml"; ".json" = "application/json"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart("/"))
  # 폴더 주소(/, /v2/)는 그 안의 index.html
  if ($path -eq "" -or $path.EndsWith("/")) { $path = $path + "index.html" }
  $file = Join-Path $root $path
  $full = [IO.Path]::GetFullPath($file)

  if ($full.StartsWith($root) -and (Test-Path $full -PathType Leaf)) {
    $ext = [IO.Path]::GetExtension($full).ToLower()
    $ctx.Response.ContentType = $(if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" })
    $ctx.Response.Headers.Add("Cache-Control", "no-store")
    $bytes = [IO.File]::ReadAllBytes($full)
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.Close()
}
