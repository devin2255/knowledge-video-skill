"""Code-synthesised sound toolkit for 《命运是既定的吗？》.

Everything here is generated from oscillators, noise and filters -- no samples,
no downloads. The palette is deliberately "clockwork / astrolabe": mechanical
ticks, struck metal, plucked strings, low brass and sub-bass.

Musical grid: 120 BPM -> 0.5 s per beat, 2.0 s per bar.
"""

from __future__ import annotations

import math
import wave
from pathlib import Path

import numpy as np

SR = 48_000
TWO_PI = 2.0 * math.pi
rng = np.random.default_rng(20261023)


# ------------------------------------------------------------------ utilities


def t_axis(duration: float) -> np.ndarray:
    return np.arange(max(1, int(round(duration * SR))), dtype=np.float64) / SR


def noise(n: int) -> np.ndarray:
    return rng.standard_normal(n)


def fade(x: np.ndarray, fade_in: float = 0.002, fade_out: float = 0.03) -> np.ndarray:
    y = np.array(x, dtype=np.float64, copy=True)
    if y.ndim == 1:
        ni = min(len(y), max(1, int(fade_in * SR)))
        no = min(len(y), max(1, int(fade_out * SR)))
        y[:ni] *= np.linspace(0.0, 1.0, ni) ** 0.6
        y[-no:] *= np.linspace(1.0, 0.0, no) ** 0.8
        return y
    return np.stack([fade(y[:, c], fade_in, fade_out) for c in range(y.shape[1])], axis=1)


def peak(x: np.ndarray, target: float = 1.0) -> np.ndarray:
    m = float(np.max(np.abs(x))) if x.size else 0.0
    return x * (target / m) if m > 1e-9 else x


def soft_clip(x: np.ndarray, drive: float = 1.2) -> np.ndarray:
    return np.tanh(x * drive) / math.tanh(drive)


def db(x: float) -> float:
    return 10.0 ** (x / 20.0)


def fft_filter(
    x: np.ndarray,
    low: float | None = None,
    high: float | None = None,
    order: int = 2,
) -> np.ndarray:
    """Zero-phase Butterworth-ish magnitude shaping. `low` = lowpass corner."""
    if x.size == 0:
        return x
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1.0 / SR)
    gain = np.ones_like(f)
    if low is not None:
        gain *= 1.0 / np.sqrt(1.0 + (f / max(low, 1.0)) ** (2 * order))
    if high is not None:
        gain *= 1.0 / np.sqrt(1.0 + (max(high, 1.0) / np.maximum(f, 1.0)) ** (2 * order))
    return np.fft.irfft(spec * gain, n=len(x))


def adsr(n: int, a: float, d: float, s: float, r: float) -> np.ndarray:
    t = np.arange(n) / SR
    total = n / SR
    env = np.full(n, s)
    if a > 0:
        env = np.where(t < a, (t / a) ** 0.75, env)
    if d > 0:
        env = np.where((t >= a) & (t < a + d), 1.0 + (s - 1.0) * (t - a) / d, env)
    if r > 0:
        env = np.where(t > total - r, env * np.maximum(0.0, (total - t) / r), env)
    return np.clip(env, 0.0, 1.0)


def expsweep(n: int, tau: float) -> np.ndarray:
    t = np.arange(n) / SR
    return np.exp(-t / max(tau, 1e-5))


# --------------------------------------------------------------------- reverb


def _make_ir(duration: float, decay: float, predelay: float, tone: float) -> np.ndarray:
    n = int(duration * SR)
    t = np.arange(n) / SR
    ir = noise(n) * np.exp(-t / decay)
    ir = fft_filter(ir, low=tone)
    ir[: int(predelay * SR)] = 0.0
    return ir / np.max(np.abs(ir))


def reverb(x: np.ndarray, wet: float = 0.25, decay: float = 0.55, tone: float = 5200.0) -> np.ndarray:
    n = len(x) + 1
    ir = _make_ir(1.8, decay, 0.012, tone)
    nfft = 1 << (len(x) + len(ir) - 1).bit_length()
    conv = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
    conv = peak(conv, 1.0)
    return (1.0 - wet) * x + wet * conv


# ----------------------------------------------------------------- instruments


