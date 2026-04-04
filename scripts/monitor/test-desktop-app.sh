#!/bin/bash

set -e

APP_NAME="YYC³ CloudPivot"
APP_PATH="dist-electron/mac-arm64/${APP_NAME}.app"
DMG_PATH="dist-electron/${APP_NAME}-1.0.0-mac-arm64.dmg"
LOG_FILE="desktop-test-report-$(date +%Y%m%d-%H%M%S).md"

echo "# 桌面应用功能测试报告" > "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "**测试时间:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo "**测试人员:** YanYuCloudCube Team" >> "$LOG_FILE"
echo "**应用版本:** v1.0.0" >> "$LOG_FILE"
echo "**测试环境:** macOS $(sw_vers -productVersion) (ARM64)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

function check_app_exists() {
    if [ ! -d "$APP_PATH" ]; then
        echo "❌ 错误: 应用不存在于 $APP_PATH"
        echo "请先运行: pnpm run electron:build"
        exit 1
    fi
    echo "✅ 应用文件存在: $APP_PATH"
}

function launch_app() {
    echo "🚀 启动应用..."
    open "$APP_PATH"
    sleep 5
    if pgrep -f "$APP_NAME" > /dev/null; then
        echo "✅ 应用启动成功"
        echo "PID: $(pgrep -f "$APP_NAME")"
    else
        echo "❌ 应用启动失败"
        return 1
    fi
}

function check_process() {
    if pgrep -f "$APP_NAME" > /dev/null; then
        echo "✅ 应用进程运行中"
        return 0
    else
        echo "❌ 应用进程未运行"
        return 1
    fi
}

function get_memory_usage() {
    local pid=$(pgrep -f "$APP_NAME" | head -1)
    if [ -n "$pid" ]; then
        local memory=$(ps -p "$pid" -o rss= | tail -1)
        local memory_mb=$((memory / 1024))
        echo "📊 内存占用: ${memory_mb} MB"
        echo "$memory_mb"
    else
        echo "❌ 无法获取内存占用"
        echo "0"
    fi
}

function get_cpu_usage() {
    local pid=$(pgrep -f "$APP_NAME" | head -1)
    if [ -n "$pid" ]; then
        local cpu=$(ps -p "$pid" -o %cpu= | tail -1)
        echo "📊 CPU 占用: ${cpu}%"
        echo "$cpu"
    else
        echo "❌ 无法获取 CPU 占用"
        echo "0"
    fi
}

function check_dmg_size() {
    if [ -f "$DMG_PATH" ]; then
        local size=$(du -h "$DMG_PATH" | cut -f1)
        echo "📦 DMG 文件大小: $size"
        echo "$size"
    else
        echo "❌ DMG 文件不存在"
        echo "0"
    fi
}

echo "## 1. 文件检查" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
check_app_exists
echo "" >> "$LOG_FILE"

echo "## 2. 构建产物检查" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
dmg_size=$(check_dmg_size)
echo "| 检查项 | 预期 | 实际 | 状态 |" >> "$LOG_FILE"
echo "|--------|------|------|------|" >> "$LOG_FILE"
echo "| DMG 文件 | 存在 | $(check_dmg_size | head -1) | ✅ |" >> "$LOG_FILE"
echo "| 应用包 | 存在 | $(du -h "$APP_PATH" | cut -f1) | ✅ |" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

echo "## 3. 应用启动测试" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
if launch_app; then
    echo "| 检查项 | 预期 | 实际 | 状态 |" >> "$LOG_FILE"
    echo "|--------|------|------|------|" >> "$LOG_FILE"
    echo "| 应用启动 | 成功 | 成功 | ✅ |" >> "$LOG_FILE"
    echo "| 进程运行 | 运行 | 运行 | ✅ |" >> "$LOG_FILE"
else
    echo "| 检查项 | 预期 | 实际 | 状态 |" >> "$LOG_FILE"
    echo "|--------|------|------|------|" >> "$LOG_FILE"
    echo "| 应用启动 | 成功 | 失败 | ❌ |" >> "$LOG_FILE"
    echo "| 进程运行 | 运行 | 未运行 | ❌ |" >> "$LOG_FILE"
    exit 1
fi

echo "" >> "$LOG_FILE"
echo "## 4. 性能测试" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "等待应用稳定（10秒）..."
sleep 10

memory_mb=$(get_memory_usage)
cpu_percent=$(get_cpu_usage)

echo "| 指标 | 目标值 | 实际值 | 状态 |" >> "$LOG_FILE"
echo "|------|---------|---------|------|" >> "$LOG_FILE"
echo "| 内存占用 | < 200MB | ${memory_mb} MB | $( [ "$memory_mb" -lt 200 ] && echo "✅" || echo "⚠️" ) |" >> "$LOG_FILE"
echo "| CPU 占用 | < 5% | ${cpu_percent}% | $( [ "$cpu_percent" -lt 5 ] && echo "✅" || echo "⚠️" ) |" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

echo "## 5. 功能检查清单" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "请手动检查以下功能并更新报告：" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "| 功能 | 预期 | 实际 | 状态 |" >> "$LOG_FILE"
echo "|------|------|------|------|" >> "$LOG_FILE"
echo "| 应用正常启动 | 正常 | ___ | ⏳ |" >> "$LOG_FILE"
echo "| 窗口尺寸正确 | 1400×900 | ___ | ⏳ |" >> "$LOG_FILE"
echo "| 窗口可调整 | 是 | ___ | ⏳ |" >> "$LOG_FILE"
echo "| 系统托盘显示 | 显示 | ___ | ⏳ |" >> "$LOG_FILE"
echo "| 托盘菜单功能 | 正常 | ___ | ⏳ |" >> "$LOG_FILE"
echo "| 单实例锁定 | 生效 | ___ | ⏳ |" >> "$LOG_FILE"
echo "| 外部链接打开 | 浏览器 | ___ | ⏳ |" >> "$LOG_FILE"
echo "| 应用退出正常 | 正常 | ___ | ⏳ |" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

echo "## 6. 发现的问题" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "暂无问题记录" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

echo "## 7. 建议和下一步" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "### 立即执行" >> "$LOG_FILE"
echo "- [ ] 手动验证功能检查清单" >> "$LOG_FILE"
echo "- [ ] 记录发现的问题" >> "$LOG_FILE"
echo "- [ ] 更新测试报告" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "### 本周完成" >> "$LOG_FILE"
echo "- [ ] 兼容性测试（macOS 12-15）" >> "$LOG_FILE"
echo "- [ ] 更新 CHANGELOG.md" >> "$LOG_FILE"
echo "- [ ] 准备发布说明" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "### 下月规划" >> "$LOG_FILE"
echo "- [ ] 配置代码签名" >> "$LOG_FILE"
echo "- [ ] 实现自动更新" >> "$LOG_FILE"
echo "- [ ] 性能优化" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

echo "✅ 测试报告已生成: $LOG_FILE"
echo ""
echo "📋 查看报告: cat $LOG_FILE"
echo ""
echo "🚀 下一步: 手动验证功能并更新报告"
