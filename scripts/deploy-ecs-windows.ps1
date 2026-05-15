param(
  [Parameter(Mandatory = $true)]
  [string]$DeepSeekApiKey,

  [int]$Port = 8787,

  [string]$RepoZipUrl = 'https://github.com/Aloofbear/backtrans/archive/refs/heads/main.zip'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root = 'C:\backtrans'
$tools = 'C:\tools'
$nodeVersion = 'v24.15.0'
$nodeName = "node-$nodeVersion-win-x64"
$nodeDir = Join-Path $tools $nodeName
$temp = 'C:\Windows\Temp\backtrans-deploy'
$zipPath = 'C:\Windows\Temp\backtrans-main.zip'

function Write-Stage([string]$name) {
  Write-Output "BT_STAGE $name"
}

function Stop-BackTrans {
  try {
    Unregister-ScheduledTask -TaskName 'BackTrans' -Confirm:$false -ErrorAction SilentlyContinue
  } catch {}

  Get-CimInstance Win32_Process |
    Where-Object {
      $_.CommandLine -like '*C:\backtrans*' -and
      ($_.Name -eq 'node.exe' -or $_.Name -eq 'npm.cmd' -or $_.Name -eq 'powershell.exe')
    } |
    ForEach-Object {
      try { Invoke-CimMethod -InputObject $_ -MethodName Terminate | Out-Null } catch {}
    }
}

function Install-Node {
  New-Item -ItemType Directory -Force -Path $tools | Out-Null
  if (Test-Path (Join-Path $nodeDir 'node.exe')) {
    return
  }

  Write-Stage 'install_node'
  $nodeZip = 'C:\Windows\Temp\node-backtrans.zip'
  $nodeUrls = @(
    "https://npmmirror.com/mirrors/node/$nodeVersion/$nodeName.zip",
    "https://nodejs.org/dist/$nodeVersion/$nodeName.zip"
  )

  $downloaded = $false
  foreach ($url in $nodeUrls) {
    try {
      Invoke-WebRequest -Uri $url -OutFile $nodeZip -UseBasicParsing -TimeoutSec 240
      $downloaded = $true
      break
    } catch {
      Write-Output "BT_WARN node_download_failed $url"
    }
  }

  if (!$downloaded) {
    throw 'Node download failed.'
  }

  Expand-Archive -LiteralPath $nodeZip -DestinationPath $tools -Force
}

function Write-AppEnv {
  $envLines = @(
    "DEEPSEEK_API_KEY=$DeepSeekApiKey",
    'DEEPSEEK_MODEL=deepseek-chat',
    'DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions',
    'APP_ORIGIN=*',
    "PORT=$Port"
  )

  $envLines | Set-Content -LiteralPath (Join-Path $root '.env') -Encoding UTF8
}

function Write-StartTask {
  New-Item -ItemType Directory -Force -Path (Join-Path $root 'logs') | Out-Null

  $startScript = @"
`$ErrorActionPreference = 'Stop'
`$env:Path = "$nodeDir;`$env:Path"
`$env:PORT = "$Port"
Set-Location "$root"
& "$nodeDir\npm.cmd" run start *> "$root\logs\backtrans.log"
"@

  $startPath = Join-Path $root 'start-backtrans.ps1'
  $startScript | Set-Content -LiteralPath $startPath -Encoding UTF8

  $taskArg = '-NoProfile -ExecutionPolicy Bypass -File "' + $startPath + '"'
  $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $taskArg
  $trigger = New-ScheduledTaskTrigger -AtStartup
  Register-ScheduledTask -TaskName 'BackTrans' -Action $action -Trigger $trigger -RunLevel Highest -User 'SYSTEM' -Force | Out-Null
  Start-ScheduledTask -TaskName 'BackTrans'
}

function Wait-Health {
  $health = $null
  for ($i = 0; $i -lt 40; $i++) {
    try {
      $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health" -TimeoutSec 5
      if ($health.ok -and $health.aiConfigured) {
        Write-Output ('BT_HEALTH ' + ($health | ConvertTo-Json -Compress))
        return
      }
    } catch {}
    Start-Sleep -Seconds 3
  }

  $log = Join-Path $root 'logs\backtrans.log'
  if (Test-Path $log) {
    Get-Content $log -Tail 80
  }
  throw 'BackTrans health check failed.'
}

Write-Stage 'start'
Install-Node
$env:Path = "$nodeDir;$env:Path"
Write-Output ('BT_STAGE node ' + (& "$nodeDir\node.exe" -v))

Write-Stage 'stop_old'
Stop-BackTrans
Start-Sleep -Seconds 2

Write-Stage 'download_repo'
Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $temp | Out-Null
Invoke-WebRequest -Uri $RepoZipUrl -OutFile $zipPath -UseBasicParsing -TimeoutSec 240
Expand-Archive -LiteralPath $zipPath -DestinationPath $temp -Force

$src = Get-ChildItem -LiteralPath $temp -Directory | Select-Object -First 1
if (!$src) {
  throw 'Repository archive did not contain a directory.'
}

Remove-Item -LiteralPath $root -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $root | Out-Null
Copy-Item -Path (Join-Path $src.FullName '*') -Destination $root -Recurse -Force
Set-Location $root
Write-AppEnv

Write-Stage 'npm_ci'
& "$nodeDir\npm.cmd" config set registry https://registry.npmmirror.com | Out-Null
& "$nodeDir\npm.cmd" ci --no-audit --no-fund

Write-Stage 'build'
& "$nodeDir\npm.cmd" run build

Write-Stage 'firewall'
if (!(Get-NetFirewallRule -DisplayName 'BackTrans 8787' -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -DisplayName 'BackTrans 8787' -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port | Out-Null
}

Write-Stage 'schedule_start'
Write-StartTask

Write-Stage 'health_wait'
Wait-Health
Write-Stage 'done'
