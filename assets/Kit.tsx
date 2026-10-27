import React from "react";
import { AbsoluteFill } from "remotion";

/** Shared furniture for the Vibe-style episodes. */

export const VW = 1920;
export const VH = 1080;

export const VC = {
  bg: "#0A0A1E",
  ink: "#05060F",
  gold: "#D6B178",
  goldPale: "#F6D89A",
  ice: "#64E3F6",
  paper: "#EDE7DB",
  dim: "rgba(237,231,219,0.5)",
  red: "#E4583F",
};

export const SERIF = '"STZhongsong", "华文中宋", "SimSun", serif';
export const SANS = '"Noto Sans SC VF", "Microsoft YaHei", sans-serif';
export const MONO = '"Consolas", monospace';

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const at = (t: number, a: number, b: number) => ease((t - a) / Math.max(0.001, b - a));
export const win = (t: number, a: number, b: number, f = 0.8) =>
  clamp01((t - a) / f) * clamp01((b - t) / f);

export const Dust: React.FC<{ t: number }> = ({ t }) => {
  const pts = React.useMemo(() => {
    let s = 20261026;
    const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    return Array.from({ length: 140 }, () => ({
      x: rnd() * VW,
      y: rnd() * VH,
      r: 0.6 + rnd() * 1.8,
      a: 0.04 + rnd() * 0.24,
      sp: 0.2 + rnd() * 0.9,
      ph: rnd() * 6.28,
    }));
  }, []);
  return (
    <svg width={VW} height={VH} style={{ position: "absolute", inset: 0 }}>
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x + Math.sin(t * 0.07 * p.sp + p.ph) * 16}
          cy={p.y - ((t * 3.2 * p.sp) % (VH + 200)) + 100}
          r={p.r}
          fill={VC.gold}
          opacity={p.a}
        />
      ))}
    </svg>
  );
};

export const VibeStage: React.FC<{ t: number; endAt: number; children: React.ReactNode }> = ({
  t,
  endAt,
  children,
}) => (
  <AbsoluteFill style={{ backgroundColor: VC.bg }}>
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(58% 44% at 50% 42%, rgba(28,36,74,0.9) 0%, rgba(10,10,30,0) 68%), radial-gradient(80% 60% at 50% 108%, rgba(60,44,20,0.32) 0%, rgba(10,10,30,0) 70%)",
      }}
    />
    <Dust t={t} />
    {children}
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 92% 78% at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 82%, rgba(0,0,0,0.88) 100%)",
      }}
    />
    <AbsoluteFill style={{ opacity: clamp01((t - endAt) / 1.4), background: "#04050C" }} />
  </AbsoluteFill>
);

export type Sub = { a: number; b: number; text: string; hl?: string; size?: number };

export const VibeSubtitles: React.FC<{ t: number; subs: Sub[] }> = ({ t, subs }) => {
  const cur = subs.find((s) => t >= s.a && t <= s.b);
  if (!cur) return null;
  const o = clamp01((t - cur.a) / 0.28) * clamp01((cur.b - t) / 0.32);
  const chars = [...cur.text];
  const hl = cur.hl ?? "";
  const hlStart = hl ? cur.text.indexOf(hl) : -1;
  const hlEnd = hlStart >= 0 ? hlStart + hl.length : -1;
  return (
    <div
      style={{
        position: "absolute",
        left: 160,
        right: 160,
        top: 872,
        textAlign: "center",
        opacity: o,
        fontFamily: SANS,
        fontSize: cur.size ?? 42,
        fontWeight: 400,
        letterSpacing: "0.05em",
        lineHeight: 1.5,
        color: VC.paper,
        textShadow: "0 2px 24px rgba(0,0,0,0.9)",
      }}
    >
      {chars.map((ch, i) => {
        const shown = clamp01((t - cur.a - i * 0.026) / 0.22);
        const gold = hlStart >= 0 && i >= hlStart && i < hlEnd;
        return (
          <span
            key={i}
            style={{
              opacity: shown,
              filter: `blur(${(1 - shown) * 5}px)`,
              color: gold ? VC.goldPale : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

export const VibeTitleCard: React.FC<{ t: number; a: number; b: number; cn: string; en: string; sub: string }> = ({
  t,
  a,
  b,
  cn,
  en,
  sub,
}) => {
  const o = win(t, a, b, 0.9);
  if (o <= 0.001) return null;
  const flash = t > a && t < a + 0.3 ? 0.45 : 0;
  const p = at(t, a + 0.2, a + 3.0);
  return (
    <AbsoluteFill style={{ opacity: o, background: `rgba(5,6,15,${0.82 * o})` }}>
      <AbsoluteFill style={{ background: `rgba(255,255,255,${flash})` }} />
      <svg width={VW} height={VH} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 36 }, (_, i) => {
          const ang = (i / 36) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={VW / 2 + Math.cos(ang) * 120}
              y1={430 + Math.sin(ang) * 120}
              x2={VW / 2 + Math.cos(ang) * (120 + 260 * p)}
              y2={430 + Math.sin(ang) * (120 + 260 * p)}
              stroke={VC.gold}
              strokeOpacity={0.16 * p}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 396,
          textAlign: "center",
          fontFamily: SERIF,
          fontSize: 92,
          letterSpacing: "0.16em",
          color: VC.goldPale,
          opacity: at(t, a + 0.6, a + 2.4),
          textShadow: "0 0 60px rgba(214,177,120,0.45)",
        }}
      >
        {cn}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 534,
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 20,
          letterSpacing: "0.46em",
          color: "rgba(214,177,120,0.65)",
          opacity: at(t, a + 1.2, a + 3.0),
        }}
      >
        {en}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 604,
          textAlign: "center",
          fontFamily: SANS,
          fontSize: 26,
          fontWeight: 300,
          letterSpacing: "0.14em",
          color: "rgba(237,231,219,0.6)",
          opacity: at(t, a + 1.8, a + 3.8),
        }}
      >
        {sub}
      </div>
    </AbsoluteFill>
  );
};

export const VibeEndCard: React.FC<{ t: number; a: number; cn: string; en: string; lines: string[] }> = ({
  t,
  a,
  cn,
  en,
  lines,
}) => {
  const o = win(t, a, 400, 1.2);
  if (o <= 0.001) return null;
  return (
    <AbsoluteFill style={{ opacity: o, background: `rgba(5,6,15,${0.86 * o})` }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 292,
          textAlign: "center",
          fontFamily: SERIF,
          fontSize: 72,
          letterSpacing: "0.16em",
          color: VC.goldPale,
        }}
      >
        {cn}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 392,
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 16,
          letterSpacing: "0.44em",
          color: "rgba(214,177,120,0.6)",
        }}
      >
        {en}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 510,
          textAlign: "center",
          fontFamily: SANS,
          fontSize: 19,
          lineHeight: 2.0,
          color: "rgba(237,231,219,0.52)",
          whiteSpace: "pre-line",
        }}
      >
        {lines.join("\n")}
      </div>
    </AbsoluteFill>
  );
};
