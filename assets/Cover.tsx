import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONT_MONO, FONT_CN } from "../theme";

const gold = (a: number) => `rgba(233,182,100,${a})`;

export type CoverMode = "16x9" | "3x4" | "9x16";

export type CoverProps = {
  mode: CoverMode;
  lines: string[];
  accent?: string;
  micro: string;
  tagline: string;
  tags?: string;
  motif?: "rings" | "head" | "card" | "calendar";
};

const SIZE: Record<CoverMode, { w: number; h: number }> = {
  "16x9": { w: 1920, h: 1080 },
  "3x4": { w: 1080, h: 1440 },
  "9x16": { w: 1080, h: 1920 },
};

export const COVER_SIZE = SIZE;

const Rings: React.FC<{ w: number; h: number; cx: number; cy: number; scale: number }> = ({
  w,
  h,
  cx,
  cy,
  scale,
}) => {
  const radii = [150, 252, 374, 520, 690].map((r) => r * scale);
  return (
    <AbsoluteFill>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }} fill="none">
        {radii.map((r, i) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={r}
            stroke={gold(0.095 - i * 0.013)}
            strokeWidth={1.1}
            strokeDasharray={i > 2 ? "2 14" : undefined}
          />
        ))}
        {Array.from({ length: 72 }, (_, k) => {
          const a = (k / 72) * Math.PI * 2;
          const r = radii[2];
          const l = k % 6 === 0 ? 13 : 5;
          return (
            <line
              key={k}
              x1={cx + Math.cos(a) * (r - l)}
              y1={cy + Math.sin(a) * (r - l)}
              x2={cx + Math.cos(a) * (r - 1)}
              y2={cy + Math.sin(a) * (r - 1)}
              stroke={gold(0.1)}
              strokeWidth={1}
            />
          );
        })}
        <line x1={cx - radii[3]} y1={cy} x2={cx + radii[3]} y2={cy} stroke={gold(0.07)} strokeWidth={1} />
      </svg>
    </AbsoluteFill>
  );
};

const GOLD_SHADOW = "0 0 64px rgba(233,182,100,0.55)";

/** Splits one line into normal / highlighted spans. */
const Accented: React.FC<{ text: string; accent?: string }> = ({ text, accent }) => {
  if (!accent || !text.includes(accent)) return <>{text}</>;
  const idx = text.indexOf(accent);
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: C.gold, textShadow: GOLD_SHADOW }}>{accent}</span>
      {text.slice(idx + accent.length)}
    </>
  );
};

/** The profile used by EP.03 -- same path as the film, scaled for the poster. */
const HeadMotif: React.FC<{ w: number; h: number; cx: number; cy: number; s: number }> = ({
  w,
  h,
  cx,
  cy,
  s,
}) => {
  const d = [
    "M 210 66",
    "C 250 26, 330 14, 388 52",
    "C 430 80, 448 118, 452 152",
    "C 454 172, 448 186, 456 198",
    "C 470 216, 486 232, 484 246",
    "C 482 258, 468 258, 462 264",
    "C 470 276, 468 288, 456 294",
    "C 462 308, 458 322, 444 328",
    "C 448 344, 436 360, 416 364",
    "C 400 380, 386 398, 384 420",
    "C 382 446, 376 470, 360 486",
    "L 300 512",
    "C 240 520, 186 500, 156 458",
    "C 120 408, 108 340, 118 276",
    "C 128 208, 158 120, 210 66",
    "Z",
  ].join(" ");
  const ox = cx - 297 * s;
  const oy = cy - 267 * s;
  return (
    <AbsoluteFill>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }} fill="none">
        <g transform={`translate(${ox} ${oy}) scale(${s})`}>
          <path d={d} fill="rgba(214,177,120,0.03)" stroke={gold(0.42)} strokeWidth={2 / s} />
          {/* ear */}
          <path
            d="M 330 210 C 356 196, 376 214, 372 240 C 368 268, 344 280, 332 268 C 322 258, 324 238, 338 230"
            stroke={gold(0.34)}
            strokeWidth={1.5 / s}
          />
          {/* cochlea */}
          <path
            d="M 300 300 m 0 0 a 26 26 0 1 1 18 44 a 16 16 0 1 0 -12 -28"
            stroke="rgba(100,227,246,0.5)"
            strokeWidth={1.4 / s}
          />
          <circle cx={300} cy={300} r={3 / s} fill="rgba(100,227,246,0.75)" />
          {/* the bone path */}
          <path
            d="M 372 498 C 366 430, 340 360, 302 302"
            stroke={C.goldPale}
            strokeOpacity={0.6}
            strokeWidth={3 / s}
            strokeLinecap="round"
          />
          <circle cx={372} cy={498} r={4 / s} fill={C.goldPale} opacity={0.8} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** EP.04: an identity card, stamped before anything happened. */
