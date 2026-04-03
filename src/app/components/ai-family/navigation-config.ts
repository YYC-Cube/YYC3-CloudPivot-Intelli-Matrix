/**
 * AI Family 三级导航配置
 * ========================
 * 将 16 个页面按功能域分组为 5 个分类
 * 
 * 结构：
 * - 一级：AI Family（主分类）
 * - 二级：5 个功能域（核心空间、交流协作、文娱生活、学习成长、系统管理）
 * - 三级：16 个具体页面
 */

import type React from "react";
import {
  Sparkles, UserCircle2, Globe,
  MessageCircle, Phone, MessageSquare,
  Gamepad2, Music, ClipboardList,
  BookOpen, TrendingUp, Share,
  Settings2, Cpu, Mic, Database, FileText,
} from "lucide-react";

// ═══ 三级导航类型定义 ═══

export interface NavChild {
  key: string;
  path: string;
  icon: React.ElementType;
  label?: string;
}

export interface NavSubCategory {
  id: string;
  labelKey: string;
  labelZh: string;
  labelEn: string;
  icon: React.ElementType;
  children: NavChild[];
  defaultExpanded?: boolean;
}

export interface NavCategory {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  subCategories: NavSubCategory[];
  defaultExpanded?: boolean;
}

// ═══ AI Family 三级导航配置 ═══

export const AI_FAMILY_NAV: NavCategory = {
  id: "ai-family",
  labelKey: "nav.catAIFamily",
  icon: UserCircle2,
  defaultExpanded: true,
  subCategories: [
    {
      id: "core",
      labelKey: "aiFamily.catCore",
      labelZh: "核心空间",
      labelEn: "Core Space",
      icon: Sparkles,
      defaultExpanded: true,
      children: [
        {
          key: "aiFamily.home",
          path: "/ai-family",
          icon: UserCircle2,
          label: "AI Family",
        },
        {
          key: "aiFamily.homePage",
          path: "/ai-family-home",
          icon: Sparkles,
          label: "Family首页",
        },
        {
          key: "aiFamily.center",
          path: "/ai-family-center",
          icon: Sparkles,
          label: "Family中心",
        },
        {
          key: "aiFamily.ecosystem",
          path: "/ai-family/ecosystem",
          icon: Globe,
          label: "生态中心",
        },
        {
          key: "aiFamily.designDoc",
          path: "/ai-family-design",
          icon: FileText,
          label: "家族规划",
        },
      ],
    },
    {
      id: "communication",
      labelKey: "aiFamily.catComm",
      labelZh: "交流协作",
      labelEn: "Communication",
      icon: MessageCircle,
      children: [
        {
          key: "aiFamily.chat",
          path: "/ai-family/chat",
          icon: MessageCircle,
          label: "家人对话",
        },
        {
          key: "aiFamily.phone",
          path: "/ai-family/phone",
          icon: Phone,
          label: "家人热线",
        },
        {
          key: "aiFamily.commCenter",
          path: "/ai-family/comm",
          icon: MessageSquare,
          label: "通信中心",
        },
      ],
    },
    {
      id: "entertainment",
      labelKey: "aiFamily.catEntertainment",
      labelZh: "文娱生活",
      labelEn: "Entertainment",
      icon: Gamepad2,
      children: [
        {
          key: "aiFamily.entertainment",
          path: "/ai-family/fun",
          icon: Gamepad2,
          label: "文娱中心",
        },
        {
          key: "aiFamily.music",
          path: "/ai-family/music",
          icon: Music,
          label: "音乐空间",
        },
        {
          key: "aiFamily.activityCenter",
          path: "/ai-family/activities",
          icon: ClipboardList,
          label: "全家活动",
        },
      ],
    },
    {
      id: "learning",
      labelKey: "aiFamily.catLearning",
      labelZh: "学习成长",
      labelEn: "Learning & Growth",
      icon: BookOpen,
      children: [
        {
          key: "aiFamily.learn",
          path: "/ai-family/learn",
          icon: BookOpen,
          label: "学习成长",
        },
        {
          key: "aiFamily.growth",
          path: "/ai-family/growth",
          icon: TrendingUp,
          label: "成长轨迹",
        },
        {
          key: "aiFamily.share",
          path: "/ai-family/share",
          icon: Share,
          label: "分享空间",
        },
      ],
    },
    {
      id: "management",
      labelKey: "aiFamily.catManagement",
      labelZh: "系统管理",
      labelEn: "System Management",
      icon: Settings2,
      children: [
        {
          key: "aiFamily.settings",
          path: "/ai-family/settings",
          icon: Settings2,
          label: "控制中心",
        },
        {
          key: "aiFamily.modelSettings",
          path: "/ai-family/models",
          icon: Cpu,
          label: "模型控制",
        },
        {
          key: "aiFamily.voiceSystem",
          path: "/ai-family/voice",
          icon: Mic,
          label: "语音系统",
        },
        {
          key: "aiFamily.dataHub",
          path: "/ai-family/data",
          icon: Database,
          label: "数据中心",
        },
      ],
    },
  ],
};

// ═══ 扁平化导航列表（用于兼容旧代码）═══

export const AI_FAMILY_FLAT_NAV = AI_FAMILY_NAV.subCategories.flatMap(
  (subCat) => subCat.children
);

// ═══ 快速访问配置（用于 Family 首页）═══

export const AI_FAMILY_QUICK_ACCESS = [
  {
    label: "家人对话",
    path: "/ai-family/chat",
    icon: MessageCircle,
    color: "#00d4ff",
    category: "communication",
  },
  {
    label: "学习成长",
    path: "/ai-family/learn",
    icon: BookOpen,
    color: "#00FF88",
    category: "learning",
  },
  {
    label: "音乐空间",
    path: "/ai-family/music",
    icon: Music,
    color: "#FFD700",
    category: "entertainment",
  },
  {
    label: "控制中心",
    path: "/ai-family/settings",
    icon: Settings2,
    color: "#FF7043",
    category: "management",
  },
];

// ═══ 导航统计信息 ═══

export const AI_FAMILY_NAV_STATS = {
  totalCategories: 5,
  totalPages: 16,
  avgPagesPerCategory: 3.2,
  categories: [
    { id: "core", name: "核心空间", pages: 3 },
    { id: "communication", name: "交流协作", pages: 3 },
    { id: "entertainment", name: "文娱生活", pages: 3 },
    { id: "learning", name: "学习成长", pages: 3 },
    { id: "management", name: "系统管理", pages: 4 },
  ],
};

// ═══ 辅助函数 ═══

/**
 * 根据路径查找所属分类
 */
export function findCategoryByPath(path: string): NavSubCategory | undefined {
  for (const subCat of AI_FAMILY_NAV.subCategories) {
    if (subCat.children.some(child => child.path === path)) {
      return subCat;
    }
  }
  return undefined;
}

/**
 * 根据路径查找导航项
 */
export function findNavItemByPath(path: string): NavChild | undefined {
  for (const subCat of AI_FAMILY_NAV.subCategories) {
    const item = subCat.children.find(child => child.path === path);
    if (item) {
      return item;
    }
  }
  return undefined;
}

/**
 * 获取分类下的所有路径
 */
export function getPathsByCategory(categoryId: string): string[] {
  const subCat = AI_FAMILY_NAV.subCategories.find(c => c.id === categoryId);
  return subCat?.children.map(c => c.path) || [];
}

/**
 * 检查路径是否属于 AI Family
 */
export function isAIFamilyPath(path: string): boolean {
  return AI_FAMILY_FLAT_NAV.some(item => item.path === path);
}
