#!/usr/bin/env node

/**
 * 批量修复 GlassCard mock
 * 将：vi.mock("../components/GlassCard", () => ({ GlassCard: ... }))
 * 改为：vi.mock("../components/GlassCard", () => ({ default: ... }))
 */

const fs = require('fs');
const path = require('path');

const testDir = __dirname;
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.test.tsx'));

let fixedCount = 0;

files.forEach(file => {
  const filePath = path.join(testDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 查找并替换 GlassCard mock
  const oldPattern = /vi\.mock\(["']\.\.\/components\/GlassCard["'], \(\) => \({\s*GlassCard: \(/g);
  const newPattern = 'vi.mock("../components/GlassCard", () => ({\n  default: ({ children, className }: any) => <div className={className}>{children}</div>,\n}))';
  
  if (oldPattern.test(content)) {
    // 先读取完整的 mock 块
    const fullMockPattern = /vi\.mock\(["']\.\.\/components\/GlassCard["'], \(\) => \({\s*GlassCard: \({[^}]*}\)[^}]*}\)\);/gs;
    content = content.replace(fullMockPattern, newPattern + ');');
    fs.writeFileSync(filePath, content);
    fixedCount++;
    console.log(`✅ Fixed: ${file}`);
  }
});

console.log(`\n✅ Fixed ${fixedCount}/${files.length} files`);
