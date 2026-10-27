"""EP.05《一年有多长》配乐 —— 声音跟着画面走。

关键事件：
  15.6–17.6  上升音，镜头开始坠入日历
  17.6–19.0  全片静音 0.9 秒（坠落中），只剩风声
  19.0       落地：低频 boom
  46.0–70.6  十二次刻度声，每出现一个"事件切片"响一下
  76.0–124   行走的低声 pulse（那条路）
  152.2      只剩一格
  156.4      最后一格熄灭：一个单音
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

import numpy as np

import synth as S
from synth import Stem, write_wav

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio"

BPM = 76.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT

DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 161.0
NAME = sys.argv[2] if len(sys.argv) > 2 else "year-bgm"

CHORDS = {
    "Am": ([220.00, 261.63, 329.63], 110.00, [440.00, 523.25, 659.26]),
    "F": ([174.61, 220.00, 261.63], 87.31, [349.23, 440.00, 523.25]),
    "C": ([261.63, 329.63, 392.00], 130.81, [523.25, 659.26, 783.99]),
    "G": ([196.00, 246.94, 293.66], 98.00, [392.00, 493.88, 587.33]),
}
CYCLE = ["Am", "F", "C", "G"]

# (start, end, pad, piano, kick)
SECTIONS = [
    (0.0, 15.6, 0.42, 0.24, 0.00),    # 那面墙
    (15.6, 17.6, 0.55, 0.20, 0.14),   # 起势
    (17.6, 19.0, 0.00, 0.00, 0.00),   # 坠落：全静
    (19.0, 43.0, 0.52, 0.28, 0.10),   # 两根柱子：冷静
    (43.0, 76.0, 0.46, 0.34, 0.20),   # 切片：机械
    (76.0, 124.0, 0.60, 0.26, 0.16),  # 那条路：行进
    (124.0, 152.0, 0.66, 0.32, 0.06), # 退回：回暖
    (152.0, 999.0, 0.24, 0.14, 0.00), # 只剩一格
]

TICKS = [46.0, 49.4, 52.4, 55.2, 58.0, 60.4, 62.6, 64.6, 66.4, 68.0, 69.4, 70.6]
DIVE_IN, DIVE_OUT = 17.6, 19.0
LAST_CELL = 156.4

_cache: dict = {}


def cached(key, make):
    if key not in _cache:
        _cache[key] = make()
    return _cache[key]


def section_at(t: float):
    for a, b, p, q, k in SECTIONS:
        if a <= t < b:
            return p, q, k
    return 0.0, 0.0, 0.0


def thump(freq: float, dur: float = 0.9) -> np.ndarray:
    t = S.t_axis(dur)
    y = np.sin(S.TWO_PI * freq * t) * np.exp(-t * 5.0)
    y += 0.22 * np.sin(S.TWO_PI * freq * 2 * t) * np.exp(-t * 9.0)
    return S.fade(S.peak(np.tanh(y * 1.2) / math.tanh(1.2), 1.0), 0.002, 0.2)


def main() -> None:
    music = Stem(DUR)
    n = music.n
    tt = np.arange(n) / S.SR

    # ---------- 底噪：低频本体 + 空气
    drone = S.sub_drone([55.0, 110.0, 164.81], DUR)
    breath = 0.86 + 0.14 * np.sin(2 * np.pi * tt / 5.2)  # 5.2 秒一次的"呼吸"
    swell = 0.55 + 0.45 * np.sin(np.linspace(0, 9.0, n))
    music.add(drone * swell * breath, 0.0, 0.05)

    air = S.fft_filter(S.noise(n), low=1200, high=90) * 0.009
    music.add(air * (0.6 + 0.4 * np.sin(2 * np.pi * 0.06 * tt)), 0.0, 1.0)

    # ---------- 和声与钢琴
    bars = int(DUR / BAR) + 1
    for bar in range(bars):
        at = bar * BAR
        if at >= DUR:
            break
        name = CYCLE[(bar // 2) % 4]
        notes, bass, arp = CHORDS[name]
        pad_g, piano_g, kick_g = section_at(at)

        if pad_g > 0 and bar % 2 == 0:
            music.add(cached(("pad", name), lambda notes=notes: S.string_pad(notes, 7.2)), at, pad_g * 0.17, pan=-0.06)

        if kick_g > 0:
            music.add(cached(("thump", bass), lambda bass=bass: thump(bass)), at, kick_g * 0.28)

        if piano_g > 0:
            for k, note in enumerate(arp):
                music.add(
                    cached(("pluck", note), lambda note=note: S.pluck(note, 2.2, 0.4985, 0.42)),
                    at + k * BEAT * 1.34,
                    piano_g * (0.9 if k == 0 else 0.62),
                    pan=[-0.2, 0.16, 0.02][k],
                )

    # ---------- 事件层
    # 1) 上升：镜头起势
    music.add(S.riser(2.0, 80.0, 1500.0, 0.55), 15.6, 0.20, pan=0.0)
    # 2) 坠落：高频扫到下，和静音同时发生
    music.add(S.whoosh(1.35, 2600.0, 140.0, 1.6), DIVE_IN, 0.26)
    # 3) 落地
    music.add(S.boom(74.0, 28.0, 2.2, 0.22), DIVE_OUT, 0.34)
    music.add(S.metal_hit(196.0, 2.6, 0.5), DIVE_OUT + 0.02, 0.06, pan=0.08)

    # 4) 十二次刻度
    for i, tk in enumerate(TICKS):
        music.add(cached(("tick", i), lambda i=i: S.tick(i % 3 == 0, 0.9 + 0.1 * i)), tk, 0.075 + (0.02 if i % 3 == 0 else 0), pan=-0.25 + 0.04 * i)

    # 5) 那条路：极轻的脚步式低频
    for k in range(6):
        music.add(cached("step", lambda: thump(58.0, 1.1)), 80.0 + k * 6.5, 0.05, pan=0.0)

    # 6) 只剩一格 → 最后一格熄灭
    music.add(cached(("last", 392.0), lambda: S.bell(392.00, 5.0, 1.0, 2.0)), LAST_CELL, 0.115, pan=0.0)
    music.add(cached(("last2", 261.63), lambda: S.bell(261.63, 6.0, 0.8, 2.0)), LAST_CELL + 0.5, 0.07, pan=-0.12)

    # ---------- 坠落处的静音（把整轨压下去，只留 whoosh）
    duck = np.ones(n)
    a = int(15.6 * S.SR)
    b = int(DIVE_IN * S.SR)
    c = int(DIVE_OUT * S.SR)
    d = int((DIVE_OUT + 1.6) * S.SR)
    duck[a:b] = np.linspace(1.0, 0.16, b - a)          # 起势时抽走
    duck[b:c] = 0.02                                    # 坠落：几乎全静
    duck[c:d] = np.linspace(0.02, 1.0, d - c) ** 1.6    # 落地后慢慢回来
    music.buf = music.buf * duck[:, None]

    music.buf = np.stack([S.fade(S.reverb(music.buf[:, c], 0.30, 0.95), 1.2, 3.2) for c in range(2)], axis=1)

    score = S.saturate(music.buf, 1.10)
    score = S.limiter(score, 0.62, 300.0)
    score = S.peak(score, 0.62)
    score = np.stack([S.fade(score[:, c], 1.4, 3.4) for c in range(2)], axis=1)

    print(f"year bgm  {DUR:.1f}s  @ {BPM} BPM")
    write_wav(OUT / f"{NAME}.wav", score, 0.62)
    rms = 20 * np.log10(max(float(np.sqrt(np.mean(score**2))), 1e-9))
    print(f"  rms {rms:.1f} dBFS")


if __name__ == "__main__":
    main()


