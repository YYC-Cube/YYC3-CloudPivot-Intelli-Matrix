const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '../src/app/__tests__');

const files = fs.readdirSync(testDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(testDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  const originalContent = content;

  if (content.includes("import { afterEach } from \"vitest\";")) {
    content = content.replace(/import { afterEach } from "vitest";\n/g, '');
  }

  if (content.includes("import { afterEach } from 'vitest';")) {
    content = content.replace(/import { afterEach } from 'vitest';\n/g, '');
  }

  if (content.includes('from "@testing-library/react";')) {
    if (!content.includes('cleanup')) {
      content = content.replace(
        /from "@testing-library\/react";/,
        'from "@testing-library/react";'
      );
    }
  }

  if (content.includes('from \'@testing-library/react\';')) {
    if (!content.includes('cleanup')) {
      content = content.replace(
        /from '@testing-library\/react';/,
        'from \'@testing-library/react\';'
      );
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  }
});

console.log('Done fixing cleanup imports');
