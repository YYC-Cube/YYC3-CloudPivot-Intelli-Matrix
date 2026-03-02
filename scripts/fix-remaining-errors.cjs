const fs = require('fs');
const path = require('path');

const componentDir = path.join(__dirname, '../src/app/components');

const filesToFix = [
  'design-system/ComponentShowcase.tsx',
  'design-system/DesignSystemPage.tsx',
  'design-system/DesignTokens.tsx',
  'DevGuidePage.tsx',
  'ErrorBoundary.tsx',
  'FollowUpDrawer.tsx',
  'IDEPanel.tsx',
  'LanguageSwitcher.tsx',
  'LocalFileManager.tsx',
  'LogViewer.tsx',
  'LoopStageCard.tsx',
  'ModelProviderPanel.tsx',
  'NetworkConfig.tsx',
  'NodeDetailModal.tsx',
  'OfflineIndicator.tsx',
  'OperationAudit.tsx',
];

const fixes = {
  'ComponentShowcase.tsx': {
    removeImports: ['GlassCard'],
    removeVariables: ['Icon'],
  },
  'DesignSystemPage.tsx': {
    removeImports: ['React'],
  },
  'DesignTokens.tsx': {
    removeImports: ['React', 'GlassCard'],
  },
  'DevGuidePage.tsx': {
    removeVariables: ['isMobile'],
  },
  'ErrorBoundary.tsx': {
    removeImports: ['React'],
  },
  'FollowUpDrawer.tsx': {
    removeImports: ['RotateCcw', 'Cpu', 'Activity'],
  },
  'IDEPanel.tsx': {
    removeImports: ['WebSocketContext'],
  },
  'LanguageSwitcher.tsx': {
    removeImports: ['React', 'Locale', 't'],
  },
  'LocalFileManager.tsx': {
    removeImports: ['React'],
  },
  'LogViewer.tsx': {
    removeVariables: ['LevelIcon'],
  },
  'LoopStageCard.tsx': {
    removeImports: ['AlertCircle'],
    removeVariables: ['index'],
  },
  'ModelProviderPanel.tsx': {
    removeImports: ['React', 'Key', 'MODEL_PROVIDERS'],
  },
  'NetworkConfig.tsx': {
    removeImports: ['React'],
  },
  'NodeDetailModal.tsx': {
    removeImports: ['React'],
  },
  'OfflineIndicator.tsx': {
    removeImports: ['React'],
  },
  'OperationAudit.tsx': {
    removeImports: ['React', 'Filter', 'Calendar', 'ChevronDown', 'MoreHorizontal'],
  },
};

filesToFix.forEach(fileName => {
  const filePath = path.join(componentDir, fileName);
  if (!fs.existsSync(filePath)) return;

  const fix = fixes[fileName];
  if (!fix) return;

  let content = fs.readFileSync(filePath, 'utf-8');

  if (fix.removeImports && fix.removeImports.length > 0) {
    const importMatch = content.match(/import \{([^}]+)\} from "lucide-react"/);
    if (importMatch) {
      const imports = importMatch[1].split(',').map(s => s.trim());
      const filteredImports = imports.filter(imp => !fix.removeImports.includes(imp));
      if (filteredImports.length > 0) {
        content = content.replace(
          importMatch[0],
          `import { ${filteredImports.join(', ')} } from "lucide-react"`
        );
      } else {
        content = content.replace(/import \{[^}]+\} from "lucide-react";\s*\n/g, '');
      }
    }

    const reactImportMatch = content.match(/import React from "react";\s*\n/);
    if (reactImportMatch) {
      content = content.replace(reactImportMatch[0], '');
    }

    const webSocketImportMatch = content.match(/import \{ WebSocketContext \} from [^;]+;\s*\n/);
    if (webSocketImportMatch && fix.removeImports.includes('WebSocketContext')) {
      content = content.replace(webSocketImportMatch[0], '');
    }

    const modelProvidersImportMatch = content.match(/import \{ MODEL_PROVIDERS \} from [^;]+;\s*\n/);
    if (modelProvidersImportMatch && fix.removeImports.includes('MODEL_PROVIDERS')) {
      content = content.replace(modelProvidersImportMatch[0], '');
    }
  }

  if (fix.removeVariables && fix.removeVariables.length > 0) {
    fix.removeVariables.forEach(variable => {
      content = content.replace(new RegExp(`const ${variable}\\s*=`, 'g'), '');
    });
  }

  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${fileName}`);
});

console.log('Done fixing remaining errors');
