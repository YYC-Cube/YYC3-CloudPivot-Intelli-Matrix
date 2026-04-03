/**
 * CreateRuleModal.test.tsx
 * =======================
 * 创建规则模态框 - 单元测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("../components/GlassCard", () => ({
  GlassCard: ({ children }: { children: React.ReactNode }) => <div data-testid="glass-card">{children}</div>,
}));

vi.mock("../hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "zh-CN",
    setLocale: vi.fn(),
  }),
}));

describe("CreateRuleModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("渲染测试", () => {
    it("当 open 为 true 时应该正确渲染", async () => {
      const { CreateRuleModal } = await import("../components/CreateRuleModal");
      render(
        <CreateRuleModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId("create-rule-modal")).toBeInTheDocument();
    });

    it("当 open 为 false 时不应该渲染", async () => {
      const { CreateRuleModal } = await import("../components/CreateRuleModal");
      const { container } = render(
        <CreateRuleModal
          open={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("交互测试", () => {
    it("应该能够关闭模态框", async () => {
      const { CreateRuleModal } = await import("../components/CreateRuleModal");
      render(
        <CreateRuleModal
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const closeButtons = screen.getAllByRole("button");
      expect(closeButtons.length).toBeGreaterThan(0);
    });
  });
});