const CardMotif: React.FC<{ w: number; h: number; cx: number; cy: number; s: number }> = ({
  w,
  h,
  cx,
  cy,
  s,
}) => {
  const X = cx - 450 * s;
  const Y = cy - 210 * s;
  return (
    <AbsoluteFill>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }} fill="none">
        <g transform={`translate(${X} ${Y}) scale(${s})`}>
          <rect x={0} y={0} width={900} height={420} rx={22} stroke={gold(0.24)} strokeWidth={2 / s} />
          <text x={38} y={52} fill="rgba(214,177,120,0.45)" fontSize={16} fontFamily={'"Consolas", monospace'} letterSpacing={9}>
            IDENTITY
          </text>
          <rect x={38} y={86} width={230} height={270} rx={8} stroke={gold(0.18)} strokeWidth={1.6 / s} />
          <circle cx={153} cy={188} r={44} stroke={gold(0.26)} strokeWidth={2 / s} />
          <path d="M 88 338 C 93 268, 213 268, 218 338" stroke={gold(0.26)} strokeWidth={2 / s} />
          {[0, 1, 2].map((i) => (
            <line key={i} x1={310} y1={188 + i * 74} x2={700} y2={188 + i * 74} stroke={gold(0.09)} />
          ))}
          <g transform="rotate(-9 700 120)">
            <rect x={588} y={74} width={224} height={86} rx={8} stroke="rgba(228,88,63,0.4)" strokeWidth={3 / s} />
            <text x={700} y={134} textAnchor="middle" fill="rgba(228,88,63,0.55)" fontSize={30} fontFamily={'"STZhongsong", serif'} letterSpacing={8}>
              已认证
            </text>
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
/** EP.05: a year of days, almost all of them grey. */
const CalendarMotif: React.FC<{ w: number; h: number; cx: number; cy: number; s: number }> = ({
  w,
  h,
  cx,
  cy,
  s,
}) => {
  const keep = React.useMemo(() => {
    let seed = 20261;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const set = new Set<number>();
    while (set.size < 9) set.add(Math.floor(rnd() * 540));
    return set;
  }, []);
  const vertical = h > w;
  const COLS = 34;
  const ROWS = 20;
  const CELL = 34;
  const GAP = 12;
  const spanW = COLS * (CELL + GAP) - GAP;
  const spanH = ROWS * (CELL + GAP) - GAP;
  const X0 = cx - (spanW * s) / 2;
  const Y0 = cy - (spanH * s) / 2;
  return (
    <AbsoluteFill>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="calWarm" cx="50%" cy="50%" r="62%">
            <stop offset="0%" stopColor="#C89050" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#C89050" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={w} height={h} fill="url(#calWarm)" />
        <g>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const x = X0 + col * (CELL + GAP) * s;
          const y = Y0 + row * (CELL + GAP) * s;
          const lit = keep.has(i);
          const nd = Math.hypot((col - (COLS - 1) / 2) / (COLS / 2), (row - (ROWS - 1) / 2) / (ROWS / 2));
          const edge = Math.max(0, Math.min(1, 1 - (nd - 0.45) / 0.6));
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={CELL * s}
              height={CELL * s}
              rx={3}
              fill={lit ? "#FFDDA6" : "#3A2F22"}
              opacity={lit ? 0.95 * Math.max(0.7, edge) : 0.72 * edge}
            />
          );
        })}
        </g>
        {/* 站在墙前的背影 */}
        <g transform={`translate(${vertical ? w * 0.77 : w * 0.13} ${h * 1.08}) scale(${(Math.min(w, h) * 0.38) / 454})`}>
          <path d="M -186 0 C -182 -196, -112 -306, -54 -342 L 54 -342 C 112 -306, 182 -196, 186 0 Z" fill="#050504" />
          <circle cx={0} cy={-398} r={63} fill="#050504" />
          <path d="M -184 0 C -180 -198, -110 -308, -52 -344" fill="none" stroke="#8C7649" strokeWidth={2.6} opacity={0.55} />
          <path d="M -58 -440 A 63 63 0 0 1 44 -446" fill="none" stroke="#B08B52" strokeWidth={2.6} opacity={0.62} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
