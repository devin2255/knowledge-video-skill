import React from "react";
import { AbsoluteFill } from "remotion";

/**
 * 引力透镜化的黑洞。
 *
 * 结构参考 CSS 3D Lab 的纯 CSS 实现（MIT）：
 * https://css3dlab.edgarasnevauskas.com/models/blackhole/
 *
 * 关键差别：原版用 CSS animation 自转，Remotion 逐帧渲染必须确定性，
 * 所以所有旋转都由传入的 spin（秒）驱动。
 */
export const BlackHoleCSS: React.FC<{
  R: number;
  spin: number;
  o?: number;
  scale?: number;
}> = ({ R, spin, o = 1, scale = 1 }) => {
  const u = R / 64; // 视界半径 64u

  // 9 秒一圈（原版 disk 的 9s），光环 14 秒反向
  const diskDeg = (spin / 9) * 360;
  const haloDeg = -(spin / 14) * 360;

  const ring = (size: number, extra: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    left: -size / 2,
    top: -size / 2,
    width: size,
    height: size,
    borderRadius: "50%",
    ...extra,
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: o,
        transform: `scale(${scale})`,
      }}
    >
      <div style={{ position: "relative", width: 0, height: 0, transformStyle: "preserve-3d", perspective: 1400 * u }}>
        {/* 整体暖雾 */}
        <div
          style={{
            position: "absolute",
            left: -260 * u,
            top: -150 * u,
            width: 520 * u,
            height: 300 * u,
            background:
              "radial-gradient(closest-side, rgba(255,150,70,0.22), rgba(255,110,90,0.08) 55%, transparent)",
            transform: `translateZ(${-60 * u}px)`,
          }}
        />

        {/* 透镜化后的远侧盘：一条厚环，上亮下弱、两侧消失 */}
        <div
          style={ring(244 * u, {
            background:
              "radial-gradient(circle closest-side, transparent 51%, #fff3d6 54%, #ffd88a 60%, #ffa04a 72%, #ff7a3d 82%, rgba(255,77,157,0.5) 91%, transparent)",
            WebkitMaskImage:
              "conic-gradient(#000 0 22deg, rgba(0,0,0,0.12) 72deg 108deg, rgba(0,0,0,0.75) 160deg 200deg, rgba(0,0,0,0.12) 252deg 288deg, #000 338deg)",
            maskImage:
              "conic-gradient(#000 0 22deg, rgba(0,0,0,0.12) 72deg 108deg, rgba(0,0,0,0.75) 160deg 200deg, rgba(0,0,0,0.12) 252deg 288deg, #000 338deg)",
            transform: `translateZ(${-2 * u}px)`,
          })}
        >
          <div
            style={ring(244 * u, {
              background:
                "repeating-radial-gradient(circle, rgba(255,255,255,0.10) 0 1.5px, transparent 1.5px 6px), conic-gradient(rgba(255,255,255,0.22), transparent 30deg, rgba(40,8,30,0.25) 70deg, transparent 110deg, rgba(255,255,255,0.18) 160deg, transparent 200deg, rgba(40,8,30,0.2) 245deg, transparent 285deg, rgba(255,255,255,0.2) 320deg, rgba(255,255,255,0.22))",
              WebkitMaskImage:
                "radial-gradient(circle closest-side, transparent 52%, #000 55%, #000 88%, transparent)",
              maskImage: "radial-gradient(circle closest-side, transparent 52%, #000 55%, #000 88%, transparent)",
              transform: `rotate(${haloDeg}deg)`,
            })}
          />
        </div>

        {/* 视界：径向渐变的最后几个百分点就是光子环 */}
        <div
          style={ring(128 * u, {
            background:
              "radial-gradient(circle closest-side, #000 0 92%, #ffdca0 94.5%, #fff 96%, rgba(255,190,110,0.6) 98%, transparent)",
          })}
        />

        {/* 近侧盘：从黑洞前方横穿过去。CSS 3D 的排序在 mask 下会失效，这一笔手工补 */}
        <div
          style={{
            position: "absolute",
            left: -75 * u,
            top: 7 * u,
            width: 150 * u,
            height: 15 * u,
            borderRadius: "50%",
            background:
              "linear-gradient(90deg, rgba(255,180,110,0.15), rgba(255,240,214,0.95) 26%, rgba(255,214,150,0.9) 50%, rgba(255,240,214,0.95) 74%, rgba(255,180,110,0.15))",
            filter: `blur(${1.6 * u}px)`,
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -75 * u,
            top: 7 * u,
            width: 150 * u,
            height: 5 * u,
            borderRadius: "50%",
            background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.95) 70%, rgba(255,255,255,0))",
            filter: `blur(${0.6 * u}px)`,
            opacity: 0.55,
          }}
        />
        {/* 盘的平面：几乎侧对镜头 */}
        <div style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d", transform: "rotateX(78deg)" }}>
          <div
            style={ring(430 * u, {
              WebkitMaskImage:
                "radial-gradient(circle closest-side, transparent 31%, #000 33%, #000 62%, transparent)",
              maskImage: "radial-gradient(circle closest-side, transparent 31%, #000 33%, #000 62%, transparent)",
            })}
          >
            <div
              style={ring(430 * u, {
                background:
                  "repeating-radial-gradient(circle, rgba(255,255,255,0.10) 0 2px, transparent 2px 7px, rgba(30,6,20,0.12) 7px 9px, transparent 9px 13px), conic-gradient(rgba(255,255,255,0.2), transparent 28deg, rgba(30,6,20,0.24) 64deg, transparent 100deg, rgba(255,255,255,0.16) 145deg, transparent 185deg, rgba(30,6,20,0.2) 228deg, transparent 266deg, rgba(255,255,255,0.18) 312deg, rgba(255,255,255,0.2)), radial-gradient(circle closest-side, #fff8e6 32%, #ffe1a3 38%, #ffb547 48%, #ff7a3d 64%, #c8326b 84%, rgba(120,30,90,0))",
                transform: `rotate(${diskDeg}deg)`,
              })}
            />
            {/* 多普勒：朝向你的那一侧更亮，这层不转 */}
            <div
              style={ring(430 * u, {
                background:
                  "linear-gradient(90deg, rgba(255,246,225,0.42), transparent 42%, transparent 58%, rgba(8,2,18,0.5))",
              })}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};



