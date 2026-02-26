const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '../src/app/__tests__');

const files = fs.readdirSync(testDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(testDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  const originalContent = content;

  const hasAfterEachCall = content.includes('afterEach(');
  const hasCleanupInTLR = content.includes('cleanup') && content.includes('from "@testing-library/react"');
  const hasCleanupInTLR2 = content.includes('cleanup') && content.includes("from '@testing-library/react'");

  if (hasAfterEachCall && !hasCleanupInTLR && !hasCleanupInTLR2) {
    if (content.includes('from "@testing-library/react"')) {
      const importMatch = content.match(/import \{([^}]+)\} from "@testing-library\/react"/);
      if (importMatch) {
        const imports = importMatch[1].split(',').map(s => s.trim());
        if (!imports.includes('cleanup')) {
          const newImports = [...imports, 'cleanup'].join(', ');
          content = content.replace(
            /import \{[^}]+\} from "@testing-library\/react"/,
            `import { ${newImports} } from "@testing-library/react"`
          );
        }
      }
    } else if (content.includes("from '@testing-library/react'")) {
      const importMatch = content.match(/import \{([^}]+)\} from '@testing-library\/react'/);
      if (importMatch) {
        const imports = importMatch[1].split(',').map(s => s.trim());
        if (!imports.includes('cleanup')) {
          const newImports = [...imports, 'cleanup'].join(', ');
          content = content.replace(
            /import \{[^}]+\} from '@testing-library\/react'/,
            `import { ${newImports} } from '@testing-library/react'`
          );
        }
      }
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  }
});

console.log('Done fixing all test imports');
