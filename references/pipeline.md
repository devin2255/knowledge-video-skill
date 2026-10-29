# 渲染管线与确定性契约

## 确定性契约

同一帧号必须永远渲染出同一画面。片子一旦不确定，重渲就是赌博。

**禁止**：

```
Math.random()          → 用种子化 LCG（见下方）
Date.now() / new Date() → 只用 useCurrentFrame()
CSS transition/animation → 全部由帧计算，写在 style 里
requestAnimationFrame  → Remotion 每帧独立渲染
外部网络请求            → 资源必须本地
```

**种子化随机**（每集固定一个种子，画面才可复现）：

```ts
const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};
```

所有"随机"布局、粒子、抖动都从它取数。换种子 = 换一版构图，但每一版都稳定。

---

## 单一时序源

画面和配乐必须读同一份时间表。**改一处，两边一起动。**

做法：文案里的 `SUBS` 数组就是时间表。

```ts
const SUBS = [
  { a: 0.8, b: 4.4, text: "..." },   // a/b 是秒，不是帧
  ...
]
```

配乐脚本读同一组秒数生成事件：

```python
TICKS = [46.0, 49.4, 52.4, ...]     # 与 SUBS 里的刻度时刻一致
DIVE_IN, DIVE_OUT = 17.6, 19.0       # 与画面转场一致
```

**再往下一步**（可选）：把时间表抽成 `cues.json`，画面、配音、配乐三方共读。集数多了再抽，单集不必。

---

## 每段闭环

不要一口气写完五个场景再渲。**一个场景一个闭环**：

```
1. 写场景
2. 渲染 4–6 张静帧（关键时间点）
3. 拼成联络表，整体看一遍节奏
4. 整片渲染
5. 跑 qa.mjs
6. 记录 → 下一段
```

错误成本在第一步最低，在第五步最高。

**静帧必须拼表看**，不要一帧一帧地看。单帧好看不代表动起来好看；反过来，单帧难看但节奏对的也有。

---

## 命令

```powershell
# Windows 必做：临时目录挪进项目，否则渲染中途 write EOF
New-Item -ItemType Directory -Path .tmp -Force | Out-Null
$env:TEMP = (Resolve-Path .tmp).Path; $env:TMP = $env:TEMP; $env:TMPDIR = $env:TEMP

# 静帧
npx remotion still <Id> out/chk/f0060.png --frame=60

# 整片
npx remotion render <Id> out/film.mp4 --crf=17 --x264-preset=medium --concurrency=6

# 校验（时长必须与期望一致）
node scripts/qa.mjs out/film.mp4 161 30
```

`qa.mjs` 检查：编码 / 像素格式 / 分辨率 / 帧率 / 帧数 / 时长 / 音轨 / 平均响度 / 真峰值 / 黑场。
任何一项不过，不要发。

---

## 联络表

```powershell
ffmpeg -y -i film.mp4 -vf "fps=1/2.5,scale=320:-1,tile=6x6" out/contact.png
```

每 2.5 秒抽一帧，6×6 拼图。**先看这张，再决定要不要逐帧调。**

---

## 配乐校验

生成 WAV 后必须验证包络，不能靠听：

```python
import numpy as np, wave
w = wave.open("public/audio/x.wav", "rb")
a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
a = a.reshape(-1, w.getnchannels()).mean(axis=1)
sr = w.getframerate()
for i in range(len(a) // sr):
    seg = a[i * sr : (i + 1) * sr]
    print(i, round(20 * np.log10(max(np.sqrt((seg**2).mean()), 1e-9)), 1))
```

要确认的：静音段真的静下来了（目标 −36 dB 左右），落地处真的回来了（−20 左右）。

---

## 版本

改过一版就存一版，不要覆盖：

```
out/film-v1.mp4    ← 送去评审的
out/film-v2.mp4    ← 按评审改的
```

评审的意见是对着某一版说的，覆盖了就没法回溯。
