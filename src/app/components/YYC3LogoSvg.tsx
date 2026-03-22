/**
 * YYC3LogoSvg.tsx
 * ================
 * YYC³ 品牌 Logo — 直接使用本地 PNG 图标资源
 */

import React from "react";

const IS_TEST = typeof process !== "undefined" && process.env.NODE_ENV === "test";

const logo16 = IS_TEST ? "/placeholder-logo.png" : "figma:asset/65ccc9dddffabc97f54f57cde65f1b53d05fd021.png";
const logo32 = IS_TEST ? "/placeholder-logo.png" : "figma:asset/3e28796e9d06280ab8bddc1f4f760e0082b37db7.png";
const logo48 = IS_TEST ? "/placeholder-logo.png" : "figma:asset/798bb35f982766f84fc7d8be3148a8bd3b543ef2.png";
const logo64 = IS_TEST ? "/placeholder-logo.png" : "figma:asset/a93da949e0d41c6c020b16b5e8502eb55f46dcd4.png";
const logo96 = IS_TEST ? "/placeholder-logo.png" : "figma:asset/710a81bbb48f97d927c9de4c9e7d81431f2b494e.png";
const logo128 = IS_TEST ? "/placeholder-logo.png" : "figma:asset/82b7665fd5fca4ae995823612dd61a69c5380270.png";
const logo192 = IS_TEST ? "/placeholder-logo.png" : "figma:asset/e149570c295eb277c910c4eba7fcc5a0d40d709c.png";
const logo256 = IS_TEST ? "/placeholder-logo.png" : "figma:asset/384ff1d098a94fb683fcad8c550f1b1d6f56c936.png";
const logo512 = IS_TEST ? "/placeholder-logo.png" : "figma:asset/a6975eaf3758b71c6977778e6ae2ec5d7c03c7db.png";

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
