const fs = require('fs');
const path = require('path');

const componentDir = path.join(__dirname, '../src/app/components');

const fixes = {
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
    removeVariables: ['index'],
  },
  'NetworkConfig.tsx': {
    removeImports: ['React'],
  },
  'OfflineIndicator.tsx': {
    removeImports: ['React'],
  },
  'OperationAudit.tsx': {
    removeImports: ['React', 'Server', 'Filter', 'Calendar', 'ChevronDown', 'MoreHorizontal'],
  },
  'OperationCenter.tsx': {
    removeImports: ['React'],
  },
  'OperationChain.tsx': {
    removeImports: ['React'],
    fixProperty: { old: 'ringColor', new: 'ringOffsetColor' },
  },
  'OperationLogStream.tsx': {
    removeImports: ['Filter'],
  },
};

Object.keys(fixes).forEach(fileName => {
  const filePath = path.join(componentDir, fileName);
  if (!fs.existsSync(filePath)) return;

  const fix = fixes[fileName];
  if (!fix) return;

  let content = fs.readFileSync(filePath, 'utf-8');

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

      const reactImportMatch = content.match(/import React from "react";\s*\n/);
      if (reactImportMatch && fix.removeImports.includes('React')) {
        content = content.replace(reactImportMatch[0], '');
      }

      const otherImportMatches = content.matchAll(/import \{[^}]+\} from [^;]+;\s*\n/g);
      otherImportMatches.forEach(match => {
        if (fix.removeImports.some(imp => match.includes(` ${imp},`) || match.includes(` ${imp} `) || match.includes(`,${imp}`))) {
          const imports = match.match(/\{([^}]+)\}/)[1].split(',').map(s => s.trim());
          const filteredImports = imports.filter(i => !fix.removeImports.includes(i));
          if (filteredImports.length > 0) {
            content = content.replace(match, match.replace(imports.join(', '), filteredImports.join(', ')));
          } else {
            content = content.replace(match, '');
          }
        }
      });
    });
  }

  if (fix.removeVariables && fix.removeVariables.length > 0) {
    fix.removeVariables.forEach(variable => {
      content = content.replace(new RegExp(`const ${variable}\\s*=`, 'g'), '');
    });
  }

  if (fix.fixProperty) {
    content = content.replace(new RegExp(fix.fixProperty.old, 'g'), fix.fixProperty.new);
  }

  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${fileName}`);
});

console.log('Done fixing all unused imports');
