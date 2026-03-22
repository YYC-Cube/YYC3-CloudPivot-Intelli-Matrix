/**
 * Login.test.tsx
 * ===============
 * Login 组件 - 渲染与交互测试
 *
 * 覆盖范围:
 * - 表单元素渲染
 * - 邮箱/密码输入
 * - 登录成功/失败流程
 * - 密码显示/隐藏切换
 * - 错误信息展示
 * - 加载状态
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Login } from "../components/Login";

// Mock supabaseClient
vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

import { supabase } from "../lib/supabaseClient";

const mockSignIn = supabase.auth.signInWithPassword as Mock;

describe("Login", () => {
  const mockOnLoginSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // ----------------------------------------------------------
  // 基础渲染
  // ----------------------------------------------------------

  describe("基础渲染", () => {
    it("应渲染登录表单", () => {
      render(<Login onLoginSuccess={mockOnLoginSuccess} />);

      expect(screen.getByTestId("login-title")).toBeInTheDocument();
      expect(screen.getByText("登录邮箱")).toBeInTheDocument();
      expect(screen.getByText("密码")).toBeInTheDocument();
      expect(screen.getByTestId("login-submit-button")).toBeInTheDocument();
    });

    it("应渲染 Demo 账号提示", () => {
      render(<Login onLoginSuccess={mockOnLoginSuccess} />);
      expect(
        screen.getByText(/admin@cloudpivot\.local.*admin123/)
      ).toBeInTheDocument();
    });

    it("应包含邮箱和密码输入框", () => {
      render(<Login onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByTestId("login-email-input");
      const pwdInput = screen.getByTestId("login-password-input");

      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute("type", "email");
      expect(pwdInput).toBeInTheDocument();
      expect(pwdInput).toHaveAttribute("type", "password");
    });

    it("应显示品牌标语", () => {
      render(<Login onLoginSuccess={mockOnLoginSuccess} />);
      expect(screen.getByTestId("login-subtitle")).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------
  // 密码显示切换
  // ----------------------------------------------------------

  describe("密码显隐切换", () => {
    it("点击眼睛按钮应切换密码可见性", async () => {
      render(<Login onLoginSuccess={mockOnLoginSuccess} />);

      const pwdInput = screen.getByTestId("login-password-input");
      expect(pwdInput).toHaveAttribute("type", "password");

      const eyeBtn = screen.getByTestId("login-toggle-password");
      fireEvent.click(eyeBtn);
      expect(pwdInput).toHaveAttribute("type", "text");

      fireEvent.click(eyeBtn);
      expect(pwdInput).toHaveAttribute("type", "password");
    });
  });

  // ----------------------------------------------------------
  // 登录成功
  // ----------------------------------------------------------

  describe("登录成功", () => {
    it("正确凭据应调用 onLoginSuccess", async () => {
      mockSignIn.mockResolvedValue({
        data: { user: { email: "admin@cloudpivot.local", role: "admin" } },
        error: null,
      });

      render(<Login onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByTestId("login-email-input");
      const pwdInput = screen.getByTestId("login-password-input");

      await userEvent.type(emailInput, "admin@cloudpivot.local");
      await userEvent.type(pwdInput, "admin123");

      fireEvent.submit(screen.getByTestId("login-submit-button").closest("form")!);

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ----------------------------------------------------------
  // 登录失败
  // ----------------------------------------------------------

  describe("登录失败", () => {
    it("错误密码应显示错误信息", async () => {
      mockSignIn.mockResolvedValue({
        data: null,
        error: { message: "邮箱或密码不正确" },
      });

      render(<Login onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByTestId("login-email-input");
      const pwdInput = screen.getByTestId("login-password-input");

      await userEvent.type(emailInput, "admin@cloudpivot.local");
      await userEvent.type(pwdInput, "wrongpassword");

      fireEvent.submit(screen.getByTestId("login-submit-button").closest("form")!);

      await waitFor(() => {
        expect(screen.getByText("邮箱或密码不正确")).toBeInTheDocument();
      });

      expect(mockOnLoginSuccess).not.toHaveBeenCalled();
    });

    it("网络异常应显示网络错误信息", async () => {
      mockSignIn.mockRejectedValue(new Error("Network failure"));

      render(<Login onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByTestId("login-email-input");
      const pwdInput = screen.getByTestId("login-password-input");

      await userEvent.type(emailInput, "admin@cloudpivot.local");
      await userEvent.type(pwdInput, "admin123");

      fireEvent.submit(screen.getByTestId("login-submit-button").closest("form")!);

      await waitFor(() => {
        expect(
          screen.getByText("登录失败，请检查网络连接")
        ).toBeInTheDocument();
      });
    });
  });

  // ----------------------------------------------------------
  // 加载状态
  // ----------------------------------------------------------

  describe("加载状态", () => {
    it("提交后按钮应显示加载状态", async () => {
      mockSignIn.mockReturnValue(new Promise(() => {}));

      render(<Login onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByTestId("login-email-input");
      const pwdInput = screen.getByTestId("login-password-input");

      await userEvent.type(emailInput, "admin@cloudpivot.local");
      await userEvent.type(pwdInput, "admin123");

      fireEvent.submit(screen.getByTestId("login-submit-button").closest("form")!);

      await waitFor(() => {
        expect(screen.getByText("验证中...")).toBeInTheDocument();
      });
    });
  });
});