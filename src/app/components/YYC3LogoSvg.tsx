/**
 * YYC3LogoSvg.tsx
 * ================
 * YYC³ 品牌 Logo — 直接使用本地 PNG 图标资源
 */

import React from "react";

const IS_TEST = typeof process !== "undefined" && process.env.NODE_ENV === "test";

const logo16 = IS_TEST ? "/placeholder-logo.png" : "/yyc3-logo/macOS/16.png";
const logo32 = IS_TEST ? "/placeholder-logo.png" : "/yyc3-logo/macOS/32.png";
const logo48 = IS_TEST ? "/placeholder-logo.png" : "/yyc3-logo/macOS/64.png";
const logo64 = IS_TEST ? "/placeholder-logo.png" : "/yyc3-logo/macOS/64.png";
const logo96 = IS_TEST ? "/placeholder-logo.png" : "/yyc3-logo/macOS/128.png";
const logo128 = IS_TEST ? "/placeholder-logo.png" : "/yyc3-logo/macOS/128.png";
const logo192 = IS_TEST ? "/placeholder-logo.png" : "/yyc3-logo/macOS/256.png";
const logo256 = IS_TEST ? "/placeholder-logo.png" : "/yyc3-logo/macOS/256.png";
const logo512 = IS_TEST ? "/placeholder-logo.png" : "/yyc3-logo/macOS/512.png";

function pickLogo(size: number): string {
  if (size <= 16) {return logo16;}
  if (size <= 32) {return logo32;}
  if (size <= 48) {return logo48;}
  if (size <= 64) {return logo64;}
  if (size <= 96) {return logo96;}
  if (size <= 128) {return logo128;}
  if (size <= 192) {return logo192;}
  if (size <= 256) {return logo256;}
  return logo512;
}

interface YYC3LogoSvgProps {
  size?: number;
  className?: string;
  showText?: boolean;
  style?: React.CSSProperties;
}

export function YYC3LogoSvg({
  size = 40,
  className = "",
  showText: _showText = true,
  style,
}: YYC3LogoSvgProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`} style={style}>
      <img
        src={pickLogo(size)}
        alt="YYC³ Logo"
        width={size}
        height={size}
        className="object-contain"
        draggable={false}
      />
      {_showText && (
        <span
          className="font-bold tracking-wider"
          style={{
            fontSize: `${size * 0.35}rem`,
            color: "#ffffff",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
          }}
        >
          YYC³
        </span>
      )}
    </div>
  );
}

export default YYC3LogoSvg;
