<#

用法：
    .\scaffold.ps1 -Project "C:\path\to\my-video" -Id "Entropy" -Name "entropy"
    .\scaffold.ps1 -Project "C:\path\to\my-video" -Id "Year" -Name "year" -Duration 161

会做：
  1. 复制 assets 到项目里（不覆盖已有文件）
  2. 生成一个空的场景文件（含字幕骨架和五幕结构）
  3. 生成配乐
  4. 打印接下来要手改的三处
#>

param(
  [Parameter(Mandatory=$true)][string]$Project,
  [Parameter(Mandatory=$true)][string]$Id,
  [Parameter(Mandatory=$true)][string]$Name,
  [int]$Duration = 161
)

$ErrorActionPreference = "Stop"
$assets = Join-Path $PSScriptRoot "assets"

if (-not (Test-Path $Project)) { throw "项目目录不存在: $Project" }

# ---------- 1) 复制素材
$pairs = @(
  @{ src = "Kit.tsx";          dst = "src\components\vibe\Kit.tsx" },
  @{ src = "Cover.tsx";        dst = "src\scenes\Cover.tsx" },
  @{ src = "YearWorld.tsx";    dst = "src\scenes\$($Id)World.tsx" },
  @{ src = "score_episode.py"; dst = "scripts\score_episode.py" },
  @{ src = "synth.py";         dst = "scripts\synth.py" },
  @{ src = "grain.png";        dst = "public\grain.png" }
)
foreach ($p in $pairs) {
  $from = Join-Path $assets $p.src
  $to = Join-Path $Project $p.dst
  $dir = Split-Path $to -Parent
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  if (Test-Path $to) {
    Write-Host "  跳过（已存在）: $($p.dst)" -ForegroundColor DarkYellow
  } else {
    Copy-Item $from $to
    Write-Host "  写入: $($p.dst)" -ForegroundColor Green
  }
}

# ---------- 2) 生成配乐
$wav = Join-Path $Project "public\audio\$Name-bgm.wav"
if (-not (Test-Path $wav)) {
  Push-Location (Join-Path $Project "scripts")
  & python "score_episode.py" $Duration "$Name-bgm"
  if ($LASTEXITCODE -eq 0) {
    Write-Host "  配乐已生成: $Name-bgm.wav" -ForegroundColor Green
  } else {
    Write-Host "  ! 配乐生成失败，检查 scripts/ 下是否有 synth.py" -ForegroundColor Red
  }
  Pop-Location
} else {
  Write-Host "  跳过（已有配乐）" -ForegroundColor DarkYellow
}

# ---------- 3) 提示手改
Write-Host ""
Write-Host "接下来手改这三处：" -ForegroundColor Cyan
Write-Host "  1. src/scenes/$($Id)World.tsx  —— 改 SUBS（文案）和五个场景的数据"
Write-Host "  2. src/scenes/Cover.tsx        —— 在 COVER_COPY 里加 $($Name) 条目"
Write-Host "  3. src/Root.tsx                —— 注册 Composition '$Id' 和三个 Still"
Write-Host ""
Write-Host "Root.tsx 注册片段："
Write-Host @"
  <Composition id="$Id" component={${Id}Film}
    durationInFrames={$($Duration * 30)} fps={30} width={1920} height={1080} />
  <Still id="Cover${Id}x16"  {...cover("$Name", "16x9")} />
  <Still id="Cover${Id}x916" {...cover("$Name", "9x16")} />
  <Still id="Cover${Id}x34"  {...cover("$Name", "3x4")} />
"@ -ForegroundColor DarkGray
Write-Host ""
Write-Host "渲染前记得：" -ForegroundColor Yellow
Write-Host '  New-Item -ItemType Directory -Path .tmp -Force | Out-Null'
Write-Host '  $env:TEMP = (Resolve-Path .tmp).Path; $env:TMP = $env:TEMP'



