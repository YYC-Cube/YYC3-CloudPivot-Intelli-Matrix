const fs = require('fs');
const path = require('path');

const fixes = {
  'src/app/components/ErrorBoundary.tsx': {
    removeImports: ['React'],
  },
  'src/app/components/OperationLogStream.tsx': {
    removeVariables: ['isMobile'],
  },
  'src/app/components/PatrolReport.tsx': {
    addImports: ['useState'],
  },
  'src/app/components/QuickActionGrid.tsx': {
    removeVariables: ['isExecuting'],
  },
  'src/app/components/SystemSettings.tsx': {
    removeImports: ['FileJson', 'Copy', 'HardDrive'],
    addImports: ['useState'],
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
  'src/app/hooks/useOperationCenter.ts': {
    removeImports: ['useRef', 'useEffect'],
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
    const importRegex = new RegExp(`import\\s+\\{[^}]*\\b${imp}\\b[^}]*\\}\\s+from\\s+['"][^'"]+['"];?\\s*`, 'g');
    modified = modified.replace(importRegex, (match) => {
      const newMatch = match.replace(new RegExp(`\\b${imp}\\b\\s*,?\\s*`), '');
      const cleaned = newMatch.replace(/import\s+\{\s*\}\s+from\s+/, 'import from ');
      return cleaned;
    });
  });
  
  return modified;
}

function removeVariables(content, variablesToRemove) {
  let modified = content;
  
  variablesToRemove.forEach(variable => {
    const regex = new RegExp(`\\bconst\\s+\\{[^}]*\\b${variable}\\b[^}]*\\}\\s*=`, 'g');
    modified = modified.replace(regex, (match) => {
      return match.replace(new RegExp(`\\b${variable}\\b\\s*,?\\s*`), '');
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

function removeParameters(content, parametersToRemove) {
  let modified = content;
  
  parametersToRemove.forEach(param => {
    const functionRegex = new RegExp(`\\(\\s*${param}\\s*[:,]?\\s*[^)]*\\)\\s*=>`, 'g');
    modified = modified.replace(functionRegex, '() =>');
  });
  
  return modified;
}

function addImports(content, importsToAdd) {
  let modified = content;
  
  const reactImportRegex = /import\s+React(?:,\s*\{[^}]*\})?\s+from\s+['"]react['"]/;
  
  if (reactImportRegex.test(content)) {
    modified = modified.replace(reactImportRegex, (match) => {
      const existingBraces = match.match(/\{[^}]*\}/);
      if (existingBraces) {
        const existingImports = existingBraces[0].slice(1, -1);
        const newImports = [...new Set([...existingImports.split(',').map(s => s.trim()), ...importsToAdd])].join(', ');
        return `import React, { ${newImports} } from 'react'`;
      } else {
        return `import React, { ${importsToAdd.join(', ')} } from 'react'`;
      }
    });
  } else {
    const insertAfterImports = /(?:^|\n)(import\s+[^;]+;\s*)/;
    if (insertAfterImports.test(content)) {
      const lastImport = content.match(/(import\s+[^;]+;\s*)/g).pop();
      modified = modified.replace(lastImport, lastImport + `\nimport { ${importsToAdd.join(', ')} } from 'react';\n`);
    } else {
      modified = `import { ${importsToAdd.join(', ')} } from 'react';\n` + modified;
    }
  }
  
  return modified;
}

function fixImplicitAny(content) {
  let modified = content;
  
  const setStateRegex = /(set[A-Z]\w+)\s*\(\s*(prev)\s*=>\s*([^}]+)\)/g;
  modified = modified.replace(setStateRegex, (match, setStateName, prevName, callback) => {
    return `${setStateName}((prev: any) => ${callback})`;
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
    content = removeImports(content, fix.removeImports);
    modified = true;
  }
  
  if (fix.removeVariables && fix.removeVariables.length > 0) {
    content = removeVariables(content, fix.removeVariables);
    modified = true;
  }
  
  if (fix.removeTypes && fix.removeTypes.length > 0) {
    content = removeTypes(content, fix.removeTypes);
    modified = true;
  }
  
  if (fix.removeParameters && fix.removeParameters.length > 0) {
    content = removeParameters(content, fix.removeParameters);
    modified = true;
  }
  
  if (fix.addImports && fix.addImports.length > 0) {
    content = addImports(content, fix.addImports);
    modified = true;
  }
  
  if (filePath.includes('PatrolReport.tsx') || filePath.includes('SystemSettings.tsx')) {
    content = fixImplicitAny(content);
    modified = true;
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

console.log('\n🎉 Phase 3 TypeScript error fixing complete!');
