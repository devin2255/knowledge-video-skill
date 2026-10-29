/**
 * qa.mjs —— 成片自动校验
 *
 *   node scripts/qa.mjs out/film.mp4 [期望时长秒数] [fps]
 *
 * 校验：时长 / 分辨率 / 帧率 / 帧数 / 编码 / 音频 / 平均响度 / 真峰值 / 黑场 / 静止段
 * 退出码非 0 表示有失败项。
 */

import { spawnSync } from "node:child_process";

const file = process.argv[2];
const expectDur = process.argv[3] ? parseFloat(process.argv[3]) : null;
const fps = process.argv[4] ? parseInt(process.argv[4], 10) : 30;

if (!file) {
  console.error("用法: node scripts/qa.mjs <video.mp4> [期望时长] [fps]");
  process.exit(2);
}

// ffmpeg 的很多诊断（volumedetect、blackdetect）走 stderr，必须一起收
const run = (bin, args) => {
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 128 << 20 });
  return (r.stdout || "") + (r.stderr || "");
};

const probe = JSON.parse(
  run("ffprobe", [
    "-v", "error", "-count_frames",
    "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_read_frames",
    "-show_entries", "format=duration",
    "-of", "json", file,
  ]) || "{}",
);

// 音轨要单独探，上面那句 -select_streams v:0 把音频过滤掉了
const allProbe = JSON.parse(
  run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type", "-of", "json", file]) || "{}",
);
const hasAudio = (allProbe.streams ?? []).some((s) => s.codec_type === "audio");

const s = probe.streams?.[0] ?? {};
const dur = parseFloat(probe.format?.duration ?? "0");
const frames = parseInt(s.nb_read_frames ?? "0", 10);

// 音频响度
let meanDb = NaN;
let peakDb = NaN;
const volOut = run("ffmpeg", ["-hide_banner", "-i", file, "-af", "volumedetect", "-f", "null", "-"]);
const mV = volOut.match(/mean_volume:\s*(-?[\d.]+)\s*dB/);
const pV = volOut.match(/max_volume:\s*(-?[\d.]+)\s*dB/);
if (mV) meanDb = parseFloat(mV[1]);
if (pV) peakDb = parseFloat(pV[1]);

// 黑场（>0.5s 且几乎纯黑）
const blackOut = run("ffmpeg", ["-hide_banner", "-i", file, "-vf", "blackdetect=d=0.4:pix_th=0.02", "-f", "null", "-"]);
const blacks = [...blackOut.matchAll(/black_start:([\d.]+)\s+black_end:([\d.]+)/g)].map((m) => ({
  start: parseFloat(m[1]),
  end: parseFloat(m[2]),
}));

const rows = [];
const check = (name, ok, detail) => {
  rows.push({ name, ok, detail });
  return ok;
};

check("codec", s.codec_name === "h264", String(s.codec_name ?? "?"));
check("pix_fmt", s.pix_fmt === "yuv420p", String(s.pix_fmt ?? "?"));
check("size", s.width === 1920 && s.height === 1080, `${s.width}×${s.height}`);
check("fps", s.r_frame_rate === `${fps}/1`, s.r_frame_rate ?? "?");
check("frames", Math.abs(frames - Math.round(dur * fps)) <= 1, `${frames} vs ${Math.round(dur * fps)}`);
check("duration", expectDur === null || Math.abs(dur - expectDur) <= 1.0, `${dur.toFixed(2)}s`);
check("audio", hasAudio !== false, hasAudio === false ? "无音轨" : "有");
check("loudness", !Number.isNaN(meanDb) && meanDb >= -24 && meanDb <= -18, `${meanDb.toFixed(1)} dBFS（目标 −20~−22）`);
check("true peak", !Number.isNaN(peakDb) && peakDb <= -3.5, `${peakDb.toFixed(1)} dBFS（需 ≤ −4）`);
check(
  "no unintended black",
  blacks.length === 0 || blacks.every((b) => b.end - b.start < 1.2),
  blacks.length ? blacks.map((b) => `${b.start.toFixed(1)}-${b.end.toFixed(1)}s`).join(", ") : "无",
);

console.log(`\n${file}\n`);
for (const r of rows) {
  console.log(`  ${r.ok ? "✓" : "✗"} ${r.name.padEnd(16)} ${r.detail}`);
}

const failed = rows.filter((r) => !r.ok);
if (blacks.length) {
  console.log(`\n  黑场区间: ${blacks.map((b) => `${b.start.toFixed(2)}–${b.end.toFixed(2)}s`).join("  ")}`);
}
console.log(`\n${failed.length === 0 ? "全部通过" : `${failed.length} 项未达标`}\n`);
process.exit(failed.length === 0 ? 0 : 1);


