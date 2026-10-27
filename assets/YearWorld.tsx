import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { VibeEndCard } from "../components/vibe/Kit";

/**
 * 《为什么长大后，一年比一年短》
 * 摄影：全景墙 / 推镜 / 空气 / 坠入与退回
 */

const W = 1920;
const H = 1080;

const C = {
  ink: "#040404",
  paper: "#EFE8DA",
  warm: "#F0C070",
  warmPale: "#FFDCA8",
  warmDim: "#B98A47",
  ice: "#8FD3E8",
  gray: "#8C8578",
  red: "#E4583F",
};
const SERIF = '"STZhongsong", "华文中宋", "SimSun", serif';
const SANS = '"Noto Sans SC VF", "Microsoft YaHei", sans-serif';
const MONO = '"Consolas", monospace';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const at = (t: number, a: number, b: number) => ease((t - a) / Math.max(0.001, b - a));

const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

const Defs: React.FC = () => (
  <defs>
    <linearGradient id="fogGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#040404" stopOpacity="0" />
      <stop offset="55%" stopColor="#040404" stopOpacity="0.7" />
      <stop offset="100%" stopColor="#040404" stopOpacity="1" />
    </linearGradient>
    {[
      ["240,192,112", "#FFD9A0"],
      ["143,211,232", "#8FD3E8"],
      ["255,255,255", "#FFFFFF"],
    ].map(([k, col]) => (
      <radialGradient key={k} id={`glow-${k}`}>
        <stop offset="0%" stopColor={col} stopOpacity="0.85" />
        <stop offset="35%" stopColor={col} stopOpacity="0.26" />
        <stop offset="100%" stopColor={col} stopOpacity="0" />
      </radialGradient>
    ))}
  </defs>
);

const Glow: React.FC<{ x: number; y: number; r: number; c?: string; o?: number }> = ({ x, y, r, c = "240,192,112", o = 0.5 }) => (
  <circle cx={x} cy={y} r={r} fill={`url(#glow-${c})`} opacity={o} />
);

const Fog: React.FC<{ y?: number; h?: number; o?: number }> = ({ y = 640, h = 440, o = 0.9 }) => (
  <rect x={0} y={y} width={W} height={h} fill="url(#fogGrad)" opacity={o} />
);

/* ---------------------------------------------------------- 空气与胶片 */

const Dust: React.FC<{ t: number; n?: number; o?: number; c?: string }> = ({ t, n = 70, o = 1, c = "#FFD79A" }) => {
  const pts = React.useMemo(() => {
    const r = rng(313);
    return Array.from({ length: n }, () => ({
      x: r() * W,
      y: r() * H,
      s: 0.6 + r() * 2.0,
      v: 2 + r() * 7,
      ph: r() * 6.28,
      a: 0.06 + r() * 0.22,
    }));
  }, [n]);
  return (
    <g opacity={o}>
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x + Math.sin(t * 0.28 + p.ph) * 22}
          cy={p.y - ((t * p.v) % (H + 120)) + 60}
          r={p.s}
          fill={c}
          opacity={p.a * (0.45 + 0.55 * Math.sin(t * 0.9 + p.ph) ** 2)}
        />
      ))}
    </g>
  );
};

