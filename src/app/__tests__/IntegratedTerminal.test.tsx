/**
 * IntegratedTerminal.test.tsx
 * ===========================
 * 集成终端 - 单元测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { IntegratedTerminal } from "../components/IntegratedTerminal";

vi.mock("../components/GlassCard", () => ({
  GlassCard: ({ children }: { children: React.ReactNode }) => <div data-testid="glass-card">{children}</div>,
}));

vi.mock("../hooks/useTerminal", () => ({
  useTerminal: () => ({
    history: [
      {
        id: "init-main",
        input: "",
        output: "Welcome to YYC³ Terminal\nType 'help' for available commands",
        timestamp: Date.now(),
        status: "info",
      },
    ],
    inputValue: "",
    completions: [],
    execute: vi.fn(),
    handleInputChange: vi.fn(),
    handleHistoryNav: vi.fn(),
    applyCompletion: vi.fn(),
  }),
}));

vi.mock("../hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "zh-CN",
    setLocale: vi.fn(),
  }),
}));

vi.mock("../lib/view-context", () => ({
  ViewContext: React.createContext({
    currentView: "terminal",
    setCurrentView: vi.fn(),
    isMobile: false,
  }),
}));

vi.mock("../lib/authContext", () => ({
  AuthContext: React.createContext({
    user: null,
    session: null,
    signOut: vi.fn(),
  }),
}));

vi.mock("../lib/supabaseClient", () => ({
  isGhostMode: vi.fn().mockReturnValue(true),
}));

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

describe("IntegratedTerminal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("渲染测试", () => {
    it("当 open 为 true 时应该正确渲染", () => {
      render(<IntegratedTerminal open={true} onClose={mockOnClose} />);
      const welcomeTexts = screen.getAllByText(/Welcome to YYC³ Terminal/);
      expect(welcomeTexts.length).toBeGreaterThan(0);
    });

    it("当 open 为 false 时不应该渲染", () => {
      const { container } = render(<IntegratedTerminal open={false} onClose={mockOnClose} />);
      expect(container.firstChild).toBeNull();
    });

    it("应该显示终端输出", () => {
      render(<IntegratedTerminal open={true} onClose={mockOnClose} />);
      const welcomeTexts = screen.getAllByText(/Welcome to YYC³ Terminal/);
      expect(welcomeTexts.length).toBeGreaterThan(0);
    });
  });

  describe("交互测试", () => {
    it("应该能够点击按钮", () => {
      render(<IntegratedTerminal open={true} onClose={mockOnClose} />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
