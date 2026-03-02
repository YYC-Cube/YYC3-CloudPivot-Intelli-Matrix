const fs = require('fs');
const path = require('path');

const componentDir = path.join(__dirname, '../src/app/components');

const fixes = {
  'AIAssistant.tsx': {
    removeAllReactImports: true,
  },
  'ComponentShowcase.tsx': {
    removeVariables: ['Icon'],
  },
  'DesignSystemPage.tsx': {
    removeImports: ['React'],
  },
  'DesignTokens.tsx': {
    removeImports: ['React', 'GlassCard'],
  },
  'ErrorBoundary.tsx': {
    removeImports: ['React'],
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
  'OperationCenter.tsx': {
    removeImports: ['React'],
  },
  'OperationChain.tsx': {
    removeImports: ['React'],
  },
  'FollowUpDrawer.tsx': {
    removeImports: ['RotateCcw', 'Cpu', 'Activity'],
  },
};

Object.keys(fixes).forEach(fileName => {
  const filePath = path.join(componentDir, fileName);
  if (!fs.existsSync(filePath)) return;

  const fix = fixes[fileName];
  if (!fix) return;

  let content = fs.readFileSync(filePath, 'utf-8');

  if (fix.removeAllReactImports) {
    const reactImportMatch = content.match(/import React, { [^}]+ } from "react";\s*\n/);
    if (reactImportMatch) {
      content = content.replace(reactImportMatch[0], '');
    }
  }

  if (fix.removeImports && fix.removeImports.length > 0) {
    fix.removeImports.forEach(imp => {
      const lucideImportMatch = content.match(/import \{([^}]+)\} from "lucide-react"/);
      if (lucideImportMatch) {
        const imports = lucideImportMatch[1].split(',').map(s => s.trim());
        if (imports.includes(imp)) {
          const filteredImports = imports.filter(i => i !== imp);
          if (filteredImports.length > 0) {
            content = content.replace(
              lucideImportMatch[0],
              `import { ${filteredImports.join(', ')} } from "lucide-react"`
            );
          } else {
            content = content.replace(lucideImportMatch[0], '');
          }
        }
      }

      const otherImportMatch = content.match(new RegExp(`import \\{ [^}]*\\b${imp}\\b[^}]*\\} from [^;]+;`));
      if (otherImportMatch) {
        const imports = otherImportMatch[1].split(',').map(s => s.trim());
        const filteredImports = imports.filter(i => i !== imp);
        if (filteredImports.length > 0) {
          content = content.replace(
            otherImportMatch[0],
            otherImportMatch[0].replace(imports.join(', '), filteredImports.join(', '))
          );
        } else {
          content = content.replace(otherImportMatch[0], '');
        }
      }

      const standaloneImportMatch = content.match(new RegExp(`import \\b${imp}\\b from [^;]+;`));
      if (standaloneImportMatch) {
        content = content.replace(standaloneImportMatch[0], '');
      }
    });
  }

  if (fix.removeVariables && fix.removeVariables.length > 0) {
    fix.removeVariables.forEach(variable => {
      content = content.replace(new RegExp(`const ${variable}\\s*=`, 'g'), '');
    });
  }

  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${fileName}`);
});

console.log('Done fixing phase 2 errors');
