# 环境与命令

踩过的坑都在这里。照着做能省两小时。

## 项目初始化

```bash
npm create video@latest my-video
cd my-video
npm i
```

装好后把 `assets/` 里的文件复制到：

```
src/components/vibe/Kit.tsx
src/scenes/<Topic>World.tsx
src/scenes/Cover.tsx
scripts/score_episode.py
```

`score_episode.py` 依赖同目录的 `synth.py`（合成器库）。没有就从既有项目复制。

---

## Windows 上的一个致命坑

**渲染中途报 `Error: write EOF`，编码管道断开。**

原因：系统清理 `%TEMP%`，把 Chrome 的临时配置目录删了。

解决：把临时目录指到项目内。

```powershell
New-Item -ItemType Directory -Path .tmp -Force | Out-Null
$env:TEMP = (Resolve-Path .tmp).Path
$env:TMP = $env:TEMP
$env:TMPDIR = $env:TEMP
```

**每次渲染前都要设。** 不设的话，前几次能成，之后就全挂。

---

## 配置

```ts
// remotion.config.ts
Config.setVideoImageFormat("png");
Config.setConcurrency(6);
```

`png` 而不是 `jpeg`：字幕边缘会干净很多，代价是渲染慢 20%。

---

## 渲染

```powershell
$env:TEMP = (Resolve-Path .tmp).Path; $env:TMP = $env:TEMP
npx remotion render <CompositionId> out/<name>.mp4 --crf=17 --x264-preset=medium --concurrency=6
```

161 秒 1080p，16 核机器约 12–15 分钟。

## 检查渲染结果

```powershell
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate -of default=nw=1 out/x.mp4
ffmpeg -i out/x.mp4 -af volumedetect -f null - 2>&1 | Select-String "mean_volume|max_volume"
```

要求：时长 ±0.1s，平均 −20~−22 dB，峰值 ≤ −4.5。

## 单帧检查（改画面时必做）

```powershell
npx remotion still <CompId> out/chk/f0060.png --frame=60
```

一次渲 6–10 个关键帧，拼成联络表看整体节奏：

```python
# contact sheet：每 2.5s 抽一帧，6 列
```

**不要只渲一帧就下结论。** 单帧好看不代表动起来好看。

## 配乐

```powershell
python scripts/score_episode.py 161 <name>
```

生成到 `public/audio/<name>.wav`。

生成后**必须验证包络**——逐秒算 RMS，确认静音段真的静下来了：

```python
for i in range(len(a)//sr):
    r = 20*np.log10(max(np.sqrt((a[i*sr:(i+1)*sr]**2).mean()),1e-9))
    print(i, r)
```

## 封面

```powershell
npx remotion still Cover<EP>x16 out/cover/x16.png
npx remotion still Cover<EP>x916 out/cover/x916.png
npx remotion still Cover<EP>x34 out/cover/x34.png
```

三个一次出，别只出一个。

## 大小

161 秒 1080p 的成品大约 13–40 MB，取决于画面细节量（大量小元素会显著增大）。可以接受。

---

## 目录约定

```
my-video/
├── src/
│   ├── scenes/
│   │   ├── <Topic>World.tsx     五幕场景 + 字幕
│   │   └── Cover.tsx            三尺寸封面
│   ├── components/vibe/Kit.tsx  片名卡、片尾卡
│   └── Root.tsx                 注册 Composition 与 Still
├── scripts/
│   ├── score_episode.py
│   └── synth.py
├── public/
│   ├── audio/<name>.wav
│   └── grain.png
└── out/
```
