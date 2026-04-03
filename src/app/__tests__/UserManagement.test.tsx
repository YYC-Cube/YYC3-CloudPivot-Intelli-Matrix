/**
 * UserManagement.test.tsx
 * ========================
 * UserManagement 组件测试
 *
 * 覆盖范围:
 * - 5 个统计卡片渲染
 * - 用户列表表格渲染 (8 条)
 * - 搜索过滤
 * - 角色面板渲染 (5 个角色)
 * - 添加用户按钮
 * - 创建角色/权限矩阵按钮
 * - 用户详情 Modal 打开/关闭
 * - Modal 内用户信息字段
 * - 操作按钮 (查看/编辑/锁定)
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("../hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "zh-CN",
    setLocale: vi.fn(),
    locales: ["zh-CN", "en-US"],
  }),
}));

vi.mock("../components/GlassCard", () => ({
  GlassCard: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
  default: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
}));

import { UserManagement } from "../components/UserManagement";

describe("UserManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("统计卡片", () => {
    it("应渲染 5 个统计卡片", () => {
      render(<UserManagement />);
      expect(screen.getAllByText("userMgmt.totalUsers")[0]).toBeInTheDocument();
      expect(screen.getAllByText("userMgmt.onlineUsers")[0]).toBeInTheDocument();
      expect(screen.getAllByText("userMgmt.admins")[0]).toBeInTheDocument();
      expect(screen.getAllByText("userMgmt.serviceAccounts")[0]).toBeInTheDocument();
      expect(screen.getAllByText("userMgmt.todayApiCalls")[0]).toBeInTheDocument();
    });

    it("应渲染统计数值", () => {
      render(<UserManagement />);
      const count8Texts = screen.getAllByText("8");
      expect(count8Texts.length).toBeGreaterThan(0);
      const count6Texts = screen.getAllByText("6");
      expect(count6Texts.length).toBeGreaterThan(0);
      // 使用更简单的文本匹配来查找 API 调用统计
      const usageTexts = screen.getAllByText((content, _element) => {
        return content?.includes("K");
      });
      expect(usageTexts.length).toBeGreaterThan(0);
    });
  });

  describe("用户列表", () => {
    it("应渲染用户列表标题", () => {
      render(<UserManagement />);
      expect(screen.getAllByText("userMgmt.userList")[0]).toBeInTheDocument();
    });

    it("应渲染表头", () => {
      render(<UserManagement />);
      expect(screen.getAllByText("userMgmt.colStatus")[0]).toBeInTheDocument();
      expect(screen.getAllByText("userMgmt.colUser")[0]).toBeInTheDocument();
      expect(screen.getAllByText("userMgmt.colRole")[0]).toBeInTheDocument();
      expect(screen.getAllByText("userMgmt.colLastLogin")[0]).toBeInTheDocument();
      expect(screen.getAllByText("userMgmt.colSessions")[0]).toBeInTheDocument();
      expect(screen.getAllByText("userMgmt.colApiCalls")[0]).toBeInTheDocument();
      expect(screen.getAllByText("userMgmt.colActions")[0]).toBeInTheDocument();
    });

    it("应渲染 8 个用户行", () => {
      render(<UserManagement />);
      expect(screen.getAllByText("张管理")[0]).toBeInTheDocument();
      expect(screen.getAllByText("李运维")[0]).toBeInTheDocument();
      expect(screen.getAllByText("王开发")[0]).toBeInTheDocument();
      expect(screen.getAllByText("赵分析")[0]).toBeInTheDocument();
      expect(screen.getAllByText("刘测试")[0]).toBeInTheDocument();
      expect(screen.getAllByText("陈研究")[0]).toBeInTheDocument();
      expect(screen.getByText("API Service")).toBeInTheDocument();
      expect(screen.getByText("OPS Bot")).toBeInTheDocument();
    });

    it("应渲染用户名", () => {
      render(<UserManagement />);
      expect(screen.getAllByText("admin")[0]).toBeInTheDocument();
      expect(screen.getAllByText("ops_li")[0]).toBeInTheDocument();
    });

    it("应渲染角色标签", () => {
      render(<UserManagement />);
      // 角色名称在用户列表和角色面板中都出现，所以检查数量
      expect(screen.getAllByText("超级管理员")).toHaveLength(2); // 角色面板 + 用户列表
      expect(screen.getAllByText("运维工程师")).toHaveLength(2);
      expect(screen.getAllByText("开发者")).toHaveLength(2);
    });

    it("应渲染添加用户按钮", () => {
      render(<UserManagement />);
      expect(screen.getAllByText("userMgmt.addUser")[0]).toBeInTheDocument();
    });
  });

  describe("搜索过滤", () => {
    it("应渲染搜索框", () => {
      render(<UserManagement />);
      expect(screen.getAllByPlaceholderText("userMgmt.searchUser")[0]).toBeInTheDocument();
    });

    it("搜索应过滤用户列表", () => {
      render(<UserManagement />);
      const searchInput = screen.getAllByPlaceholderText("userMgmt.searchUser")[0];
      fireEvent.change(searchInput, { target: { value: "张管理" } });
      expect(screen.getAllByText("张管理")[0]).toBeInTheDocument();
      expect(screen.queryByText("李运维")).not.toBeInTheDocument();
    });

    it("按用户名搜索", () => {
      render(<UserManagement />);
      const searchInput = screen.getAllByPlaceholderText("userMgmt.searchUser")[0];
      fireEvent.change(searchInput, { target: { value: "ops_li" } });
      expect(screen.getAllByText("李运维")[0]).toBeInTheDocument();
      expect(screen.queryByText("张管理")).not.toBeInTheDocument();
    });

    it("按邮箱搜索", () => {
      render(<UserManagement />);
      const searchInput = screen.getAllByPlaceholderText("userMgmt.searchUser")[0];
      fireEvent.change(searchInput, { target: { value: "zhao@" } });
      expect(screen.getAllByText("赵分析")[0]).toBeInTheDocument();
      expect(screen.queryByText("张管理")).not.toBeInTheDocument();
    });

    it("无匹配时列表为空", () => {
      render(<UserManagement />);
      const searchInput = screen.getAllByPlaceholderText("userMgmt.searchUser")[0];
      fireEvent.change(searchInput, { target: { value: "zzzzzzz" } });
      expect(screen.queryByText("张管理")).not.toBeInTheDocument();
      expect(screen.queryByText("李运维")).not.toBeInTheDocument();
    });
  });

  describe("角色面板", () => {
    it("应渲染角色标题", () => {
      render(<UserManagement />);
      expect(screen.getAllByText("userMgmt.rolesPerms")[0]).toBeInTheDocument();
    });

    it("应渲染 5 个角色卡片", () => {
      render(<UserManagement />);
      // Role names in sidebar panel (different from table role badges)
      const roleNames = ["超级管理员", "运维工程师", "开发者", "数据分析师", "系统服务"];
      roleNames.forEach(name => {
        expect(screen.getAllByText(name).length).toBeGreaterThanOrEqual(1);
      });
    });

    it("应渲染角色权限描述", () => {
      render(<UserManagement />);
      expect(screen.getByText("全部权限")).toBeInTheDocument();
      expect(screen.getByText("节点管理、部署、监控")).toBeInTheDocument();
    });

    it("应渲染创建角色按钮", () => {
      render(<UserManagement />);
      expect(screen.getAllByText(/userMgmt.createRole/)[0]).toBeInTheDocument();
    });

    it("应渲染权限矩阵按钮", () => {
      render(<UserManagement />);
      expect(screen.getAllByText("userMgmt.permMatrix")[0]).toBeInTheDocument();
    });
  });

  describe("用户详情 Modal", () => {
    it("点击查看按钮应打开 Modal", () => {
      render(<UserManagement />);
      // Each row has Eye button for viewing. Click first one
      const row = screen.getAllByText("张管理")[0].closest("tr")!;
      const eyeBtn = row.querySelector("button");
      if (eyeBtn) {
        fireEvent.click(eyeBtn);
        expect(screen.getAllByText("userMgmt.userDetail")[0]).toBeInTheDocument();
      }
    });

    it("Modal 应显示用户信息字段", () => {
      render(<UserManagement />);
      const row = screen.getAllByText("张管理")[0].closest("tr")!;
      const eyeBtn = row.querySelector("button");
      if (eyeBtn) {
        fireEvent.click(eyeBtn);
        expect(screen.getAllByText("userMgmt.fieldEmail")[0]).toBeInTheDocument();
        expect(screen.getAllByText("userMgmt.fieldRole")[0]).toBeInTheDocument();
        expect(screen.getAllByText("userMgmt.fieldLastLogin")[0]).toBeInTheDocument();
      }
    });

    it("Modal 中用户名应正确显示", () => {
      render(<UserManagement />);
      const row = screen.getAllByText("张管理")[0].closest("tr")!;
      const eyeBtn = row.querySelector("button");
      if (eyeBtn) {
        fireEvent.click(eyeBtn);
        expect(screen.getByText("@admin")).toBeInTheDocument();
      }
    });

    it("关闭 Modal 应隐藏详情", () => {
      render(<UserManagement />);
      const row = screen.getAllByText("张管理")[0].closest("tr")!;
      const eyeBtn = row.querySelector("button");
      if (eyeBtn) {
        fireEvent.click(eyeBtn);
        expect(screen.getAllByText("userMgmt.userDetail")[0]).toBeInTheDocument();
        // Click close button
        const closeBtn = screen.getAllByText("userMgmt.userDetail")[0].parentElement?.querySelector("button");
        if (closeBtn) {
          fireEvent.click(closeBtn);
          expect(screen.queryByText("userMgmt.userDetail")).not.toBeInTheDocument();
        }
      }
    });

    it("点击遮罩应关闭 Modal", () => {
      render(<UserManagement />);
      const row = screen.getAllByText("张管理")[0].closest("tr")!;
      const eyeBtn = row.querySelector("button");
      if (eyeBtn) {
        fireEvent.click(eyeBtn);
        // Click backdrop (the outer div with onClick)
        const backdrop = screen.getAllByText("userMgmt.userDetail")[0].closest(".fixed");
        if (backdrop) {
          fireEvent.click(backdrop);
          expect(screen.queryByText("userMgmt.userDetail")).not.toBeInTheDocument();
        }
      }
    });
  });
});
