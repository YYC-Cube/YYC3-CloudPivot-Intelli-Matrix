# AGENTS.md

Guide for AI agents working on the YYC³ CloudPivot Intelli-Matrix codebase.

## Project Overview

**YYC³ CloudPivot Intelli-Matrix** is a React 19 + TypeScript application with Electron desktop support, featuring AI-powered monitoring and operations capabilities. It's a PWA with offline support, internationalization (Chinese/English), and a cyberpunk-themed design system.

### Tech Stack

- **Frontend**: React 19.2.4, TypeScript 5.9.3 (strict mode), Vite 7.3.1
- **Routing**: React Router v7 with hash routing (`createHashRouter`)
- **Styling**: TailwindCSS v4.2.1 with custom cyberpunk theme
- **UI Components**: Radix UI primitives, MUI Material (limited), Lucide icons
- **Data Visualization**: Recharts
- **Desktop**: Electron 28 (auto-updater, tray, native notifications)
- **Testing**: Vitest with jsdom, React Testing Library
- **Auth**: Supabase with mock mode fallback (Ghost Mode)
- **PWA**: Service Worker, offline-first architecture
- **Package Manager**: pnpm (workspace configured)

### Key Architecture Features

- **Type Safety**: Strict TypeScript with comprehensive type definitions in `src/app/types/index.ts`
- **Component Organization**: Business components + Radix UI design system in `src/app/components/ui/`
- **Context Providers**: AuthContext, I18nContext, WebSocketContext, ViewContext
- **Custom Hooks**: Centralized in `src/app/hooks/` for reusable logic
- **Internationalization**: `useI18n()` hook with nested key support and template variables
- **Electron Integration**: Main process in `electron/`, preload script, auto-updater
- **PWA**: Install prompts, offline mode, service worker status panel

## Essential Commands

### Development

```bash
# Start development server (http://localhost:3218)
pnpm dev

# Start Electron desktop app in dev mode
pnpm electron:dev
```

### Building

```bash
# Standard production build (Vite frontend only)
pnpm build

# Build Electron app (current platform)
pnpm build:electron

# Platform-specific Electron builds
pnpm build:mac    # macOS (arm64 + x64)
pnpm build:win    # Windows (x64, NSIS installer)
pnpm build:linux  # Linux (AppImage + deb)
```

### Testing

```bash
# Run tests once
pnpm test

# Watch mode for development
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# CI mode (sharded across 4 shards)
pnpm test:ci
```

### Code Quality

```bash
# Type checking (no emit)
pnpm type-check

# Lint code
pnpm lint

# Auto-fix lint issues
pnpm lint:fix
```

### Cleanup

```bash
# Remove build artifacts and cache
pnpm clean
```

### Docker

```bash
# Build Docker image
pnpm docker:build

# Run container
pnpm docker:run
```

## Project Structure

```
src/
├── main.tsx                    # Entry point (ReactDOM.createRoot)
├── styles/                     # Global styles (fonts, tailwind, theme)
├── lib/
│   └── layoutContext.tsx      # WebSocket + View contexts
├── app/
│   ├── App.tsx                # Root component (Auth + Router)
│   ├── routes.tsx              # Hash router configuration
│   ├── components/             # React components
│   │   ├── ui/                # Radix UI design system
│   │   ├── Dashboard.tsx      # Main monitoring dashboard
│   │   ├── Layout.tsx         # App shell (sidebar, topbar)
│   │   └── [60+ components]   # Feature components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities
│   │   ├── supabaseClient.ts  # Auth with mock mode
│   │   ├── error-handler.ts   # Global error handling
│   │   └── backgroundSync.ts  # Offline sync queue
│   ├── i18n/                  # Internationalization
│   │   ├── zh-CN.ts           # Chinese translations
│   │   └── en-US.ts           # English translations
│   ├── types/                 # Centralized TypeScript types
│   ├── docs/                  # Developer documentation
│   └── __tests__/             # Test files + setup
electron/
├── main.ts                    # Electron main process
├── preload.ts                 # Preload script (IPC)
└── tsconfig.json              # Electron TypeScript config
```

## Code Conventions

### TypeScript

- **Strict Mode**: Enabled in `tsconfig.json`
- **Type Location**: All types in `src/app/types/index.ts` - import from here
- **Component Props**: Define explicit interfaces
- **Unused Variables**: Prefix with `_` to satisfy ESLint rule

### Component Patterns

```typescript
// Component file structure
import { useState, useContext } from "react";
import { ComponentName } from "../components/Component";
import { useHookName } from "../hooks/useHookName";
import { SomeType, SomeEnum } from "../types";

interface ComponentProps {
  requiredProp: string;
  optionalProp?: number;
}

export default function Component({ requiredProp, optionalProp = 0 }: ComponentProps) {
  const { t } = useI18n();
  const [state, setState] = useState("");

  return <div>{requiredProp}</div>;
}
```

### Hooks

