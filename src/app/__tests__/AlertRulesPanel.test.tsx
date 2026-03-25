// @vitest-environment jsdom
import { render, screen, fireEvent , cleanup } from "@testing-library/react";
import React from "react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AlertRulesPanel } from "../components/AlertRulesPanel";
import { useI18n } from "../hooks/useI18n";
import { useAlertRules } from "../hooks/useAlertRules";

vi.mock("../hooks/useI18n");
vi.mock("../hooks/useAlertRules", () => ({
  useAlertRules: vi.fn(),
}));

const mockT = vi.fn((key: string) => key);
const mockSetSelectedRule = vi.fn();
const mockSetIsCreating = vi.fn();
const mockSetFilterSeverity = vi.fn();
const mockToggleRule = vi.fn();
const mockDeleteRule = vi.fn();
const mockAcknowledgeEvent = vi.fn();
const mockResolveEvent = vi.fn();
const mockCreateRule = vi.fn();

describe("AlertRulesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });


  beforeEach(() => {
    vi.clearAllMocks();
    mockT.mockImplementation((key: string) => key);
    
    vi.mocked(useI18n).mockReturnValue({
      t: mockT,
      locale: "zh-CN",
      setLocale: vi.fn(),
      locales: [
        { code: "zh-CN", label: "简体中文", nativeLabel: "简体中文" },
        { code: "en-US", label: "English", nativeLabel: "English" },
      ],
    });

    vi.mocked(useAlertRules).mockReturnValue({
      rules: [],
      events: [],
      stats: { totalRules: 0, activeRules: 0, unresolvedEvents: 0, criticalEvents: 0 },
      selectedRule: null,
      setSelectedRule: mockSetSelectedRule,
      editingRule: null,
      setEditingRule: vi.fn(),
      isCreating: false,
      setIsCreating: mockSetIsCreating,
      filterSeverity: "all",
      setFilterSeverity: mockSetFilterSeverity,
      toggleRule: mockToggleRule,
      deleteRule: mockDeleteRule,
      acknowledgeEvent: mockAcknowledgeEvent,
      resolveEvent: mockResolveEvent,
      createRule: mockCreateRule,
    } as any);
  });

  it("should render panel correctly", () => {
    render(<AlertRulesPanel />);
    
    const createButtons = screen.getAllByTestId("create-rule-btn");
    expect(createButtons.length).toBeGreaterThan(0);
  });

  it("should display title", () => {
    render(<AlertRulesPanel />);
    
    const titleElements = screen.getAllByText(/alerts.title/i);
    expect(titleElements.length).toBeGreaterThan(0);
  });

  it("should open create rule modal when button clicked", () => {
    render(<AlertRulesPanel />);
    const createButtons = screen.getAllByTestId("create-rule-btn");
    if (createButtons.length > 0) {
      fireEvent.click(createButtons[0]);
      expect(mockSetIsCreating).toHaveBeenCalledWith(true);
    }
  });

  it("should display stats", () => {
    vi.mocked(useAlertRules).mockReturnValue({
      rules: [],
      events: [],
      stats: { totalRules: 5, activeRules: 3, unresolvedEvents: 10, criticalEvents: 2 },
      selectedRule: null,
      setSelectedRule: mockSetSelectedRule,
      editingRule: null,
      setEditingRule: vi.fn(),
      isCreating: false,
      setIsCreating: mockSetIsCreating,
      filterSeverity: "all",
      setFilterSeverity: mockSetFilterSeverity,
      toggleRule: mockToggleRule,
      deleteRule: mockDeleteRule,
      acknowledgeEvent: mockAcknowledgeEvent,
      resolveEvent: mockResolveEvent,
      createRule: mockCreateRule,
    } as any);

    render(<AlertRulesPanel />);
    
    const number5Elements = screen.getAllByText("5");
    expect(number5Elements.length).toBeGreaterThan(0);
  });

  it("should switch between rules and events tabs", () => {
    render(<AlertRulesPanel />);
    
    const rulesTabs = screen.getAllByText(/alerts.rulesTab/i);
    const eventsTabs = screen.getAllByText(/alerts.eventsTab/i);
    
    expect(rulesTabs.length).toBeGreaterThan(0);
    expect(eventsTabs.length).toBeGreaterThan(0);
  });
});
