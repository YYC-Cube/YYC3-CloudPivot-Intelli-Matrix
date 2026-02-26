const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '../src/app/__tests__');

const files = fs.readdirSync(testDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(testDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  const originalContent = content;

  const hasAfterEachCall = content.includes('afterEach(');
  const hasCleanupImport = content.includes('cleanup') && content.includes('from "@testing-library/react"');
  const hasCleanupImport2 = content.includes('cleanup') && content.includes("from '@testing-library/react'");

  if (hasAfterEachCall && !hasCleanupImport && !hasCleanupImport2) {
    if (content.includes('from "@testing-library/react"')) {
      content = content.replace(
        /from "@testing-library\/react";/,
        'from "@testing-library/react";'
      );
      content = content.replace(
        /import { render, screen[^}]*} from "@testing-library\/react";/,
        (match) => match.replace('render, screen', 'render, screen, cleanup')
      );
      content = content.replace(
        /import { render[^}]*} from "@testing-library\/react";/,
        (match) => match.replace('render', 'render, cleanup')
      );
    } else if (content.includes("from '@testing-library/react'")) {
      content = content.replace(
        /from '@testing-library\/react';/,
        "from '@testing-library/react';"
      );
      content = content.replace(
        /import { render, screen[^}]*} from '@testing-library\/react';/,
        (match) => match.replace('render, screen', 'render, screen, cleanup')
      );
      content = content.replace(
        /import { render[^}]*} from '@testing-library\/react';/,
        (match) => match.replace('render', 'render, cleanup')
      );
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  }
});

console.log('Done fixing afterEach imports');