export const Cover: React.FC<CoverProps> = ({ mode, lines, accent, micro, tagline, tags, motif = "rings" }) => {
  const { w, h } = SIZE[mode];
  const vertical = mode !== "16x9";
  const cx = w / 2;
  const base = mode === "16x9" ? 148 : mode === "9x16" ? 166 : 150;
  const widest = Math.max(...lines.map((l) => [...l].length));
  const margin = mode === "16x9" ? 130 : 108;
  const size = Math.min(base, Math.floor((w - margin * 2) / (widest * 1.05)));

  const lineStyle: React.CSSProperties = {
    fontFamily: FONT_CN,
    fontSize: size,
    fontWeight: 900,
    letterSpacing: "0.04em",
    lineHeight: 1.16,
    color: C.paper,
    whiteSpace: "nowrap",
    textShadow: "0 0 90px rgba(0,0,0,0.85)",
  };

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <AbsoluteFill
        style={{
          background: "radial-gradient(115% 85% at 50% 44%, #0C1524 0%, #070B14 44%, #03050A 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(56% 38% at 50% 46%, rgba(233,182,100,0.17) 0%, rgba(233,182,100,0.05) 34%, rgba(233,182,100,0) 70%)",
        }}
      />

      {motif === "head" || motif === "card" || motif === "calendar" ? (
        <>
          {motif === "head" ? (
            <HeadMotif w={w} h={h} cx={cx} cy={h * 0.44} s={vertical ? 1.62 : 1.95} />
          ) : motif === "card" ? (
            <CardMotif w={w} h={h} cx={cx} cy={h * 0.5} s={vertical ? 0.98 : 1.22} />
          ) : (
            <CalendarMotif w={w} h={h} cx={cx} cy={vertical ? h * 0.45 : h * 0.5} s={vertical ? 2.0 : 1.26} />
          )}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "48%",
              width: vertical ? 940 : 1560,
              height: vertical ? 780 : 460,
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(ellipse closest-side at center, rgba(8,9,18,0.8) 0%, rgba(8,9,18,0.55) 45%, rgba(8,9,18,0) 92%)",
            }}
          />
        </>
      ) : (
        <>
          <Rings w={w} h={h} cx={cx} cy={h * 0.48} scale={vertical ? 1.12 : 0.92} />
          <div
            style={{
              position: "absolute",
              left: cx - 5,
              top: h * 0.48 - 5,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: `radial-gradient(circle, #FFFFFF 0%, ${C.goldPale} 50%, rgba(233,182,100,0) 100%)`,
              boxShadow: "0 0 26px 8px rgba(255,238,204,0.5), 0 0 90px 30px rgba(233,182,100,0.18)",
            }}
          />
        </>
      )}

      <Img
        src={staticFile("grain.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.3,
          mixBlendMode: "overlay",
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingLeft: 56,
          paddingRight: 56,
        }}
      >
        <div
          style={{
            fontFamily: FONT_CN,
            fontSize: vertical ? 23 : 20,
            fontWeight: 400,
            letterSpacing: "0.3em",
            textIndent: "0.3em",
            color: gold(0.74),
            marginBottom: vertical ? 58 : 54,
            textAlign: "center",
          }}
        >
          {micro}
        </div>

        <div style={{ textAlign: "center" }}>
          {lines.map((ln, i) => (
            <div key={i} style={{ ...lineStyle, marginTop: i === 0 ? 0 : 2 }}>
              <Accented text={ln} accent={accent} />
            </div>
          ))}
        </div>

        <div
          style={{
            width: vertical ? 240 : 300,
            height: 1.4,
            marginTop: vertical ? 72 : 62,
            background: `linear-gradient(90deg, rgba(233,182,100,0), ${C.gold} 20%, ${C.gold} 80%, rgba(233,182,100,0))`,
            boxShadow: "0 0 18px rgba(233,182,100,0.45)",
          }}
        />

        <div
          style={{
            fontFamily: FONT_CN,
            fontSize: vertical ? 40 : 36,
            fontWeight: 300,
            letterSpacing: "0.16em",
            textIndent: "0.16em",
            color: "rgba(243,239,230,0.8)",
            marginTop: vertical ? 46 : 40,
          }}
        >
          {tagline}
        </div>

        {vertical && tags && (
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 20,
              letterSpacing: "0.2em",
              color: "rgba(152,162,179,0.58)",
              marginTop: 150,
            }}
          >
            {tags}
          </div>
        )}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 105% 82% at 50% 50%, rgba(0,0,0,0) 32%, rgba(0,0,0,0.48) 74%, rgba(0,0,0,0.88) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Cover copy per episode. */
