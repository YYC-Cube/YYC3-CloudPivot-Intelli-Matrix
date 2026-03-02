/**
 * LocalFileManager.test.tsx
 * ======================
 * LocalFileManager 组件测试
 *
 * 覆盖范围:
 * - 组件基本渲染
 * - Tab 切换功能
 * - 快速操作按钮
 * - 子组件渲染
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import React from "react";
import LocalFileManager from "../components/LocalFileManager";

vi.mock("lucide-react", () => ({
  FolderOpen: () => React.createElement("span", { "data-testid": "icon-folder" }),
  Download: () => React.createElement("span", { "data-testid": "icon-download" }),
  HardDrive: () => React.createElement("span", { "data-testid": "icon-harddrive" }),
  Trash2: () => React.createElement("span", { "data-testid": "icon-trash" }),
  Keyboard: () => React.createElement("span", { "data-testid": "icon-keyboard" }),
}));

vi.mock("../components/GlassCard", () => ({
  default: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock("../components/FileBrowser", () => ({
  __esModule: true,
  default: () => React.createElement("div", { "data-testid": "file-browser" }, "File Browser Mock"),
}));

vi.mock("../components/LogViewer", () => ({
  __esModule: true,
  default: () => React.createElement("div", { "data-testid": "log-viewer" }, "Log Viewer Mock"),
}));

vi.mock("../components/ReportGenerator", () => ({
  __esModule: true,
  default: () => React.createElement("div", { "data-testid": "report-generator" }, "Report Generator Mock"),
}));

vi.mock("../hooks/useLocalFileSystem", () => ({
  useLocalFileSystem: () => ({
    downloadLogs: vi.fn(),
    executeBackup: vi.fn(),
    clearCache: vi.fn(),
  }),
}));

vi.mock("../components/Layout", () => ({
  ViewContext: React.createContext({ isMobile: false, theme: "dark" as const }),
}));

vi.mock("../hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "fileManager.title": "本地文件管理",
        "fileManager.subtitle": "浏览、导出和备份本地文件",
        "fileManager.fileBrowse": "文件浏览",
        "fileManager.logViewer": "日志查看",
        "fileManager.reportGen": "报告生成",
        "fileManager.downloadLogs": "下载日志",
        "fileManager.exportToLocal": "导出到本地",
        "fileManager.executeBackup": "执行备份",
        "fileManager.clearCache": "清理缓存",
      };
      return translations[key] || key;
    },
  }),
}));

describe("LocalFileManager", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe("组件渲染", () => {
    it("应该渲染标题和副标题", () => {
      render(React.createElement(LocalFileManager));
      expect(screen.getByText("本地文件管理")).toBeInTheDocument();
      expect(screen.getByText("浏览、导出和备份本地文件")).toBeInTheDocument();
    });

    it("应该渲染三个 Tab 按钮", () => {
      render(React.createElement(LocalFileManager));
      expect(screen.getByText("文件浏览")).toBeInTheDocument();
      expect(screen.getByText("日志查看")).toBeInTheDocument();
      expect(screen.getByText("报告生成")).toBeInTheDocument();
    });

    it("应该渲染快速操作按钮", () => {
      render(React.createElement(LocalFileManager));
      expect(screen.getByText("下载日志")).toBeInTheDocument();
      expect(screen.getByText("执行备份")).toBeInTheDocument();
      expect(screen.getByText("清理缓存")).toBeInTheDocument();
    });
  });

  describe("Tab 切换", () => {
    it("应该默认显示文件浏览 Tab", () => {
      render(React.createElement(LocalFileManager));
      expect(screen.getByTestId("file-browser")).toBeInTheDocument();
    });

    it("切换到日志查看 Tab 应该显示 LogViewer", () => {
      render(React.createElement(LocalFileManager));
      const logsTab = screen.getByText("日志查看");
      fireEvent.click(logsTab);
      expect(screen.getByTestId("log-viewer")).toBeInTheDocument();
    });

    it("切换到报告生成 Tab 应该显示 ReportGenerator", () => {
      render(React.createElement(LocalFileManager));
      const reportsTab = screen.getByText("报告生成");
      fireEvent.click(reportsTab);
      expect(screen.getByTestId("report-generator")).toBeInTheDocument();
    });
  });

  describe("快速操作", () => {
    it("应该渲染下载日志按钮", () => {
      render(React.createElement(LocalFileManager));
      const downloadButton = screen.getByTestId("quick-download");
      expect(downloadButton).toBeInTheDocument();
    });

    it("应该渲染执行备份按钮", () => {
      render(React.createElement(LocalFileManager));
      const backupButton = screen.getByTestId("quick-backup");
      expect(backupButton).toBeInTheDocument();
    });

    it("应该渲染清理缓存按钮", () => {
      render(React.createElement(LocalFileManager));
      const clearButton = screen.getByTestId("quick-clear");
      expect(clearButton).toBeInTheDocument();
    });
  });
});
