const path = require("path");
const s = require(path.join(__dirname, "..", "coverage", "coverage-summary.json"));
const rows = [];
for (const [file, d] of Object.entries(s)) {
  if (file === "total") continue;
  const f = d.functions;
  if (f.total > 0) {
    const missed = f.total - f.covered;
    rows.push({
      file: file.replace(/.*src\/app\//, ""),
      missed,
      pct: f.pct,
      stmtMissed: d.statements.total - d.statements.covered,
    });
  }
}
rows.sort((a, b) => b.missed - a.missed);
console.log("== Functions 未覆盖 TOP 20 ==");
for (const r of rows.slice(0, 20)) {
  console.log(
    `${String(r.missed).padStart(4)} funcs | stmt缺${String(r.stmtMissed).padStart(5)} | ${r.pct.toFixed(1).padStart(5)}% | ${r.file}`
  );
}
const totalMissed = rows.reduce((a, r) => a + r.missed, 0);
console.log("总函数缺口:", totalMissed);
