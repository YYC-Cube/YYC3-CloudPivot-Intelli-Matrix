/* 组件域覆盖率矩阵: 从 json-summary 提取 components 三大低覆盖目录并排序 */
const { readFileSync, readdirSync, statSync } = require('fs');
const { join } = require('path');

const summary = JSON.parse(readFileSync('./coverage-comp/coverage-summary.json', 'utf8'));

const TARGET_DIRS = ['ide', 'music', 'voice', 'theme'];
const rows = [];

for (const [file, data] of Object.entries(summary)) {
  if (file === 'total') { continue; }
  const norm = file.replace(/\\/g, '/');
  if (norm.includes('/components/ide/') || norm.includes('/components/music/') || norm.includes('/components/voice/') || norm.includes('/components/theme/')) {
    const lines = data.lines;
    const size = statSync(file).size;
    rows.push({
      file: norm.replace(/^.*\/components\//, 'components/'),
      pct: lines.pct,
      covered: lines.covered,
      total: lines.total,
      missing: lines.total - lines.covered,
      kb: (size / 1024).toFixed(1),
    });
  }
}

rows.sort((a, b) => b.missing - a.missing);
console.log('=== 组件域低覆盖 TOP（按未覆盖行数降序）===');
for (const r of rows.slice(0, 40)) {
  console.log(`${String(r.pct).padStart(6)}%  missing=${String(r.missing).padStart(5)}  total=${String(r.total).padStart(5)}  ${r.kb}KB  ${r.file}`);
}
console.log(`\n=== 目录汇总 ===`);
for (const dir of TARGET_DIRS) {
  const inDir = rows.filter((r) => r.file.startsWith(`components/${dir}/`));
  const t = inDir.reduce((a, r) => a + r.total, 0);
  const c = inDir.reduce((a, r) => a + r.covered, 0);
  console.log(`${dir}: ${inDir.length} 文件, ${t} 行, covered ${c}, ${t ? ((c / t) * 100).toFixed(2) : '0'}%`);
}
