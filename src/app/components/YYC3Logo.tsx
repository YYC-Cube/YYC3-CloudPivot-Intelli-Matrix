/**
 * YYC3Logo.tsx
 * =============
 * YYC³ 统一品牌 Logo 组件
 *
 * 使用 yyc3-icons 图标资源，支持:
 * - 多尺寸 (sm / md / lg / xl)
 * - 本地路径 + CDN 自动回退
 * - 发光动画效果
 * - 在线状态指示点
 */
import { useState } from "react";
import { icons, iconsCDN } from "../lib/yyc3-icons";

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";

interface YYC3LogoProps {
  size?: LogoSize;
  /** 是否显示右上角状态点 */
  showStatus?: boolean;
  /** 状态点颜色 (默认绿色 #00ff88) */
  statusColor?: string;
  /** 是否显示发光效果 */
  glow?: boolean;
  /** 自定义 className */
  className?: string;
  /** 点击回调 */
  onClick?: () => void;
}

const sizeMap: Record<LogoSize, { container: string; img: string; dot: string }> = {
  xs: { container: "w-7 h-7", img: "w-5 h-5", dot: "w-1.5 h-1.5 -top-0.5 -right-0.5" },
  sm: { container: "w-9 h-9", img: "w-6 h-6", dot: "w-2 h-2 -top-0.5 -right-0.5" },
  md: { container: "w-10 h-10", img: "w-7 h-7", dot: "w-2.5 h-2.5 -top-0.5 -right-0.5" },
  lg: { container: "w-14 h-14", img: "w-10 h-10", dot: "w-3 h-3 -top-0.5 -right-0.5" },
  xl: { container: "w-16 h-16", img: "w-11 h-11", dot: "w-3.5 h-3.5 -top-0.5 -right-0.5" },
};

/** 根据尺寸选择最佳图标分辨率 */
function getIconSrc(size: LogoSize): string {
  switch (size) {
    case "xs":
    case "sm":
      return icons.logo72;
    case "md":
      return icons.logo96;
    case "lg":
    case "xl":
      return icons.logo192;
  }
}

function getCDNSrc(size: LogoSize): string {
  switch (size) {
    case "xs":
    case "sm":
      return iconsCDN.logo72;
    case "md":
      return iconsCDN.logo96;
    case "lg":
    case "xl":
      return iconsCDN.logo192;
  }
}

export function YYC3Logo({
  size = "md",
  showStatus = true,
  statusColor = "#00ff88",
  glow = true,
  className = "",
  onClick,
}: YYC3LogoProps) {
  const s = sizeMap[size];
  const [useCDN, setUseCDN] = useState(false);

  const imgSrc = useCDN ? getCDNSrc(size) : getIconSrc(size);

  const handleError = () => {
    if (!useCDN) {
      setUseCDN(true);
    }
  };

  return (
    <div
      className={`
        relative ${s.container} rounded-xl overflow-hidden
        flex items-center justify-center shrink-0
        ${glow ? "shadow-[0_0_20px_rgba(0,180,255,0.4)]" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      <img
        src={imgSrc}
        alt="YYC³"
        className={`${s.img} object-contain rounded-lg`}
        onError={handleError}
        loading="eager"
        draggable={false}
      />

      {/* 状态指示点 */}
      {showStatus && (
        <div
          className={`absolute ${s.dot} rounded-full animate-pulse`}
          style={{
            backgroundColor: statusColor,
            boxShadow: `0 0 8px ${statusColor}`,
          }}
        />
      )}
    </div>
  );
}
