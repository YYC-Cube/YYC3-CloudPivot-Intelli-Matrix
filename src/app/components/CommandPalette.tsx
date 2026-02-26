/**
 * CommandPalette.tsx
 * ===================
 * 全局命令面板 · Cmd/Ctrl+K 触发
 *
 * i18n 已迁移
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Search, ArrowRight, Keyboard, X,
  Activity, Bell, Shield, Wrench, FolderOpen, Terminal,
  Code2, FileSearch, Users, Settings, Bot, BarChart3,
  Cpu,
} from "lucide-react";
import { useNavigate } from "react-router";
import { SHORTCUT_LIST } from "../hooks/useKeyboardShortcuts";
import { useI18n } from "../hooks/useI18n";

const iconMap: Record<string, React.ElementType> = {
  Activity, Bell, Shield, Wrench, FolderOpen, Terminal,
  Code2, FileSearch, Users, Settings, Bot, BarChart3,
  Cpu,
};

interface PaletteItem {
  id: string;
  labelKey: string;
  descKey: string;
  category: string;
  icon: string;
  path?: string;
  shortcut?: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  { id: "nav-home",       labelKey: "nav.dataMonitor",  descKey: "monitor.subtitle",          category: "nav",  icon: "Activity",   path: "/",            shortcut: "" },
  { id: "nav-followup",   labelKey: "nav.followUp",     descKey: "followUp.subtitle",         category: "nav",  icon: "Bell",       path: "/follow-up",   shortcut: "⌘+Shift+A" },
  { id: "nav-patrol",     labelKey: "nav.patrol",       descKey: "patrol.subtitle",           category: "nav",  icon: "Shield",     path: "/patrol",      shortcut: "⌘+Shift+P" },
  { id: "nav-operations", labelKey: "nav.operations",   descKey: "operations.subtitle",       category: "nav",  icon: "Wrench",     path: "/operations",  shortcut: "⌘+Shift+O" },
  { id: "nav-files",      labelKey: "nav.fileManager",  descKey: "fileManager.subtitle",      category: "nav",  icon: "FolderOpen", path: "/files",       shortcut: "⌘+Shift+F" },
  { id: "nav-terminal",   labelKey: "nav.terminal",     descKey: "palette.navigate",          category: "nav",  icon: "Terminal",   path: "/terminal",    shortcut: "⌘+Shift+L" },
  { id: "nav-ide",        labelKey: "nav.ide",          descKey: "palette.navigate",          category: "nav",  icon: "Code2",      path: "/ide" },
  { id: "nav-ai",         labelKey: "nav.aiDecision",   descKey: "ai.subtitle",               category: "nav",  icon: "Bot",        path: "/ai" },
  { id: "nav-loop",       labelKey: "nav.serviceLoop",  descKey: "loop.subtitle",             category: "nav",  icon: "Activity",   path: "/loop" },
  { id: "nav-design",     labelKey: "nav.designSystem", descKey: "devGuide.architecture",     category: "nav",  icon: "BarChart3",  path: "/design-system" },
  { id: "nav-devguide",   labelKey: "nav.devGuide",     descKey: "devGuide.subtitle",         category: "nav",  icon: "Activity",   path: "/dev-guide" },
  { id: "nav-models",     labelKey: "modelProvider.title", descKey: "modelProvider.subtitle", category: "nav",  icon: "Cpu",        path: "/models" },
  { id: "nav-audit",      labelKey: "nav.audit",        descKey: "palette.navigate",          category: "nav",  icon: "FileSearch", path: "/audit" },
  { id: "nav-users",      labelKey: "nav.userMgmt",     descKey: "palette.navigate",          category: "nav",  icon: "Users",      path: "/users" },
  { id: "nav-settings",   labelKey: "nav.settings",     descKey: "settings.title",            category: "nav",  icon: "Settings",   path: "/settings" },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setShowShortcuts(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) {return PALETTE_ITEMS;}
    const q = query.toLowerCase();
    return PALETTE_ITEMS.filter(
      (item) =>
        t(item.labelKey).toLowerCase().includes(q) ||
        t(item.descKey).toLowerCase().includes(q)
    );
  }, [query, t]);

  const executeItem = useCallback((item: PaletteItem) => {
    if (item.path) {
      navigate(item.path);
    }
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      executeItem(filteredItems[selectedIndex]);
    }
  };

  if (!isOpen) {return null;}

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
      data-testid="command-palette-overlay"
    >
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm" />

      <div
        className="relative w-full max-w-[560px] mx-4 rounded-xl bg-[rgba(8,25,55,0.95)] border border-[rgba(0,180,255,0.2)] shadow-[0_0_60px_rgba(0,180,255,0.1)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        data-testid="command-palette"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(0,180,255,0.1)]">
          <Search className="w-4 h-4 text-[rgba(0,212,255,0.4)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t("palette.placeholder")}
            className="flex-1 bg-transparent text-[#e0f0ff] placeholder-[rgba(0,212,255,0.25)] outline-none"
            style={{ fontSize: "0.88rem" }}
            data-testid="palette-input"
          />
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className={`p-1.5 rounded-lg transition-all ${
              showShortcuts ? "bg-[rgba(0,212,255,0.1)] text-[#00d4ff]" : "text-[rgba(0,212,255,0.3)] hover:text-[#00d4ff]"
            }`}
            title={t("palette.shortcutHelp")}
            data-testid="shortcuts-toggle"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[rgba(0,212,255,0.3)] hover:text-[#00d4ff] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts help */}
        {showShortcuts ? (
          <div className="p-4 max-h-[50vh] overflow-y-auto" data-testid="shortcuts-panel">
            <p className="text-[rgba(0,212,255,0.4)] mb-3" style={{ fontSize: "0.72rem" }}>
              {t("palette.shortcutHelp")}
            </p>
            <div className="space-y-1.5">
              {SHORTCUT_LIST.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,40,80,0.08)]"
                >
                  <span className="text-[#c0dcf0]" style={{ fontSize: "0.75rem" }}>
                    {s.description}
                  </span>
                  <kbd
                    className="px-2 py-0.5 rounded bg-[rgba(0,40,80,0.3)] text-[rgba(0,212,255,0.6)] border border-[rgba(0,180,255,0.1)]"
                    style={{ fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="max-h-[50vh] overflow-y-auto py-1"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,180,255,0.15) transparent" }}
            data-testid="palette-results"
          >
            {filteredItems.length > 0 ? (
              filteredItems.map((item, i) => {
                const Icon = iconMap[item.icon] ?? Activity;
                const isSelected = i === selectedIndex;

                return (
                  <button
                    key={item.id}
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                      isSelected
                        ? "bg-[rgba(0,212,255,0.08)]"
                        : "hover:bg-[rgba(0,212,255,0.04)]"
                    }`}
                    data-testid={`palette-item-${item.id}`}
                  >
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={{ color: isSelected ? "#00d4ff" : "rgba(0,212,255,0.35)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`truncate ${isSelected ? "text-[#e0f0ff]" : "text-[#c0dcf0]"}`} style={{ fontSize: "0.78rem" }}>
                        {t(item.labelKey)}
                      </p>
                      <p className="text-[rgba(0,212,255,0.25)] truncate" style={{ fontSize: "0.62rem" }}>
                        {t(item.descKey)}
                      </p>
                    </div>
                    {item.shortcut && (
                      <kbd
                        className="px-1.5 py-0.5 rounded bg-[rgba(0,40,80,0.2)] text-[rgba(0,212,255,0.35)] shrink-0 hidden sm:block"
                        style={{ fontSize: "0.58rem", fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3 h-3 text-[#00d4ff] shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-[rgba(0,212,255,0.3)]" style={{ fontSize: "0.78rem" }}>
                  {t("palette.noResults")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[rgba(0,180,255,0.06)] text-[rgba(0,212,255,0.2)]" style={{ fontSize: "0.58rem" }}>
          <span>↑↓ {t("palette.navigate")}</span>
          <span>Enter {t("palette.enter")}</span>
          <span>Esc {t("palette.escape")}</span>
          <span className="ml-auto">⌘K {t("palette.open")}</span>
        </div>
      </div>
    </div>
  );
}
