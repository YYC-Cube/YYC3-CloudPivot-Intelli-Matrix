const fs = require('fs');
const path = require('path');

const componentDir = path.join(__dirname, '../src/app/components');
const designSystemDir = path.join(componentDir, 'design-system');

const files = [
  path.join(componentDir, 'AIAssistant.tsx'),
  path.join(designSystemDir, 'ComponentShowcase.tsx'),
  path.join(designSystemDir, 'DesignSystemPage.tsx'),
  path.join(designSystemDir, 'DesignTokens.tsx'),
  path.join(designSystemDir, 'StageReview.tsx'),
  path.join(componentDir, 'DevGuidePage.tsx'),
  path.join(componentDir, 'ErrorBoundary.tsx'),
  path.join(componentDir, 'FileBrowser.tsx'),
  path.join(componentDir, 'FollowUpDrawer.tsx'),
];

const fixes = {
  'AIAssistant.tsx': {
    removeAllImports: true,
  },
  'ComponentShowcase.tsx': {
    removeImports: ['Activity', 'Shield', 'Server', 'Database', 'Zap', 'ChevronRight', 'ExternalLink', 'GlassCard'],
  },
  'DesignSystemPage.tsx': {
    removeImports: ['React'],
  },
  'DesignTokens.tsx': {
    removeImports: ['React', 'GlassCard'],
  },
  'StageReview.tsx': {
    removeImports: ['AlertTriangle'],
  },
  'DevGuidePage.tsx': {
    removeImports: ['ArrowRight'],
  },
  'ErrorBoundary.tsx': {
    removeImports: ['React'],
  },
  'FileBrowser.tsx': {
    removeImports: ['RefreshCw'],
  },
  'FollowUpDrawer.tsx': {
    removeImports: ['Tag', 'Send'],
  },
};

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;

  const fileName = path.basename(filePath);
  const fix = fixes[fileName];
  if (!fix) return;

  let content = fs.readFileSync(filePath, 'utf-8');

  if (fix.removeAllImports) {
    content = content.replace(/import React, { [^}]+ } from "react";\s*\n/g, '');
    content = content.replace(/import React from "react";\s*\n/g, '');
  }

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
      }
    }
  }

  if (fix.removeVariables && fix.removeVariables.length > 0) {
    const lineMatch = content.match(/const isMobile =.*\n/);
    if (lineMatch) {
      let newContent = content.replace(lineMatch[0], lineMatch[0].replace(/, isTablet.*\n/, ';\n'));
      if (newContent !== content) {
        content = newContent;
      }
    }
  }

  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${fileName}`);
});

console.log('Done fixing unused imports');
