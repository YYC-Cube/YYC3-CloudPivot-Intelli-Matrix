#!/bin/bash

# 修复 LoopStageCard.test.tsx 中的重复 afterEach 问题

filepath="src/app/__tests__/LoopStageCard.test.tsx"

if [ -f "$filepath" ]; then
  echo "Fixing LoopStageCard.test.tsx duplicate afterEach..."

  # 删除所有在 describe 块内部的 afterEach(() => { cleanup(); });
  # 只保留最顶层的 afterEach
  perl -i -0pe 's/  (afterEach\(\(\) => \{\s*cleanup\(\);\s*\};)\s*)\n  describe\(([^)]+)\) => \{/describe($1) => {\n    beforeEach(() => {\n      cleanup();\n    });\n\n    afterEach(() => {\n      cleanup();\n    });/g' "$filepath"

  # 简单方案：删除所有内部的 afterEach，只在顶层保留一个
  perl -i -pe 's/\n  describe\([^)]+\) => \{\n  afterEach\(\(\) => \{\s*cleanup\(\);\s*\};\)/\n  describe($1) => {\n/g' "$filepath"

  echo "Done!"
fi