export const COVER_COPY = {
  ep01: {
    horizontal: ["命运是既定的吗？"],
    vertical: ["命运是", "既定的吗？"],
    accent: "既定",
    micro: "EP.01 · 一场持续两百年的追问",
    tagline: "三个实验，一个答案",
    tags: "拉普拉斯 · 混沌 · 量子 · 利贝特",
  },
  ep05: {
    horizontal: ["你的这一年，只有七八天"],
    vertical: ["你的这一年", "只有七八天"],
    accent: "七八天",
    micro: "EP.05 · 记忆怎么改写时间",
    tagline: "不是时间变快，是你没留下痕迹",
    tags: "2026 新研究 · 事件边界 · 每件事 +12 秒",
    motif: "calendar",
  },
  ep04: {    horizontal: ["说出去的目标，为什么更难实现"],
    vertical: ["说出去的目标", "为什么更难实现"],
    accent: "更难实现",
    micro: "EP.04 · 符号性自我完成",
    tagline: "不是懒，是提前领了奖",
    tags: "格尔维策 · 2009 · 朋友圈",
    motif: "card",
  },
  ep03: {
    horizontal: ["你从没听过，别人听到的你"],
    vertical: ["你从没听过", "别人听到的你"],
    accent: "别人听到的你",
    micro: "EP.03 · 骨传导与那个陌生的自己",
    tagline: "一条路，录音机听不见",
    tags: "骨传导 · 空气传导 · 贝多芬",
    motif: "head",
  },
  ep02: {
    horizontal: ["你记得的过去，是真的吗？"],
    vertical: ["你记得的过去", "是真的吗？"],
    accent: "真的",
    micro: "EP.02 · 记忆是一份一直在改的讲稿",
    tagline: "四个实验，一个答案",
    tags: "巴特利特 · 洛夫特斯 · 再巩固 · 目击者",
  },
} as const;

















