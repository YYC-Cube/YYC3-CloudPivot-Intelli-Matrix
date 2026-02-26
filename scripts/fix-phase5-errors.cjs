const fs = require('fs');
const path = require('path');

const filesToFix = {
  'src/app/hooks/useAISuggestion.ts': {
    unusedTypes: ['AIAnalysisResult', 'AnomalyPatternType'],
  },
  'src/app/hooks/useLocalFileSystem.ts': {
    unusedTypes: ['ReportType'],
  },
  'src/app/hooks/useNetworkConfig.ts': {
    unusedTypes: ['NetworkInterface'],
  },
  'src/app/hooks/usePWAManager.ts': {
    unusedVars: ['setSWStatus', 'setIsOnline'],
  },
  'src/app/hooks/useWebSocketData.ts': {
    unusedVars: ['isWsServerReachable', 'error'],
  },
  'src/app/lib/db-queries.ts': {
    unusedVars: ['supabase'],
  },
  'src/app/lib/supabaseClient.ts': {
    unusedVars: ['columns', 'col', 'opts', 'n', 'table', 'filters'],
  },
};

function removeUnusedTypesFromImport(content, typesToRemove) {
  let modified = content;
  
  const importRegex = /import\s+type\s+\{([^}]+)\}\s+from\s+['"][^'"]+['"];?/g;
  modified = modified.replace(importRegex, (match, group) => {
    let types = group.split(',').map(t => t.trim());
    const remainingTypes = types.filter(t => !typesToRemove.includes(t));
    
    if (remainingTypes.length === 0) {
      return '';
    }
    
    return `import type {\n    ${remainingTypes.join(',\n    ')}\n  } from "../types";\n`;
  });
  
  return modified;
}

function removeUnusedDestructuredVars(content, varsToRemove) {
  let modified = content;
  
  const destructuringRegex = /const\s+\{([^}]+)\}\s*=\s*useState/g;
  modified = modified.replace(destructuringRegex, (match, group) => {
    let vars = group.split(',').map(v => v.trim());
    const remainingVars = vars.filter(v => !varsToRemove.includes(v.split(':')[0]));
    
    if (remainingVars.length === 0) {
      return `const _ = useState`;
    }
    
    return `const { ${remainingVars.join(', ')} } = useState`;
  });
  
  const destructuringRegex2 = /const\s+\{([^}]+)\}\s*=\s*[^=]+/g;
  modified = modified.replace(destructuringRegex2, (match, group) => {
    let vars = group.split(',').map(v => v.trim());
    const remainingVars = vars.filter(v => !varsToRemove.includes(v.split(':')[0]));
    
    if (remainingVars.length === 0) {
      return `const _ = match.replace(/const\s+\{[^}]+\}\s*=\s*/, '')`;
    }
    
    return match;
  });
  
  return modified;
}

function fixFile(filePath, fixConfig) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  console.log(`🔧 Fixing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  if (fixConfig.unusedTypes && fixConfig.unusedTypes.length > 0) {
    const originalContent = content;
    content = removeUnusedTypesFromImport(content, fixConfig.unusedTypes);
    if (content !== originalContent) modified = true;
  }
  
  if (fixConfig.unusedVars && fixConfig.unusedVars.length > 0) {
    const originalContent = content;
    content = removeUnusedDestructuredVars(content, fixConfig.unusedVars);
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

Object.entries(filesToFix).forEach(([filePath, fixConfig]) => {
  fixFile(filePath, fixConfig);
});

console.log('\n🎉 Phase 5 TypeScript error fixing complete!');
