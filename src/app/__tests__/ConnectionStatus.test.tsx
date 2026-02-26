/**
 * ConnectionStatus.test.tsx
 * ==========================
 * ConnectionStatus 组件 - 渲染测试
 *
 * 覆盖范围:
 * - 5 种连接状态的正确渲染
 * - 标签文本映射
 * - compact 模式
 * - 重连按钮显示逻辑
 * - 重连次数显示
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ConnectionStatus } from "../components/ConnectionStatus";
import type { ConnectionState } from "../types";

const defaultProps = {
  reconnectCount: 0,
  lastSyncTime: "14:30:00",
  onReconnect: vi.fn(),
};

describe("ConnectionStatus", () => {

afterEach(() => {
  cleanup();
});
  // ----------------------------------------------------------
  // 5 种连接状态
  // ----------------------------------------------------------

  describe("连接状态渲染", () => {

afterEach(() => {
  cleanup();
});
    const stateLabels: Record<ConnectionState, string> = {
      connected: "实时连接",
      connecting: "连接中...",
      reconnecting: "重连中",
      disconnected: "已断开",
      simulated: "模拟模式",
    };

    for (const [state, label] of Object.entries(stateLabels)) {
      it(`应正确渲染 "${state}" 状态文本`, () => {
        render(
          <ConnectionStatus
            state={state as ConnectionState}
            {...defaultProps}
          />
        );
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    }
  });

  // ----------------------------------------------------------
  // compact 模式
  // ----------------------------------------------------------

  describe("compact 模式", () => {

afterEach(() => {
  cleanup();
});
    it("compact=true 时应渲染为 button", () => {
      render(
        <ConnectionStatus state="connected" compact {...defaultProps} />
      );
      const btn = screen.getAllByRole("button")[0];
      expect(btn).toBeInTheDocument();
      expect(btn.textContent).toContain("实时连接");
    });

    it("compact 模式点击应触发 onReconnect", () => {
      const handleReconnect = vi.fn() as any;
      render(
        <ConnectionStatus
          state="connected"
          compact
          {...defaultProps}
          onReconnect={handleReconnect}
        />
      );
      fireEvent.click(screen.getAllByRole("button")[0]);
      expect(handleReconnect).toHaveBeenCalledTimes(1);
    });

    it("compact 模式重连状态应显示计数 (x/10)", () => {
      render(
        <ConnectionStatus
          state="reconnecting"
          reconnectCount={3}
          lastSyncTime="14:30:00"
          onReconnect={vi.fn()}
          compact
        />
      );
      expect(screen.getAllByText("(3/10)")[0]).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------
  // 完整模式
  // ----------------------------------------------------------

  describe("完整模式", () => {

afterEach(() => {
  cleanup();
});
    it("应显示最后同步时间", () => {
      render(
        <ConnectionStatus state="connected" {...defaultProps} />
      );
      expect(screen.getAllByText("14:30:00")[0]).toBeInTheDocument();
    });

    it("disconnected 时应显示重连按钮", () => {
      render(
        <ConnectionStatus state="disconnected" {...defaultProps} />
      );
      const reconnectBtn = screen.getByTitle("手动重连");
      expect(reconnectBtn).toBeInTheDocument();
    });

    it("simulated 时应显示重连按钮", () => {
      render(
        <ConnectionStatus state="simulated" {...defaultProps} />
      );
      const reconnectBtn = screen.getByTitle("手动重连");
      expect(reconnectBtn).toBeInTheDocument();
    });

    it("connected 时不应显示重连按钮", () => {
      render(
        <ConnectionStatus state="connected" {...defaultProps} />
      );
      expect(screen.queryByTitle("手动重连")).not.toBeInTheDocument();
    });

    it("重连按钮点击应触发 onReconnect", () => {
      const handleReconnect = vi.fn() as any;
      render(
        <ConnectionStatus
          state="disconnected"
          {...defaultProps}
          onReconnect={handleReconnect}
        />
      );
      fireEvent.click(screen.getByTitle("手动重连"));
      expect(handleReconnect).toHaveBeenCalledTimes(1);
    });
  });
});
