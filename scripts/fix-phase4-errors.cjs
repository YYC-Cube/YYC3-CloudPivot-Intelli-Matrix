const fs = require('fs');
const path = require('path');

const fixes = {
  'src/app/components/AIAssistant.tsx': {
    removeImports: ['Zap', 'Server', 'Database', 'Shield', 'RotateCcw', 'Play', 'Copy', 'Check', 'Cpu', 'HardDrive', 'Activity', 'Network', 'Layers', 'Key', 'Sliders', 'MessageSquare', 'BookOpen', 'Command', 'Minimize2', 'Maximize2', 'Trash2'],
  },
  'src/app/components/ErrorBoundary.tsx': {
    removeImports: ['React'],
  },
  'src/app/components/OperationLogStream.tsx': {
    removeParameters: ['isMobile'],
  },
  'src/app/components/QuickActionGrid.tsx': {
    removeParameters: ['isExecuting'],
  },
  'src/app/components/theme/ColorPicker.tsx': {
    removeParameters: ['onClose'],
  },
  'src/app/components/theme/ColorSwatch.tsx': {
    removeImports: ['React'],
  },
  'src/app/components/UserManagement.tsx': {
    removeImports: ['React', 'MoreHorizontal', 'Trash2', 'Unlock', 'Mail', 'Clock', 'ChevronDown'],
  },
  'src/app/components/YYC3Logo.tsx': {
    removeImports: ['React'],
  },
  'src/app/hooks/useAISuggestion.ts': {
    removeTypes: ['AIAnalysisResult', 'AnomalyPatternType'],
  },
  'src/app/hooks/useI18n.ts': {
    removeImports: ['React'],
  },
  'src/app/hooks/useLocalFileSystem.ts': {
    removeTypes: ['ReportType'],
  },
  'src/app/hooks/useNetworkConfig.ts': {
    removeTypes: ['NetworkInterface'],
  },
  'src/app/hooks/usePWAManager.ts': {
    removeVariables: ['setSWStatus', 'setIsOnline'],
  },
  'src/app/hooks/useWebSocketData.ts': {
    removeVariables: ['isWsServerReachable', 'error'],
  },
  'src/app/lib/db-queries.ts': {
    removeVariables: ['supabase'],
  },
  'src/app/lib/error-handler.ts': {
    removeParameters: ['detail'],
  },
  'src/app/lib/supabaseClient.ts': {
    removeVariables: ['columns', 'col', 'opts', 'n', 'table', 'filters'],
  },
};

function removeImports(content, importsToRemove) {
  let modified = content;
  
  importsToRemove.forEach(imp => {
    const importRegex = new RegExp(`import\\s+\\{([^}]*)\\b${imp}\\b([^}]*)\\}\\s+from\\s+['"][^'"]+['"];?\\s*`, 'g');
    modified = modified.replace(importRegex, (match, before, after) => {
      const beforeClean = before.replace(new RegExp(`\\b${imp}\\b\\s*,?\\s*`), '');
      const afterClean = after.replace(new RegExp(`\\b${imp}\\b\\s*,?\\s*`), '');
      
      if (beforeClean.trim() === '' && afterClean.trim() === '') {
        return '';
      }
      
      return `import { ${beforeClean}${afterClean} } from "lucide-react";\n`;
    });
  });
  
  return modified;
}

function removeReactImport(content) {
  return content.replace(/import\s+React,\s*\{[^}]*\}\s+from\s+['"]react['"]/g, 'import { } from "react"')
    .replace(/import\s+React\s+from\s+['"]react['"]/g, '')
    .replace(/import\s+\{\s*\}\s+from\s+['"]react['"]/g, '');
}

function removeUnusedReactExport(content) {
  return content.replace(/\/\/ Re-export for backward compatibility\nexport const React = window\.React;\n/g, '');
}

function removeParameters(content, parametersToRemove) {
  let modified = content;
  
  parametersToRemove.forEach(param => {
    const interfaceRegex = new RegExp(`(export\\s+interface\\s+\\w+\\s*\\{[^}]*)(\\b${param}\\s*:\\s*[^;]+;\\s*)([^}]*)\\}`, 'gs');
    modified = modified.replace(interfaceRegex, (match, before, middle, after) => {
      return `${before}${after}}`;
    });
    
    const functionRegex = new RegExp(`export\\s+function\\s+\\w+\\s*\\(\\s*[^)]*\\b${param}\\s*[:=]?\\s*[^,)]*\\s*,?\\s*[^)]*\\)`, 'gs');
    modified = modified.replace(functionRegex, (match) => {
      return match.replace(new RegExp(`\\b${param}\\s*[:=]?\\s*[^,)]*\\s*,?\\s*`), '');
    });
  });
  
  return modified;
}

function removeTypes(content, typesToRemove) {
  let modified = content;
  
  typesToRemove.forEach(type => {
    const regex = new RegExp(`\\btype\\s+${type}\\s*=\\s*[^;]+;\\s*`, 'g');
    modified = modified.replace(regex, '');
  });
  
  return modified;
}

function removeVariables(content, variablesToRemove) {
  let modified = content;
  
  variablesToRemove.forEach(variable => {
    const regex = new RegExp(`\\bconst\\s+\\{([^}]*\\b${variable}\\b[^}]*)\\}\\s*=`, 'g');
    modified = modified.replace(regex, (match, group) => {
      const newGroup = group.replace(new RegExp(`\\b${variable}\\b\\s*,?\\s*`), '');
      if (newGroup.trim() === '') {
        return `const _ =`;
      }
      return `const { ${newGroup} } =`;
    });
  });
  
  return modified;
}

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  const fix = fixes[filePath];
  if (!fix) {
    console.log(`⚠️  No fix defined for: ${filePath}`);
    return false;
  }
  
  console.log(`🔧 Fixing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  if (fix.removeImports && fix.removeImports.length > 0) {
    const originalContent = content;
    content = removeImports(content, fix.removeImports);
    if (content !== originalContent) modified = true;
  }
  
  if (fix.removeImports && fix.removeImports.includes('React')) {
    const originalContent = content;
    content = removeReactImport(content);
    content = removeUnusedReactExport(content);
    if (content !== originalContent) modified = true;
  }
  
  if (fix.removeParameters && fix.removeParameters.length > 0) {
    const originalContent = content;
    content = removeParameters(content, fix.removeParameters);
    if (content !== originalContent) modified = true;
  }
  
  if (fix.removeTypes && fix.removeTypes.length > 0) {
    const originalContent = content;
    content = removeTypes(content, fix.removeTypes);
    if (content !== originalContent) modified = true;
  }
  
  if (fix.removeVariables && fix.removeVariables.length > 0) {
    const originalContent = content;
    content = removeVariables(content, fix.removeVariables);
    if (content !== originalContent) modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
    return false;
  }
}

Object.keys(fixes).forEach(filePath => {
  fixFile(filePath);
});

console.log('\n🎉 Phase 4 TypeScript error fixing complete!');
