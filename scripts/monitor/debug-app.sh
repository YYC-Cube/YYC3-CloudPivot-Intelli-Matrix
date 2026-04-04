#!/bin/bash

set -e

APP_NAME="YYC³ CloudPivot"
REPORT_FILE="debug-report-$(date +%Y%m%d-%H%M%S).md"

echo "# 应用调试报告" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**调试时间:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "## 1. 文件结构检查" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ -d "dist" ]; then
    echo "✅ dist 目录存在" >> "$REPORT_FILE"
    echo "| 文件 | 状态 |" >> "$REPORT_FILE"
    echo "|------|------|" >> "$REPORT_FILE"
    
    if [ -f "dist/index.html" ]; then
        echo "| dist/index.html | ✅ |" >> "$REPORT_FILE"
    else
        echo "| dist/index.html | ❌ |" >> "$REPORT_FILE"
    fi
    
    if [ -d "dist/assets" ]; then
        echo "| dist/assets/ | ✅ |" >> "$REPORT_FILE"
    else
        echo "| dist/assets/ | ❌ |" >> "$REPORT_FILE"
    fi
else
    echo "❌ dist 目录不存在" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

echo "## 2. dist/index.html 内容检查" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ -f "dist/index.html" ]; then
    echo "```html" >> "$REPORT_FILE"
    head -20 "dist/index.html" >> "$REPORT_FILE"
    echo "```" >> "$REPORT_FILE"
else
    echo "❌ dist/index.html 不存在" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

echo "## 3. main.js 路径配置检查" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ -f "electron/main.js" ]; then
    echo "✅ electron/main.js 存在" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "加载路径配置:" >> "$REPORT_FILE"
    echo '```javascript' >> "$REPORT_FILE"
    grep -A 1 "loadFile" "electron/main.js" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
else
    echo "❌ electron/main.js 不存在" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

echo "## 4. 应用包内容检查" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

APP_PATH="dist-electron/mac-arm64/${APP_NAME}.app"
if [ -d "$APP_PATH" ]; then
    echo "✅ 应用包存在" >> "$REPORT_FILE"
    
    ASAR_PATH="$APP_PATH/Contents/Resources/app.asar"
    if [ -f "$ASAR_PATH" ]; then
        echo "✅ app.asar 存在" >> "$REPORT_FILE"
        
        echo "检查 app.asar 内容..." >> "$REPORT_FILE"
        npx asar list "$ASAR_PATH" | grep -E "(dist/index\.html|dist-electron/main\.js)" | head -10 >> "$REPORT_FILE"
    else
        echo "❌ app.asar 不存在" >> "$REPORT_FILE"
    fi
else
    echo "❌ 应用包不存在" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

echo "## 5. 建议的修复方案" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### 方案 1: 检查前端构建" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "确保前端代码正确构建：" >> "$REPORT_FILE"
echo '```bash' >> "$REPORT_FILE"
echo "pnpm run build" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### 方案 2: 检查主进程路径" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "确保 main.js 中的路径配置正确：" >> "$REPORT_FILE"
echo '```javascript' >> "$REPORT_FILE"
echo "mainWindow.loadFile(path.join(__dirname, './dist/index.html'));" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### 方案 3: 开启开发者工具" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "在 electron/main.js 中开启开发者工具：" >> "$REPORT_FILE"
echo '```javascript' >> "$REPORT_FILE"
echo "mainWindow.webContents.openDevTools();" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### 方案 4: 检查网络请求" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "确保应用可以正确加载资源：" >> "$REPORT_FILE"
echo '```javascript' >> "$REPORT_FILE"
echo "mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {" >> "$REPORT_FILE"
echo "  console.error('Failed to load:', errorCode, errorDescription);" >> "$REPORT_FILE"
echo "});" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "## 6. 快速诊断命令" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo '```bash' >> "$REPORT_FILE"
echo "# 检查 dist/index.html" >> "$REPORT_FILE"
echo "cat dist/index.html | head -20" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "# 检查 app.asar 内容" >> "$REPORT_FILE"
echo "npx asar list dist-electron/mac-arm64/YYC³ CloudPivot.app/Contents/Resources/app.asar | grep index.html" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "# 提取并检查 app.asar" >> "$REPORT_FILE"
echo "npx asar extract dist-electron/mac-arm64/YYC³ CloudPivot.app/Contents/Resources/app.asar /tmp/debug-extract" >> "$REPORT_FILE"
echo "ls -la /tmp/debug-extract/dist/" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "<div align=\"center\">" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "> 「***YanYuCloudCube***」" >> "$REPORT_FILE"
echo "> 「***<admin@0379.email>***」" >> "$REPORT_FILE"
echo "> 「***Words Initiate Quadrants, Language Serves as Core for Future***」" >> "$REPORT_FILE"
echo "> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "</div>" >> "$REPORT_FILE"

echo "✅ 调试报告已生成: $REPORT_FILE"
echo ""
echo "📋 查看报告: cat $REPORT_FILE"
echo ""
echo "🔍 开始诊断..."