- **Naming**: `use` prefix, camelCase (e.g., `useI18n`, `useWebSocketData`)
- **Location**: All hooks in `src/app/hooks/`
- **Pattern**: Return state and actions (e.g., `{ locale, setLocale, t }`)

### Styling

- **Utility Classes**: Tailwind CSS with custom theme
- **Colors**: Deep blue (`#060e1f`) + cyan (`#00d4ff`) cyberpunk theme
- **Responsive**: Mobile-first with breakpoint system
- **Animation**: Use `motion` library (Framer Motion equivalent)

### i18n

```typescript
// Use the hook
const { t, locale, setLocale } = useI18n();

// Simple translation
const text = t("nav.dataMonitor");

// With variables
const msg = t("common.nMinutesAgo", { n: 5 });
```

## Testing Patterns

### Test Structure

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// Mock external dependencies
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  // ... other mocks
}));

vi.mock("../hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "zh-CN",
    setLocale: vi.fn(),
  }),
}));

// Setup and cleanup
beforeEach(() => {
  // Reset mocks, setup context
});

afterEach(() => {
  cleanup();
});

describe("ComponentName", () => {
  it("should render correctly", () => {
    render(<ComponentName />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

### Mock Guidelines

- **Recharts**: Complex library - always mock to `vitest/environemnt jsdom`
- **React Router**: Mock `useNavigate`, `useLocation`
- **Contexts**: Use `Context.Provider` wrappers in tests
- **Custom Hooks**: Use `vi.mock` for isolated unit tests

### Test Files

- **Location**: `src/app/__tests__/`
- **Setup**: `setup.ts` configures jsdom mocks (ResizeObserver, IntersectionObserver, etc.)
- **Coverage**: Configured for `jsdom`, excludes `ui/` components (external design system)

## Important Patterns & Gotchas

### 1. Authentication Flow

- **Ghost Mode**: Click "GHOST MODE" on login page to skip auth (dev convenience)
- **Mock Auth**: `src/app/lib/supabaseClient.ts` provides mock implementation
- **Roles**: `admin` | `developer` (defined in `src/app/types/index.ts`)
- **Session**: Stored in localStorage under `yyc3_session`

### 2. Routing

- **Strategy**: Hash routing (`createHashRouter`)
- **Route Config**: All routes in `src/app/routes.tsx`
- **Navigation**: Use `react-router-dom` (v7)
- **404 Handling**: Configure fallback route in router config

### 3. WebSocket Data

- **Hook**: `useWebSocketData()` from `src/app/hooks/useWebSocketData.ts`
- **Context**: Provided via `WebSocketContext`
- **States**: `connecting`, `connected`, `disconnected`, `reconnecting`, `simulated`
- **Fallback**: Simulated mode when WebSocket unavailable

### 4. Electron Integration

- **Entry**: `electron/main.ts` creates BrowserWindow with security settings
- **IPC**: Preload script at `electron/preload.ts` enables secure IPC
- **Auto-updater**: Uses `electron-updater` with GitHub releases
- **Build**: Multi-platform builds via `electron-builder`

### 5. PWA & Offline

- **Install Prompt**: Handled by `usePWAManager()` hook
- **Service Worker**: Check status in PWAStatusPanel component
- **Offline Mode**: Background sync queue in `src/app/lib/backgroundSync.ts`

### 6. Error Handling

- **Global Handler**: `src/app/lib/error-handler.ts`
- **Error Boundary**: `ErrorBoundary` component wraps page routes
- **Error Categories**: `NETWORK`, `PARSE`, `AUTH`, `RUNTIME`, `VALIDATION`, `STORAGE`
- **Error Severity**: `info`, `warning`, `error`, `critical`

### 7. Type Safety

- **No `any`**: Use explicit types - `any` triggers ESLint warning
- **Unused Params**: Prefix with `_` (e.g., `_param: string`)
- **Type Imports**: Import from `src/app/types/index.ts`
- **Conversion**: Helper functions like `toNodeData()` transform DB types to UI types

## CI/CD Pipeline

### GitHub Actions Workflows

1. **CI/CD Pipeline** (`ci.yml`):
   - Dependency review (PRs only)
   - Code quality checks (lint, type-check, prettier)
   - Sharded tests (4 shards in parallel)
   - Build verification
   - Docker build & push (main branch + tags)

2. **Release Automation** (`release.yml`):
   - Validates version tags (semver format)
   - Builds release assets (tar.gz, zip)
   - Creates GitHub releases with changelog
   - Publishes Docker images to GHCR
   - Sends notifications (optional Slack)

### Environment Variables

```bash
NODE_VERSION=20.x
PNPM_VERSION=9.x
```

### Quality Gates

- **Type Checking**: `pnpm exec tsc --noEmit`
- **Linting**: `pnpm run lint:fix` (auto-fix enabled)
- **Tests**: Must pass all shards
- **Coverage**: 10% minimum threshold (currently ~14%)

## Build Configuration

### Vite Config

- **Base Path**: `./` for Electron compatibility
- **Port**: 3218 (dev server)
- **Plugins**: React + TailwindCSS
- **Alias**: `@/*` → `./src/*`
- **Chunks**: Manual chunks for vendor splitting (react-vendor, mui-vendor, radix-vendor, etc.)
- **Minify**: esbuild in production
- **Optimization**: Drops console/debugger statements in production

### TypeScript Configs

- **Main**: `tsconfig.json` (React app, strict mode)
- **Electron**: `tsconfig.electron.json` (Node.js target)
- **Node**: `tsconfig.node.json` (Vite config files)

### Prettier Config

- **Semicolons**: Required
- **Quotes**: Double
- **Indent**: 2 spaces, tabs disabled
- **Line Width**: 100
- **End of Line**: LF

## Common Issues

### 1. Chart.tsx Type Errors

**Issue**: Recharts components have complex type definitions

**Solution**: Recharts is mocked in tests. For components, use correct prop types from `recharts` package imports.

### 2. Electron Build Fails

**Issue**: macOS code signing or entitlements

**Solution**: Check `resources/entitlements.mac.plist` and ensure `electron-builder` config matches platform requirements.

### 3. PWA Service Worker Not Updating

**Issue**: Service worker stuck in old version

**Solution**: Check PWAStatusPanel for status, use skip waiting in service worker code.

### 4. WebSocket Connection Refused

**Issue**: WebSocket URL incorrect or server not running

**Solution**: App falls back to simulated mode. Configure `wsUrl` in network settings.

### 5. Translation Keys Missing

**Issue**: `t("key")` returns the key string instead of translation

**Solution**: Add missing keys to both `src/app/i18n/zh-CN.ts` and `src/app/i18n/en-US.ts`.

## Dependencies Management

- **Package Manager**: pnpm (workspace configured)
- **Lockfile**: `pnpm-lock.yaml` (commit this file)
- **Node Version**: 20.x
- **Install**: `pnpm install --frozen-lockfile` (CI) or `pnpm install` (local)

### Key Dependencies

- React 19.2.4, React DOM 19.2.4
- React Router 7.13.1
- TypeScript 5.9.3
- Vite 7.3.1
- Electron 28.0.0
- TailwindCSS 4.2.1
- Recharts 3.7.0
- Radix UI components (@radix-ui/*)
- MUI Material 7.3.8
- Lucide icons 0.576.0
- Motion 12.34.5
- Supabase 2.98.0

## Deployment

### Web Deployment

1. Build: `pnpm build`
2. Output: `dist/` directory
3. Deploy to static hosting (Vercel, Netlify, S3, etc.)

### Electron Deployment

1. Build: `pnpm build:mac` / `build:win` / `build:linux`
2. Output: `dist-electron/` directory
3. Releases: `releases/` directory
4. Auto-updater: Configured to check GitHub releases

### Docker Deployment

1. Build: `docker build -t yyc3-cloudpivot .`
2. Run: `docker run -p 3118:8080 yyc3-cloudpivot`
3. Production: Multi-stage build (Node builder → Nginx runner)

## Development Workflow

1. **Setup**: `pnpm install`
2. **Dev Server**: `pnpm dev` (web) or `pnpm electron:dev` (desktop)
3. **Write Code**: Follow conventions in this guide
4. **Type Check**: `pnpm type-check`
5. **Lint**: `pnpm lint:fix`
6. **Test**: `pnpm test` (local), `pnpm test:ci` (CI)
7. **Build**: `pnpm build`
8. **Review**: Check for console errors, type errors, lint warnings

## Documentation

- **API Reference**: `src/app/docs/API-REFERENCE.ts`
- **Component Reference**: `src/app/docs/COMPONENT-REFERENCE.ts`
- **Testing Guide**: `src/app/docs/TESTING-GUIDE.ts`
- **README**: Project root (Chinese/English)
- **Design System**: `src/app/components/design-system/`

## Quick Reference

### Import Patterns

```typescript
// Types
import type { NodeData, AppUser, WebSocketDataState } from "../types";

// Hooks
import { useI18n, useWebSocketData } from "../hooks/useI18n";

// Components
import Dashboard from "../components/Dashboard";
import { Button } from "../components/ui/button";

// Utils
import { supabase } from "../lib/supabaseClient";
import { cn } from "../components/ui/utils";
```

### Common Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useI18n()` | Internationalization | `{ locale, setLocale, t, locales }` |
| `useWebSocketData()` | Real-time data | Full WebSocket state object |
| `useMobileView()` | Responsive detection | `{ breakpoint, isMobile, isTablet, isDesktop }` |
| `usePatrol()` | Patrol system | Patrol state and actions |
| `useOperationCenter()` | Operation center | Operation state and actions |

### Component Examples

```typescript
// GlassCard - standard wrapper
import GlassCard from "../components/GlassCard";
<GlassCard className="p-4">
  <h2>{t("title")}</h2>
</GlassCard>

// Button with variants
import { Button } from "../components/ui/button";
<Button variant="default" size="sm" onClick={handleClick}>
  {t("common.confirm")}
</Button>
```

---

Last updated: March 4, 2026
Generated from codebase analysis
