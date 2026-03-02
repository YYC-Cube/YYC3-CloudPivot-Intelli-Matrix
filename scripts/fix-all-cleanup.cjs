const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '../src/app/__tests__');

const files = fs.readdirSync(testDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(testDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  const originalContent = content;

  const hasAfterEachInImport = content.match(/import[^}]*afterEach[^}]*from "vitest"/) || content.match(/import[^}]*afterEach[^}]*from 'vitest'/);

  if (hasAfterEachInImport && content.includes('afterEach(')) {
    content = content.replace(/import { afterEach } from "vitest";\n/g, '');
    content = content.replace(/import { afterEach } from 'vitest';\n/g, '');

    const vitestImportMatch = content.match(/import \{([^}]+)\} from "vitest"/);
    if (vitestImportMatch) {
      const imports = vitestImportMatch[1].split(',').map(s => s.trim()).filter(s => s !== '');
      if (imports.length === 1 && imports[0] === 'vi') {
        content = content.replace(/import \{ vi \} from "vitest"/, 'import vi from "vitest"');
      } else if (imports.length > 1) {
        const filteredImports = imports.filter(s => s !== 'afterEach');
        if (filteredImports.length > 0) {
          content = content.replace(
            /import \{[^}]+\} from "vitest"/,
            `import { ${filteredImports.join(', ')} } from "vitest"`
          );
        }
      }
    }

    const vitestImportMatch2 = content.match(/import \{([^}]+)\} from 'vitest'/);
    if (vitestImportMatch2) {
      const imports = vitestImportMatch2[1].split(',').map(s => s.trim()).filter(s => s !== '');
      if (imports.length === 1 && imports[0] === 'vi') {
        content = content.replace(/import \{ vi \} from 'vitest'/, "import vi from 'vitest'");
      } else if (imports.length > 1) {
        const filteredImports = imports.filter(s => s !== 'afterEach');
        if (filteredImports.length > 0) {
          content = content.replace(
            /import \{[^}]+\} from 'vitest'/,
            `import { ${filteredImports.join(', ')} } from 'vitest'`
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

console.log('Done fixing all cleanup imports');