def tick(accent: bool = False, pitch: float = 1.0) -> np.ndarray:
    """Clock escapement: a wooden/metallic click with a resonant ping."""
    dur = 0.16 if accent else 0.12
    t = t_axis(dur)
    body = noise(len(t)) * np.exp(-t * 320.0)
    body = fft_filter(body, low=9_000, high=1_400)
    ping = np.sin(TWO_PI * (2_150 if accent else 1_720) * pitch * t) * np.exp(-t * 190.0)
    ping2 = 0.4 * np.sin(TWO_PI * (5_400 if accent else 4_300) * pitch * t) * np.exp(-t * 260.0)
    y = body * (0.85 if accent else 0.7) + 0.5 * ping + ping2 * 0.25
    return fade(peak(y, 1.0), 0.0006, 0.05)


def pluck(freq: float, duration: float = 1.1, damp: float = 0.494, bright: float = 0.5) -> np.ndarray:
    """Karplus-Strong: harpsichord / celesta-adjacent plucked string."""
    n = int(duration * SR)
    period = max(2, int(round(SR / freq)))
    delay = noise(period)
    delay = (1.0 - bright) * delay + bright * fft_filter(delay, low=freq * 7)
    y = np.zeros(n + period + 1)
    y[:period] = delay
    for i in range(period, len(y)):
        y[i] = damp * 0.5 * (y[i - period] + y[i - period + 1])
    y = y[:n]
    env = np.minimum(1.0, np.arange(n) / (0.001 * SR)) * np.exp(-np.arange(n) / SR / (duration * 0.9))
    y = y * env
    return fade(peak(y, 1.0), 0.0008, 0.04)


def bell(freq: float, duration: float = 2.4, index: float = 2.2, ratio: float = 3.01) -> np.ndarray:
    """FM struck bell / glass."""
    t = t_axis(duration)
    mod = np.sin(TWO_PI * freq * ratio * t) * index * np.exp(-t * 2.4)
    y = np.sin(TWO_PI * freq * t + mod) * np.exp(-t * 1.25)
    y += 0.32 * np.sin(TWO_PI * freq * 2.0 * t) * np.exp(-t * 2.6)
    y += 0.14 * np.sin(TWO_PI * freq * 3.99 * t) * np.exp(-t * 4.2)
    y += 0.08 * np.sin(TWO_PI * freq * 5.42 * t) * np.exp(-t * 6.0)
    y *= np.minimum(1.0, t / 0.0015)
    return fade(peak(y, 1.0), 0.001, 0.12)


def boom(f_start: float = 78.0, f_end: float = 30.0, duration: float = 1.5, click: float = 0.3) -> np.ndarray:
    """Sub impact with a downward pitch glide."""
    t = t_axis(duration)
    k = np.exp(-t / 0.22)
    freq = f_end + (f_start - f_end) * k
    phase = TWO_PI * np.cumsum(freq) / SR
    y = np.sin(phase) * np.exp(-t / (duration * 0.34))
    y += 0.35 * np.sin(phase * 2.0) * np.exp(-t / 0.35)
    y = np.tanh(y * 1.5) / math.tanh(1.5)
    tr = noise(len(t)) * np.exp(-t * 120.0) * click
    tr = fft_filter(tr, low=3_500)
    y = y + tr
    return fade(peak(y, 1.0), 0.0012, 0.1)


def taiko(duration: float = 1.3, pitch: float = 1.0) -> np.ndarray:
    """Big skin drum: low body + skin noise."""
    t = t_axis(duration)
    body = np.sin(TWO_PI * 96.0 * pitch * t) * np.exp(-t * 5.2)
    body += 0.5 * np.sin(TWO_PI * 152.0 * pitch * t) * np.exp(-t * 8.0)
    skin = fft_filter(noise(len(t)), low=1_600, high=180) * np.exp(-t * 26.0) * 0.55
    y = body + skin
    return fade(peak(y, 1.0), 0.0015, 0.12)


def whoosh(duration: float = 0.8, f0: float = 240.0, f1: float = 5_200.0, curve: float = 2.0) -> np.ndarray:
    """Band-passed noise whose centre sweeps -- 'a line being drawn'."""
    n = int(duration * SR)
    x = noise(n)
    out = np.empty(n)
    # one-pole state-variable bandpass, time varying (small n keeps this cheap)
    low = 0.0
    band = 0.0
    for i in range(n):
        p = (i / n) ** curve
        fc = f0 * (f1 / f0) ** p
        f = 2.0 * math.sin(math.pi * min(fc, 9_000.0) / SR)
        q = 0.35
        high = x[i] - low - q * band
        band += f * high
        low += f * band
        out[i] = band
    env = np.sin(np.pi * np.clip(np.arange(n) / n, 0, 1) ** 0.75) ** 1.6
    out = out * env
    return fade(peak(out, 1.0), 0.004, 0.06)


