const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '../src/app/__tests__');

const files = fs.readdirSync(testDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(testDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  const originalContent = content;

  if (content.includes("import { afterEach } from \"vitest\";")) {
    if (content.includes('afterEach(')) {
      content = content.replace(/import { afterEach } from "vitest";\n/g, '');
    }
  }

  if (content.includes("import { afterEach } from 'vitest';")) {
    if (content.includes('afterEach(')) {
      content = content.replace(/import { afterEach } from 'vitest';\n/g, '');
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  }
});

console.log('Done fixing duplicate afterEach imports');
