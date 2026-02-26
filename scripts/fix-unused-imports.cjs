const fs = require('fs');
const path = require('path');

const componentDir = path.join(__dirname, '../src/app/components');
const testDir = path.join(__dirname, '../src/app/__tests__');

const filesToFix = [
  path.join(componentDir, 'ActionRecommender.tsx'),
  path.join(componentDir, 'AIAssistant.tsx'),
  path.join(componentDir, 'AISuggestionPanel.tsx'),
  path.join(componentDir, 'AlertBanner.tsx'),
  path.join(componentDir, 'BottomNav.tsx'),
  path.join(componentDir, 'ConnectionStatus.tsx'),
  path.join(componentDir, 'Dashboard.tsx'),
  path.join(componentDir, 'DataFlowDiagram.tsx'),
  path.join(componentDir, 'DataMonitoring.tsx'),
  path.join(componentDir, 'design-system/ComponentShowcase.tsx'),
  path.join(testDir, 'AddModelModal.test.tsx'),
  path.join(testDir, 'ComponentShowcase.test.tsx'),
];

const fixes = {
  'ActionRecommender.tsx': {
    removeImports: ['React', 'XCircle'],
  },
  'AIAssistant.tsx': {
    removeLines: true,
  },
  'AISuggestionPanel.tsx': {
    removeImports: ['React'],
    properties: {
      pendingRecs: 'totalRecommendations',
      appliedRecs: 'appliedCount',
    },
  },
  'AlertBanner.tsx': {
    removeImports: ['React', 'Bell', 'Shield'],
  },
  'BottomNav.tsx': {
    removeImports: ['BarChart3', 'RefreshCcw', 'ChevronRight'],
  },
  'ConnectionStatus.tsx': {
    removeImports: ['React'],
  },
  'Dashboard.tsx': {
    removeImports: ['React'],
    removeVariables: ['isDesktop'],
  },
  'DataFlowDiagram.tsx': {
    removeImports: ['ArrowLeftRight', 'GlassCard'],
  },
  'DataMonitoring.tsx': {
    removeImports: ['React'],
  },
  'ComponentShowcase.tsx': {
    removeImports: ['Bell'],
  },
};

filesToFix.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;

  const fileName = path.basename(filePath);
  const fix = fixes[fileName];
  if (!fix) return;

  let content = fs.readFileSync(filePath, 'utf-8');

  if (fix.removeLines) {
    content = content.replace(/import React from "react";\s*\n/g, '');
  }

  if (fix.removeImports && fix.removeImports.length > 0) {
    fix.removeImports.forEach(imp => {
      content = content.replace(new RegExp(`,\\s*${imp}`, 'g'), '');
      content = content.replace(new RegExp(`${imp},\\s*`, 'g'), '');
    });
  }

  if (fix.properties) {
    Object.keys(fix.properties).forEach(oldProp => {
      const newProp = fix.properties[oldProp];
      content = content.replace(new RegExp(`\\b${oldProp}\\b`, 'g'), newProp);
    });
  }

  if (fix.removeVariables && fix.removeVariables.length > 0) {
    fix.removeVariables.forEach(variable => {
      content = content.replace(new RegExp(`\\b${variable}\\s*,?\\s*`, 'g'), '');
    });
  }

  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${fileName}`);
});

console.log('Done fixing unused imports');