def riser(duration: float = 1.6, f0: float = 120.0, f1: float = 900.0, noise_mix: float = 0.45) -> np.ndarray:
    """Saw stack + noise sweeping up: pre-impact tension."""
    t = t_axis(duration)
    p = (t / duration) ** 1.6
    freq = f0 * (f1 / f0) ** p
    phase = TWO_PI * np.cumsum(freq) / SR
    y = np.zeros_like(t)
    for k in range(1, 7):
        y += (1.0 / k) * np.sin(phase * k + 0.7 * k)
    y = fft_filter(y, low=1_200)
    nz = fft_filter(noise(len(t)), low=6_000, high=300)
    y = y * (1.0 - noise_mix) + nz * noise_mix
    env = (t / duration) ** 2.2
    return fade(peak(y * env, 1.0), 0.02, 0.02)


def shimmer(duration: float = 1.4, base: float = 1_200.0) -> np.ndarray:
    """Cluster of high partials, like frost / dust catching light."""
    t = t_axis(duration)
    y = np.zeros_like(t)
    for i, ratio in enumerate((1.0, 1.4983, 2.0, 2.5198, 3.0, 3.997, 5.04)):
        amp = 0.9 / (i + 1.6)
        y += amp * np.sin(TWO_PI * base * ratio * t + rng.uniform(0, 6.28)) * np.exp(-t * (2.2 + 0.7 * i))
    y *= np.minimum(1.0, t / 0.01)
    return fade(peak(y, 1.0), 0.004, 0.15)


def metal_hit(freq: float = 620.0, duration: float = 1.6, bright: float = 1.0) -> np.ndarray:
    """Anvil / struck plate -- arrival, reveal, cut."""
    t = t_axis(duration)
    y = np.zeros_like(t)
    for i, (ratio, amp, dec) in enumerate(
        ((1.0, 1.0, 1.1), (2.76, 0.6, 1.7), (5.40, 0.42, 2.4), (8.93, 0.28, 3.2), (13.3, 0.16, 4.4))
    ):
        y += amp * np.sin(TWO_PI * freq * ratio * t + i) * np.exp(-t * dec * (1.0 / bright))
    tr = fft_filter(noise(len(t)), low=9_000) * np.exp(-t * 200.0) * 0.5
    return fade(peak(y + tr, 1.0), 0.0008, 0.2)


def brass(freq: float, duration: float = 2.2, level: float = 1.0) -> np.ndarray:
    """Swelling low brass / horn section."""
    t = t_axis(duration)
    vib = 1.0 + 0.0022 * np.sin(TWO_PI * 4.1 * t - 0.4)
    y = np.zeros_like(t)
    for det in (-0.006, 0.0, 0.007):
        ph = TWO_PI * freq * (1.0 + det) * t * vib
        for k in range(1, 13):
            y += (1.0 / k**1.15) * np.sin(ph * k + rng.uniform(0, 0.2))
    y = fft_filter(y, low=1_900, order=2)
    env = adsr(len(t), 0.16, 0.5, 0.62, 0.55)
    return fade(peak(y * env, level), 0.01, 0.3)


def choir(freqs: list[float], duration: float = 2.4, level: float = 1.0) -> np.ndarray:
    """Formant-filtered saw stack -- wordless 'ah' pad."""
    t = t_axis(duration)
    y = np.zeros_like(t)
    for f in freqs:
        ph = TWO_PI * f * t
        for k in range(1, 11):
            y += (1.0 / k) * np.sin(ph * k + rng.uniform(0, 0.3))
    # crude formants
    y = fft_filter(y, low=2_600) * 0.8 + fft_filter(y, low=900, high=500) * 0.55
    y = fft_filter(y, low=3_200)
    env = adsr(len(t), 0.55, 0.6, 0.7, 0.7)
    return fade(peak(y * env, level), 0.05, 0.4)


def string_pad(freqs: list[float], duration: float = 2.4, level: float = 1.0) -> np.ndarray:
    t = t_axis(duration)
    y = np.zeros_like(t)
    for f in freqs:
        for det in (-0.0045, 0.0, 0.004):
            ph = TWO_PI * f * (1.0 + det) * t
            for k in range(1, 8):
                y += (1.0 / k**1.4) * np.sin(ph * k + rng.uniform(0, 0.4))
    y = fft_filter(y, low=1_500)
    env = adsr(len(t), 0.42, 0.5, 0.78, 0.5)
    return fade(peak(y * env, level), 0.04, 0.3)