/** 色温漂移 + 暗角 + 颗粒 */
const Grade: React.FC<{ t: number }> = ({ t }) => {
  const warmEarly = 1 - at(t, 0, 22);
  const coolMid = at(t, 30, 60) * (1 - at(t, 100, 128));
  const warmEnd = at(t, 128, 148);
  const tint = warmEarly > 0.5 ? "255,176,96" : "150,190,255";
  return (
    <>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 120% 90% at 50% 42%, rgba(${tint},${0.03 + coolMid * 0.02 + warmEnd * 0.04}) 0%, rgba(0,0,0,0) 62%)`,
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 78% 62% at 50% 46%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.9) 100%)",
        }}
      />
      <Img
        src={staticFile("grain.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.16,
          mixBlendMode: "overlay",
        }}
      />
    </>
  );
};

/** 背对镜头的人：站在墙前，缓慢呼吸。全片唯一的身体。 */
const Figure: React.FC<{ t: number; x: number; o: number; s?: number }> = ({ t, x, o, s = 1 }) => {
  const br = 1 + 0.006 * Math.sin((2 * Math.PI * t) / 5.2);
  return (
    <g opacity={o} transform={`translate(${x} 1080) scale(${s} ${s * br})`}>
      <path d="M -186 0 C -182 -196, -112 -306, -54 -342 L 54 -342 C 112 -306, 182 -196, 186 0 Z" fill="#060605" />
      <circle cx={0} cy={-398} r={63} fill="#060605" />
      <path d="M -184 0 C -180 -198, -110 -308, -52 -344" fill="none" stroke="#6E5C3E" strokeWidth={2.6} opacity={0.42} />
      <path d="M -58 -440 A 63 63 0 0 1 44 -446" fill="none" stroke="#8C7649" strokeWidth={2.6} opacity={0.5} />
      <path d="M -6 -300 C -30 -250, -34 -190, -26 -120" fill="none" stroke="#241E16" strokeWidth={2} opacity={0.8} />
    </g>
  );
};
/* ------------------------------------------------------- 日历（全景墙） */

const CAL_COLS = 44;
const CAL_ROWS = 24;
const CAL_N = CAL_COLS * CAL_ROWS;
const CELL = 30;
const GAP = 11;

const Calendar: React.FC<{ t: number; mode: "decay" | "rekindle"; push?: number }> = ({ t, mode, push = 1 }) => {
  const { keeps, order } = React.useMemo(() => {
    const r = rng(1907);
    const keep = new Set<number>();
    while (keep.size < 8) keep.add(Math.floor(r() * CAL_N));
    const ord = Array.from({ length: CAL_N }, (_, i) => i).sort(() => r() - 0.5);
    return { keeps: keep, order: ord };
  }, []);

  const spanW = CAL_COLS * (CELL + GAP) - GAP;
  const spanH = CAL_ROWS * (CELL + GAP) - GAP;
  const X0 = (W - spanW) / 2;
  const Y0 = (H - spanH) / 2 - 40;

  const hero = Array.from(keeps).reduce((best, i) => {
    const d = (i % CAL_COLS - CAL_COLS / 2) ** 2 + (Math.floor(i / CAL_COLS) - CAL_ROWS / 2) ** 2;
    const b = (best % CAL_COLS - CAL_COLS / 2) ** 2 + (Math.floor(best / CAL_COLS) - CAL_ROWS / 2) ** 2;
    return d < b ? i : best;
  }, Array.from(keeps)[0]);
  const alone = mode === "rekindle" ? at(t, 152.4, 154.4) : 0;
  const heroOut = mode === "rekindle" ? 1 - at(t, 155.6, 157.3) : 1;
  const progress = mode === "decay" ? at(t, 9.4, 14.6) : at(t, 124.5, 152.0);
  const fadeOut = mode === "rekindle" ? (t < 149.5 ? 1 : 0.62 * (1 - at(t, 155.0, 156.6))) : 1;

  // 一道缓慢扫过的光，像有人提灯走过这面墙
  const sweep = ((t * 0.16) % 2.2) - 0.6;
  const sweepX = sweep * spanW;

  return (
    <g opacity={fadeOut}>
      <g transform={`translate(${W / 2} ${H / 2 - 40}) scale(${push}) translate(${-W / 2} ${-(H / 2 - 40)})`}>
        <Glow x={W / 2} y={H / 2 - 40} r={900} c="240,192,112" o={0.05} />
        {Array.from({ length: CAL_N }, (_, i) => {
          const col = i % CAL_COLS;
          const row = Math.floor(i / CAL_COLS);
          const x = X0 + col * (CELL + GAP);
          const y = Y0 + row * (CELL + GAP);
          const keep = keeps.has(i);
          const rank = mode === "decay" ? i / CAL_N : order.indexOf(i) / CAL_N;
          let lit: number;
          if (mode === "decay") {
            lit = 1 - clamp01((progress - rank * 0.94) / 0.05);
          } else {
            lit = clamp01((progress - rank * 0.55) / 0.1);
          }
          if (keep) lit = 1;
          const d = Math.abs(x + CELL / 2 - (W / 2 + sweepX));
          const kiss = Math.max(0, 1 - d / 260) * 0.3;
          const alpha = 0.11 + 0.89 * lit + kiss;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={CELL}
              height={CELL}
              rx={3}
              fill={keep ? C.warmPale : lit > 0.5 ? C.warm : "#241F18"}
              opacity={Math.min(1, (keep ? 0.95 : alpha * (mode === "rekindle" ? 0.46 : 0.85)) * (mode === "rekindle" ? (i === hero ? heroOut : 1 - alone * 0.97) : 1))}
            />
          );
        })}
        {Array.from(keeps).map((i, k) => {
          const col = i % CAL_COLS;
          const row = Math.floor(i / CAL_COLS);
          const x = X0 + col * (CELL + GAP) + CELL / 2;
          const y = Y0 + row * (CELL + GAP) + CELL / 2;
          const isHero = i === hero;
          return (
            <Glow
              key={k}
              x={x}
              y={y}
              r={isHero ? 54 + 260 * alone : 54}
              c="240,192,112"
              o={(0.3 + 0.16 * Math.sin(t * 1.8 + k)) * (isHero ? heroOut * (1 + alone) : 1 - alone * 0.92)}
            />
          );
        })}
      </g>
    </g>
  );
};

/* ------------------------------------------------------- 两个人生刻度 */

const Ratio: React.FC<{ t: number }> = ({ t }) => {
  const fillA = at(t, 23.3, 27.8);
  const fillB = at(t, 28.5, 33.0);
  const cross = at(t, 38.1, 41.2);

  const Column: React.FC<{ x: number; n: number; label: string; sub: string; c: string; p: number }> = ({
    x,
    n,
    label,
    sub,
    c,
    p,
  }) => {
    const COL_H = 430;
    const COL_W = 128;
    const cell = COL_H / n;
    const top = 790 - COL_H;
    return (
      <g>
        <text x={x} y={top - 76} textAnchor="middle" fill={c} fontSize={46} fontFamily={MONO} opacity={0.95}>
          {label}
        </text>
        <text x={x} y={top - 34} textAnchor="middle" fill="#6A6152" fontSize={21} fontFamily={SANS} letterSpacing={5}>
          {sub}
        </text>
        {Array.from({ length: n }, (_, i) => {
          const y = 790 - (i + 1) * cell;
          const isYear = i === 0;
          return (
            <rect
              key={i}
              x={x - COL_W / 2}
              y={y + 1}
              width={COL_W}
              height={Math.max(1.6, cell - 2)}
              rx={1}
              fill={isYear ? c : "#2E2820"}
              opacity={isYear ? 0.35 + 0.65 * p : 0.9}
            />
          );
        })}
        <line x1={x - COL_W / 2 - 26} y1={790} x2={x + COL_W / 2 + 26} y2={790} stroke="#3A342A" strokeWidth={2} />
        <Glow x={x} y={790} r={190} c={n === 10 ? "143,211,232" : "240,192,112"} o={0.18 * p} />
      </g>
    );
  };

  return (
    <g>
      <Glow x={520} y={600} r={520} c="143,211,232" o={0.07} />
      <Glow x={1400} y={600} r={520} c="240,192,112" o={0.08} />
      <Column x={560} n={10} label="1/10" sub="十岁那年" c={C.ice} p={fillA} />
      <Column x={1360} n={50} label="1/50" sub="五十岁那年" c={C.warm} p={fillB} />
      <g opacity={cross}>
        <line x1={820} y1={300} x2={1100} y2={300} stroke={C.red} strokeOpacity={0.3} strokeDasharray="6 10" />
        <text x={960} y={278} textAnchor="middle" fill={C.red} fontSize={22} fontFamily={SANS} letterSpacing={6} opacity={0.85}>
          听起来对，但不对
        </text>
      </g>
    </g>
  );
};

/* --------------------------------------------------------- 事件切片 */

const Segments: React.FC<{ t: number }> = ({ t }) => {
  const barY = 470;
  const X0 = 300;
  const X1 = 1620;
  const ticks = [46.0, 49.4, 52.4, 55.2, 58.0, 60.4, 62.6, 64.6, 66.4, 68.0, 69.4, 70.6];
  const n = ticks.filter((x) => t >= x).length;
  const grow = clamp01(n / 12);
  const ribbonY = 700;

  return (
    <g>
      <Fog y={760} h={320} o={0.85} />
      <text x={X0} y={barY - 60} fill="#6A6152" fontSize={20} fontFamily={SANS} letterSpacing={6}>
        一段八十秒的经历
      </text>
      <rect x={X0} y={barY} width={X1 - X0} height={10} fill="#221C14" />
      <rect x={X0} y={barY} width={(X1 - X0) * at(t, 43.4, 46.0)} height={10} fill={C.warm} opacity={0.5} />
      {ticks.map((x, i) => {
        if (t < x) return null;
        const p = at(t, x, x + 0.35);
        const px = X0 + ((X1 - X0) * (i + 1)) / 13;
        return (
          <g key={i} opacity={p}>
            <Glow x={px} y={barY + 5} r={90} c="143,211,232" o={0.5 * (1 - p) + 0.12} />
            <line x1={px} y1={barY - 26 - 18 * (1 - p)} x2={px} y2={barY + 40} stroke={C.ice} strokeWidth={2} opacity={0.85} />
            <circle cx={px} cy={barY + 5} r={5} fill={C.ice} />
          </g>
        );
      })}
      <text x={X0} y={ribbonY - 34} fill="#6A6152" fontSize={20} fontFamily={SANS} letterSpacing={6}>
        回忆里的长度
      </text>
      <rect x={X0} y={ribbonY} width={1320 * grow * 0.86} height={16} fill={C.warm} opacity={0.22} />
      <rect x={X0} y={ribbonY} width={1320 * grow * 0.86} height={16} fill="none" stroke={C.warm} strokeOpacity={0.7} strokeWidth={2} />
      <Glow x={X0 + 1320 * grow * 0.86} y={ribbonY + 8} r={120} c="240,192,112" o={0.5} />
      <text x={X0 + 1320 * grow * 0.86 + 26} y={ribbonY + 15} fill={C.warmPale} fontSize={26} fontFamily={MONO} opacity={grow > 0.05 ? 0.95 : 0}>
        +{Math.round(n * 12)}s
      </text>
    </g>
  );
};

/* ------------------------------------------------------------- 那条路 */

const Road: React.FC<{ t: number }> = ({ t }) => {
  const vpx = W / 2;
  const vpy = 520;
  const passes = at(t, 86.4, 104.0);
  const trees = React.useMemo(() => {
    const r = rng(88);
    return Array.from({ length: 26 }, (_, i) => ({
      side: i % 2 === 0 ? -1 : 1,
      d: 0.06 + r() * 0.94,
      h: 0.7 + r() * 0.6,
    }));
  }, []);
  const sky = at(t, 107.6, 118.0);

  return (
    <g>
      <rect width={W} height={H} fill="#05060A" />
      <rect width={W} height={H} fill="url(#glow-143,211,232)" opacity={0.03 + sky * 0.03} />
      <Glow x={vpx} y={vpy - 60} r={620 * (1 - sky * 0.4)} c="240,192,112" o={0.16 * (1 - sky)} />
      <Glow x={vpx} y={vpy} r={900} c="143,211,232" o={0.05} />
      <polygon points={`${vpx - 70},${vpy} ${vpx + 70},${vpy} ${W + 400},${H + 60} -400,${H + 60}`} fill="#14120F" />
      {[-2, -1, 0, 1, 2].map((k) => (
        <line key={k} x1={vpx + k * 18} y1={vpy} x2={vpx + k * 420} y2={H + 60} stroke="#3A3128" strokeWidth={k === 0 ? 2.5 : 1.4} opacity={0.32} />
      ))}
      {trees.map((tr, i) => {
        const fade = clamp01(1 - passes * 1.15 - (i % 5) * 0.04);
        const y = vpy + Math.pow(tr.d, 1.9) * (H - vpy + 40);
        const scale = 0.25 + tr.d * 1.9;
        const x = vpx + tr.side * (60 + tr.d * 760);
        const h = 220 * tr.h * scale;
        return (
          <g key={i} opacity={0.28 + 0.72 * Math.max(fade, 0.18)}>
            <rect x={x - 5 * scale} y={y - h} width={10 * scale} height={h} fill="#0B0A08" stroke="#4A4034" strokeWidth={1.6} />
            <ellipse cx={x} cy={y - h - 26 * scale} rx={44 * scale} ry={60 * scale} fill="#0D0C0A" stroke="#4A4034" strokeWidth={1.6} />
          </g>
        );
      })}
      <Fog y={640} h={440} o={0.88} />
      <text x={vpx} y={vpy - 34} textAnchor="middle" fill="#5F5749" fontSize={18} fontFamily={SANS} letterSpacing={6} opacity={0.7}>
        同一条路
      </text>
    </g>
  );
};

/* ------------------------------------------------------------ 字幕 */

type Sub = { a: number; b: number; text: string; hi?: string; hiColor?: string; size?: number };

const SUBS: Sub[] = [
  { a: 0.8, b: 4.4, text: "去年今天，你在做什么？" },
  { a: 4.8, b: 7.2, text: "想不起来了。" },
  { a: 7.6, b: 12.0, text: "可它一秒钟，都没有少。" },
  { a: 12.4, b: 15.8, text: "一年，三百六十五天。" },
  { a: 16.2, b: 18.5, text: "你能讲出故事的，不到十天。" },

  { a: 18.9, b: 22.6, text: "有人这样解释：" },
  { a: 23.0, b: 27.8, text: "十岁那年，一年是你人生的十分之一。" },
  { a: 28.2, b: 32.8, text: "五十岁那年，是五十分之一。" },
  { a: 33.2, b: 37.2, text: "所以越活，时间越快。" },
  { a: 37.6, b: 40.4, text: "听起来，严丝合缝。" },
  { a: 40.8, b: 43.0, text: "可惜，实验不同意。", hi: "不同意", hiColor: "#E4583F" },

  { a: 43.4, b: 47.4, text: "四十八个人，看同一段录像。" },
  { a: 47.8, b: 51.8, text: "八十秒：洗车，擦窗，喘口气。" },
  { a: 52.2, b: 56.4, text: "然后有人问：刚才那段，有多长？" },
  { a: 56.8, b: 61.0, text: "有人记得三件，有人记得八件。" },
  { a: 61.4, b: 66.2, text: "每多一件，答案就长出十二秒。", hi: "长出十二秒" },
  { a: 66.6, b: 70.6, text: "至于他穿什么颜色——" },
  { a: 71.0, b: 73.2, text: "没人记得。", hiColor: "#8FD3E8" },
  { a: 73.6, b: 76.4, text: "也不影响答案。", hiColor: "#8FD3E8" },

  { a: 76.8, b: 81.4, text: "时间不是按秒结算的。" },
  { a: 81.8, b: 86.4, text: "是按「你记得几件事」结算的。", hi: "记得几件事" },
  { a: 86.8, b: 91.4, text: "第一次走那条路，每个路口都算数。" },
  { a: 91.8, b: 96.4, text: "走一千次，它成了一条线。" },
  { a: 96.8, b: 101.4, text: "童年很长。每天都是新的。" },
  { a: 101.8, b: 106.4, text: "中年很短。日子在复印前一天。" },

  { a: 107.0, b: 111.6, text: "有个词，叫假期悖论。" },
  { a: 112.0, b: 116.6, text: "假期里，它跑得飞快。" },
  { a: 117.0, b: 121.6, text: "回忆里，它长得出奇。" },

  { a: 122.4, b: 126.6, text: "时间没有变快。" },
  { a: 127.0, b: 131.8, text: "是你把一年，过成了一天。" },
  { a: 132.2, b: 136.8, text: "想让它变长，不用求更多时间。" },
  { a: 137.2, b: 141.4, text: "求更多「第一次」。", hi: "第一次" },

  { a: 142.0, b: 146.2, text: "今年，还剩多少天？", size: 62 },
  { a: 146.6, b: 150.6, text: "挑一天，做一件没做过的事。", size: 58 },
  { a: 151.0, b: 153.4, text: "不为体验。", size: 52 },
  { a: 153.8, b: 156.2, text: "为了让这一年，长一点。", hi: "长一点", size: 52 },
];

const Subtitles: React.FC<{ t: number; subs: Sub[] }> = ({ t, subs }) => {
  const cur = subs.find((s) => t >= s.a && t <= s.b);
  if (!cur) return null;
  const o = clamp01((t - cur.a) / 0.3) * clamp01((cur.b - t) / 0.34);
  const idx = cur.hi ? cur.text.indexOf(cur.hi) : -1;
  const parts = idx >= 0 && cur.hi ? [cur.text.slice(0, idx), cur.hi, cur.text.slice(idx + cur.hi.length)] : [cur.text, "", ""];
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 86,
          width: 1560,
          height: 250,
          transform: "translateX(-50%)",
          background: "radial-gradient(ellipse closest-side, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0) 82%)",
          filter: "blur(10px)",
        }}
      />
      <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 132,
        textAlign: "center",
        opacity: o,
        fontFamily: SERIF,
        fontSize: cur.size ?? 66,
        fontWeight: 700,
        letterSpacing: "0.02em",
        color: C.paper,
        textShadow: "0 0 38px rgba(255,220,160,0.26), 0 4px 34px rgba(0,0,0,0.95)",
      }}
    >
      <span>{parts[0]}</span>
      <span style={{ color: cur.hiColor ?? C.warm }}>{parts[1]}</span>
      <span>{parts[2]}</span>
      </div>
    </>
  );
};

const Hud: React.FC<{ label: string; value: string; o?: number }> = ({ label, value, o = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: 78,
      top: 58,
      fontFamily: MONO,
      fontSize: 22,
      letterSpacing: "0.26em",
      color: "rgba(150,160,180,0.5)",
      opacity: o,
    }}
  >
    {label} {value}
  </div>
);

/* ------------------------------------------------------------ 组装 */

export const YearWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;

  const pushAll = 1 + 0.05 * at(t, 0, 18);
  const dive = 1 + 1.4 * at(t, 17.6, 19.0);
  const pullBack = 1 + 0.45 * (1 - at(t, 124.0, 133.0));

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Defs />

        <g opacity={1 - at(t, 17.9, 18.9)}>
          {t < 19.2 && <Calendar t={t} mode="decay" push={pushAll * dive} />}
        </g>

        <g opacity={at(t, 17.9, 18.9) * (1 - at(t, 42.2, 43.2))}>
          {t >= 17.7 && t < 43.6 && (
            <g transform={`translate(${W / 2} ${H / 2}) scale(${1 + 0.05 * at(t, 19, 43)}) translate(${-W / 2} ${-H / 2})`}>
              <Ratio t={t} />
            </g>
          )}
        </g>

        <g opacity={at(t, 42.2, 43.2) * (1 - at(t, 75.2, 76.2))}>
          {t >= 42.7 && t < 76.6 && (
            <g transform={`translate(${W / 2} ${H / 2}) scale(${1 + 0.045 * at(t, 43, 76)}) translate(${-W / 2} ${-H / 2})`}>
              <Segments t={t} />
            </g>
          )}
        </g>

        <g opacity={at(t, 75.2, 76.2) * (1 - at(t, 123.2, 124.2))}>
          {t >= 75.4 && t < 124.6 && (
            <g transform={`translate(${W / 2} ${H / 2}) scale(${1 + 0.07 * at(t, 76, 124)}) translate(${-W / 2} ${-H / 2})`}>
              <Road t={t} />
            </g>
          )}
        </g>

        <g opacity={at(t, 123.2, 124.2)}>
          {t >= 123.4 && <Calendar t={t} mode="rekindle" push={pullBack} />}
        </g>

        {/* 人：开场站在墙前，结尾又回来 */}
        <Figure t={t} x={520} s={0.95} o={at(t, 1.4, 3.4) * (1 - at(t, 17.2, 18.4)) + at(t, 133.0, 137.5)} />
        <Dust t={t} n={64} o={0.85} c="#FFD79A" />
      </svg>

      <Subtitles t={t} subs={SUBS} />

      {t < 19.2 && <Hud label="DAY" value="365" o={t > 0.5 ? 1 : 0} />}
      {t >= 43 && t < 76.6 && <Hud label="SUBJECTS" value="48" />}
      {t >= 123.4 && <Hud label="DAYS LEFT" value="?" />}

      <Grade t={t} />

      <VibeEndCard
        t={t}
        a={156.2}
        cn="一年有多长"
        en="HOW LONG IS A YEAR"
        lines={[
          "Yue, W. W. Y., Liu, J., Yao, Z., Zhang, Y., Mu, Z., & Hu, X. (2026).",
          "Retrospective duration judgments of naturalistic events depend on memories of event boundaries.",
          "Psychonomic Bulletin & Review, 33(1), 33.",
          "",
          "「每多回忆一个子事件，主观时长平均增加 12.23 秒」为该研究 Day 1 的结果（n = 48）。",
          "比例为常见通俗解释，实验证据有限；片中已标注为「实验不同意」。",
        ]}
      />
    </AbsoluteFill>
  );
};





