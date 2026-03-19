#!/bin/bash

set -e

APP_NAME="YYC³ CloudPivot"
REPORT_FILE="app-diagnosis-$(date +%Y%m%d-%H%M%S).md"

echo "# 应用诊断报告" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**诊断时间:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
echo "**应用版本:** v1.0.0" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "## 1. 应用进程检查" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

APP_PID=$(pgrep -f "$APP_NAME" | head -1)
if [ -n "$APP_PID" ]; then
    echo "✅ 应用正在运行 (PID: $APP_PID)" >> "$REPORT_FILE"
else
    echo "❌ 应用未运行" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

echo "## 2. 应用包检查" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

APP_PATH="dist-electron/mac-arm64/${APP_NAME}.app"
if [ -d "$APP_PATH" ]; then
    echo "✅ 应用包存在" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    ASAR_PATH="$APP_PATH/Contents/Resources/app.asar"
    if [ -f "$ASAR_PATH" ]; then
        echo "✅ app.asar 存在 ($(du -h "$ASAR_PATH" | cut -f1))" >> "$REPORT_FILE"
    else
        echo "❌ app.asar 不存在" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**应用包内容:**" >> "$REPORT_FILE"
    echo '```bash' >> "$REPORT_FILE"
    ls -lh "$APP_PATH/Contents/" | head -10 >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
else
    echo "❌ 应用包不存在" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

echo "## 3. 前端构建检查" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ -f "dist/index.html" ]; then
    echo "✅ dist/index.html 存在" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    echo "**HTML 文件内容:**" >> "$REPORT_FILE"
    echo '```html' >> "$REPORT_FILE"
    head -15 "dist/index.html" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
    echo "**资源文件:**" >> "$REPORT_FILE"
    echo '```bash' >> "$REPORT_FILE"
    ls -lh "dist/assets/" | head -10 >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
else
    echo "❌ dist/index.html 不存在" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

echo "## 4. 主进程配置检查" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ -f "electron/main.js" ]; then
    echo "✅ electron/main.js 存在" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    echo "**HTML 加载路径:**" >> "$REPORT_FILE"
    echo '```javascript' >> "$REPORT_FILE"
    grep -A 1 "loadFile" "electron/main.js" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
    echo "**调试配置:**" >> "$REPORT_FILE"
    echo '```javascript' >> "$REPORT_FILE"
    grep -A 1 "openDevTools" "electron/main.js" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
else
    echo "❌ electron/main.js 不存在" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

echo "## 5. 应用日志检查" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

LOG_PATH="$HOME/Library/Logs/$APP_NAME"
if [ -d "$LOG_PATH" ]; then
    echo "✅ 日志目录存在: $LOG_PATH" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**日志文件:**" >> "$REPORT_FILE"
    echo '```bash' >> "$REPORT_FILE"
    ls -lh "$LOG_PATH/" 2>/dev/null || echo "无日志文件" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
else
    echo "⚠️ 日志目录不存在" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

echo "## 6. 端口检查" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "**检查 Vite 开发服务器端口 (3218):**" >> "$REPORT_FILE"
echo '```bash' >> "$REPORT_FILE"
lsof -i :3218 2>/dev/null || echo "端口 3218 未被占用" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"

echo "## 7. 故障排除建议" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### 如果应用无法启动:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. **检查开发者工具控制台**" >> "$REPORT_FILE"
echo "   - 应用启动后会自动打开开发者工具" >> "$REPORT_FILE"
echo "   - 查看 Console 标签页的错误信息" >> "$REPORT_FILE"
echo "   - 查看 Network 标签页的请求状态" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "2. **检查主进程日志**" >> "$REPORT_FILE"
echo "   - 在终端运行: \`open -a Console\`" >> "$REPORT_FILE"
echo "   - 搜索应用名称查看日志" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "3. **重新构建应用**" >> "$REPORT_FILE"
echo '```bash' >> "$REPORT_FILE"
echo "pnpm run clean" >> "$REPORT_FILE"
echo "pnpm run build:electron" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "4. **检查文件路径**" >> "$REPORT_FILE"
echo "   - 确保 dist/index.html 存在" >> "$REPORT_FILE"
echo "   - 确保 dist/assets/ 目录包含所有资源文件" >> "$REPORT_FILE"
echo "   - 确保 app.asar 包含正确的文件结构" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### 如果应用启动但白屏:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. **检查 HTML 加载**" >> "$REPORT_FILE"
echo "   - 在开发者工具中查看 Network 标签页" >> "$REPORT_FILE"
echo "   - 确认 index.html 加载成功" >> "$REPORT_FILE"
echo "   - 确认所有 JS/CSS 资源加载成功" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "2. **检查 JavaScript 错误**" >> "$REPORT_FILE"
echo "   - 查看 Console 标签页的错误信息" >> "$REPORT_FILE"
echo "   - 检查是否有模块加载错误" >> "$REPORT_FILE"
echo "   - 检查是否有运行时错误" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "3. **检查 React 渲染**" >> "$REPORT_FILE"
echo "   - 确认 React 应用正确挂载到 #root 元素" >> "$REPORT_FILE"
echo "   - 检查是否有组件渲染错误" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### 如果应用崩溃:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. **查看崩溃报告**" >> "$REPORT_FILE"
echo "   - 崩溃报告位于: \`~/Library/Logs/DiagnosticReports/\`" >> "$REPORT_FILE"
echo "   - 查找最近的崩溃报告" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "2. **检查磁盘空间**" >> "$REPORT_FILE"
echo '```bash' >> "$REPORT_FILE"
echo "df -h" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "## 8. 快速诊断命令" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo '```bash' >> "$REPORT_FILE"
echo "# 检查应用是否运行" >> "$REPORT_FILE"
echo "pgrep -f \"$APP_NAME\"" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "# 检查应用包内容" >> "$REPORT_FILE"
echo "ls -la dist-electron/mac-arm64/${APP_NAME}.app/Contents/" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "# 检查 app.asar 内容" >> "$REPORT_FILE"
echo "npx asar list dist-electron/mac-arm64/${APP_NAME}.app/Contents/Resources/app.asar | head -20" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "# 提取并检查 app.asar" >> "$REPORT_FILE"
echo "npx asar extract dist-electron/mac-arm64/${APP_NAME}.app/Contents/Resources/app.asar /tmp/asar-extract" >> "$REPORT_FILE"
echo "ls -la /tmp/asar-extract/dist/" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "# 检查前端构建" >> "$REPORT_FILE"
echo "ls -la dist/" >> "$REPORT_FILE"
echo "cat dist/index.html | head -20" >> "$REPORT_FILE"
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

echo "✅ 诊断报告已生成: $REPORT_FILE"
echo ""
echo "📋 查看报告: cat $REPORT_FILE"
echo ""
echo "🔍 诊断完成！"