def sub_drone(freqs: list[float], duration: float) -> np.ndarray:
    t = t_axis(duration)
    y = np.zeros_like(t)
    for i, f in enumerate(freqs):
        y += (1.0 / (i + 1) ** 0.8) * np.sin(TWO_PI * f * t + rng.uniform(0, 0.2))
    y = fft_filter(y, low=220.0)
    return y


def snap(duration: float = 0.09) -> np.ndarray:
    """Tiny mechanical latch -- for micro actions."""
    t = t_axis(duration)
    y = noise(len(t)) * np.exp(-t * 420.0)
    y = fft_filter(y, low=7_000, high=1_100)
    y += 0.4 * np.sin(TWO_PI * 1_900 * t) * np.exp(-t * 220.0)
    return fade(peak(y, 1.0), 0.0004, 0.02)


def glitch(duration: float = 0.36) -> np.ndarray:
    """Digital stutter -- things being erased."""
    t = t_axis(duration)
    steps = 14
    hold = max(1, len(t) // steps)
    y = np.zeros_like(t)
    for s in range(steps):
        a, b = s * hold, min(len(t), (s + 1) * hold)
        if a >= b:
            break
        f = 220.0 * (1.9 ** (s % 5)) * (1.0 if s % 2 == 0 else 0.5)
        seg = np.arange(b - a) / SR
        gate = 1.0 if (s % 3) else 0.35
        y[a:b] = np.sign(np.sin(TWO_PI * f * seg)) * gate
    y = fft_filter(y, low=6_000, high=200)
    y *= np.exp(-t * 9.0)
    return fade(peak(y, 1.0), 0.002, 0.03)



# ------------------------------------------------------------------ dynamics


def limiter(x: np.ndarray, thresh: float = 0.75, release_ms: float = 180.0) -> np.ndarray:
    """Peak limiter with instant attack and a smooth release.

    Works on 1 ms blocks (fast to compute) and is interpolated back to audio
    rate, so it is safe for full-length mixes.
    """
    block = max(1, int(0.001 * SR))
    n = x.shape[0]
    nb = n // block
    if nb < 2:
        return x
    mono = np.abs(x).max(axis=1) if x.ndim == 2 else np.abs(x)
    peaks = mono[: nb * block].reshape(nb, block).max(axis=1)
    rel = math.exp(-block / (release_ms * 0.001 * SR))
    g = np.ones(nb)
    cur = 1.0
    for i in range(nb):
        target = min(1.0, thresh / max(float(peaks[i]), 1e-9))
        cur = target if target < cur else target + (cur - target) * rel
        g[i] = cur
    g = np.repeat(g, block)
    pad = n - len(g)
    if pad > 0:
        g = np.concatenate([g, np.full(pad, g[-1])])
    return x * (g[:, None] if x.ndim == 2 else g)


def saturate(x: np.ndarray, drive: float = 1.6) -> np.ndarray:
    return np.tanh(x * drive) / math.tanh(drive)
# ------------------------------------------------------------------- assembly


class Stem:
    """A stereo buffer that instruments get placed into."""

    def __init__(self, duration: float):
        self.n = int(round(duration * SR))
        self.buf = np.zeros((self.n, 2), dtype=np.float64)

    def add(self, sig: np.ndarray, at: float, gain: float = 1.0, pan: float = 0.0) -> None:
        if sig is None or sig.size == 0:
            return
        start = int(round(at * SR))
        if start >= self.n:
            return
        if start < 0:
            sig = sig[-start:]
            start = 0
        n = min(len(sig), self.n - start)
        if n <= 0:
            return
        seg = sig[:n] * gain
        # constant-power pan, -1..1
        ang = (np.clip(pan, -1, 1) + 1.0) * math.pi / 4.0
        self.buf[start : start + n, 0] += seg * math.cos(ang) * 1.4142
        self.buf[start : start + n, 1] += seg * math.sin(ang) * 1.4142


def write_wav(path: Path, audio: np.ndarray, target_peak: float = 0.89) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    audio = np.atleast_2d(audio.T).T if audio.ndim == 1 else audio
    audio = peak(audio, target_peak)
    data = np.clip(audio, -1.0, 1.0)
    pcm = (data * 32767.0).astype(np.int16)
    with wave.open(str(path), "wb") as fh:
        fh.setnchannels(2)
        fh.setsampwidth(2)
        fh.setframerate(SR)
        fh.writeframes(pcm.tobytes())
    rms = float(np.sqrt(np.mean(audio**2)))
    print(f"  {path.name:<22} {len(audio) / SR:6.2f}s  peak={np.max(np.abs(audio)):.3f}  rms={20 * math.log10(max(rms, 1e-9)):6.1f} dBFS")


