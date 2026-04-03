/**
 * YYC3LogoSvg.tsx
 * ================
 * YYC³ 品牌 Logo — 直接使用本地 PNG 图标资源
 */

import React from "react";

const logo16 = "/yyc3-icons/macOS/16.png";
const logo32 = "/yyc3-icons/macOS/32.png";
const logo48 = "/yyc3-icons/macOS/64.png";
const logo64 = "/yyc3-icons/macOS/64.png";
const logo96 = "/yyc3-icons/macOS/128.png";
const logo128 = "/yyc3-icons/macOS/128.png";
const logo192 = "/yyc3-icons/Web App/android-chrome-192.png";
const logo256 = "/yyc3-icons/macOS/256.png";
const logo512 = "/yyc3-icons/macOS/512.png";

function pickLogo(size: number): string {
  if (size <= 16) { return logo16; }
  if (size <= 32) { return logo32; }
  if (size <= 48) { return logo48; }
  if (size <= 64) { return logo64; }
  if (size <= 96) { return logo96; }
  if (size <= 128) { return logo128; }
  if (size <= 192) { return logo192; }
  if (size <= 256) { return logo256; }
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
    <img
      src={pickLogo(size)}
      alt="YYC³ Logo"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={style}
      draggable={false}
    />
  );
}

export default YYC3LogoSvg;
