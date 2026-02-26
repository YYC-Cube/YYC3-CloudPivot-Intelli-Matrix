const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '../src/app/__tests__');

const files = fs.readdirSync(testDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(testDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  const originalContent = content;

  const describePattern = /describe\("[^"]+"\),\s*\(\s*=>\s*\{\s*$/;
  const afterEachPattern = /afterEach\(\s*=>\s*\{\s*$/;

  const lines = content.split('\n');
  let inDescribe = false;
  let hasAfterEach = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (describePattern.test(line.trim())) {
      inDescribe = true;
      hasAfterEach = false;
    }

    if (inDescribe && afterEachPattern.test(line.trim())) {
      hasAfterEach = true;
    }

    if (inDescribe && line.trim().startsWith('})')) {
      inDescribe = false;
      hasAfterEach = false;
    }
  }

  if (!hasAfterEach) {
    content = content.replace(
      /describe\(([^)]+)\),\s*\(\s*=>\s*\{\s*\n\s*([a-z].+?;\s*\n)?\s*it\(/g,
      (match, name, setup) => {
        if (setup) {
          return `describe(${name}, () => {\n  beforeEach(() => {\n    ${setup}\n  });\n\n  it(`;
        }
        return `describe(${name}, () => {\n  it(`;
      }
    );
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  }
});

console.log('Done fixing describe structure');
