/**
 * ai-suggestion-service.test.ts
 * ===========================
 * AI 建议服务 - 单元测试
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const mockSupabase = {
  from: vi.fn(),
};

vi.mock("../lib/native-supabase-client", () => ({
  getNativeSupabaseClient: () => mockSupabase,
}));

vi.mock("../lib/query-monitor", () => ({
  queryMonitor: {
    wrapQuery: async (_name: string, _table: string, _operation: string, fn: () => any) => {
      return await fn();
    },
  },
}));

describe("AISuggestionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getPatterns", () => {
    it("应返回模式列表", async () => {
      const { AISuggestionService } = await import("../lib/ai-suggestion-service");
      const aiService = new AISuggestionService();

      const mockPatterns = [
        {
          id: "pat-1",
          type: "performance",
          severity: "medium",
          title: "High Latency",
          description: "Latency exceeds threshold",
          source: "system",
          metric: "latency",
          detected_at: new Date().toISOString(),
          occurrences: 5,
          trend: "increasing",
          resolved: false,
          resolved_at: null,
        },
      ];

      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockPatterns,
              error: null,
            }),
          }),
        }),
      });

      const result = await aiService.getPatterns();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("High Latency");
    });
  });

  describe("getRecommendations", () => {
    it("应返回建议列表", async () => {
      const { AISuggestionService } = await import("../lib/ai-suggestion-service");
      const aiService = new AISuggestionService();

      const mockRecommendations = [
        {
          id: "rec-1",
          pattern_id: "pat-1",
          action: "Optimize Query",
          description: "Query performance can be improved",
          impact: "high",
          confidence: 0.85,
          auto_executable: true,
          applied: false,
        },
      ];

      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockRecommendations,
              error: null,
            }),
          }),
        }),
      });

      const result = await aiService.getRecommendations();

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].action).toBe("Optimize Query");
    });
  });
});
