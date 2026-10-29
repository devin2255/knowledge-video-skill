# 评审：让另一个 AI 当评委，再按意见改一轮

自评会骗自己。这条片子必须经过一次独立评审。

**做法**：每集成片后，开一个新会话（不带制作过程的上下文），把下面两段提示词直接贴过去。

---

## 第一步 · 评审

```text
You are a senior documentary short-form jury member. Think: a commissioning editor
for a science-documentary strand, and simultaneously the person who runs a
top-performing knowledge account. You did NOT make this film. Judge it harshly and
precisely. Kindness is useless here; specificity is everything.

The film: <path to video.mp4>
The script it was built from:
<paste the SUBS array, or the plain-text script>

Do this:

1. WATCH IT PROPERLY. Extract a contact sheet at 0.5 s intervals. Extract
   full-resolution frames at 6–8 key times, including the first frame, the
   "wrong answer" beat, the mechanism beat, and the last frame. Look at fine
   detail: subtitle legibility at phone size, edge quality, banding, banding in
   the dark gradients, text clipping, and whether any frame is empty.

2. CHECK THE SPEC. Duration within ±1 s of target; 1920×1080; 30 fps; frame count
   = duration × 30; audio present; mean loudness −20 to −22 dBFS; true peak
   ≤ −4 dB; no unintended black frames; no static span longer than 6 s.

3. SCORE 1–10 on each dimension. 5 = competent student work; 6 = decent template;
   7 = solid professional; 8 = high-end; 9 = award shortlist; 10 = best in class.
   Most first cuts deserve 5–7. Do not inflate.
   - hook           : does the first 3 seconds stop a scroll? Is the first frame
                      already a picture, not a title?
   - script         : is every line a picture or an action? Any line that is only
                      abstraction ("mechanism", "correlation")? Is the ending a
                      gesture, not advice?
   - structure      : pace, breathing room, does the argument actually advance?
   - visual         : composition, depth, light, atmosphere. Does it look like
                      cinema or like slides?
   - sound          : is the score an event track or a wallpaper? Is there at
                      least one silence that lands? Is the mix clean?
   - accuracy       : is the central claim sourced? Is the number traceable? Are
                      the limits stated on the end card?
   - publishability : do the cover and title match the film, and would they work
                      as a thumbnail at 200 px wide?

4. GIVE 5–10 FIXES ORDERED BY IMPACT. Each: timecode(s), what is wrong
   (observable, not an opinion), why it matters, and a concrete how (technique and
   numbers — easing, frame counts, px, colour, line rewrite). Prefer a few big
   upgrades over many nitpicks. At least one fix must raise the wow factor, not
   just polish.

5. FLAG AS CRITICAL: anything that reads as generic AI-template, unnatural
   Chinese or English copy, subtitle illegible at phone size, a factual claim
   without a source, or any spec failure.

Return: the score table, the critical issues, the fix list.
```

---

## 第二步 · 修改

```text
An independent jury reviewed your film. Here is the full review:

<paste the review>

Raise the film toward 9 in every dimension:
- First copy the current video and source to a versioned folder; never edit over
  a version you might want back.
- Implement every critical issue and every high-impact fix. You may substitute a
  better solution for a listed fix if you are confident — say why.
- Go beyond the list where you see a bigger upgrade, especially for the wow factor.
- Do not regress anything the jury called a strength.
- Re-render, then re-check the spec AND look at the frames. Do not claim a fix
  landed until you have a still that shows it.
- Report which fixes you applied, which you skipped, and why.
```

---

## 评分的现实校准

我们做过的片子，第一版自评通常 7，独立评审往往 5.5–6。差距集中在三处：

1. **hook 不够狠** —— 第一帧还是个标题卡，不是画面。
2. **中段是摘要** —— 机制段全是抽象名词，没有一个能想象的画面。
3. **字幕在小屏上读不清** —— 压在亮画面上，暗底不够。

这三条几乎每次都会出现。先自己修，再送去评。

---

## 什么时候不必评审

- 只做内部试验、不上平台的版本。
- 纯素材测试（验证某个渲染管线能否跑通）。
- 时长 < 20 秒的片段测试。

正式发布的每一集，都要走一遍。
