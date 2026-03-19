#!/bin/bash

set -e

APP_NAME="YYC³ CloudPivot"
LOG_FILE="desktop-monitor-$(date +%Y%m%d-%H%M%S).log"

echo "📊 桌面应用监控脚本" | tee "$LOG_FILE"
echo "启动时间: $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

function get_app_pid() {
    pgrep -f "$APP_NAME" | head -1
}

function get_app_info() {
    local pid=$(get_app_pid)
    if [ -n "$pid" ]; then
        echo "📱 应用进程信息:" | tee -a "$LOG_FILE"
        echo "  PID: $pid" | tee -a "$LOG_FILE"
        echo "  运行时间: $(ps -p "$pid" -o etime=)" | tee -a "$LOG_FILE"
        echo "  线程数: $(ps -p "$pid" -o nlwp=)" | tee -a "$LOG_FILE"
        echo "" | tee -a "$LOG_FILE"
    else
        echo "❌ 应用未运行" | tee -a "$LOG_FILE"
        return 1
    fi
}

function check_window() {
    echo "🖥️ 窗口状态检查:" | tee -a "$LOG_FILE"
    
    if pgrep -f "$APP_NAME" > /dev/null; then
        local windows=$(osascript -e 'tell application "System Events" to get count of (processes whose name is "'"$APP_NAME"'")')
        echo "  窗口数量: $windows" | tee -a "$LOG_FILE"
        
        if [ "$windows" -gt 0 ]; then
            echo "  状态: ✅ 窗口显示" | tee -a "$LOG_FILE"
        else
            echo "  状态: ⚠️ 窗口隐藏" | tee -a "$LOG_FILE"
        fi
    else
        echo "  状态: ❌ 应用未运行" | tee -a "$LOG_FILE"
    fi
    echo "" | tee -a "$LOG_FILE"
}

function check_tray() {
    echo "🔔 系统托盘检查:" | tee -a "$LOG_FILE"
    
    if pgrep -f "$APP_NAME" > /dev/null; then
        echo "  状态: ✅ 托盘图标应显示" | tee -a "$LOG_FILE"
        echo "  提示: 请检查菜单栏右上角" | tee -a "$LOG_FILE"
    else
        echo "  状态: ❌ 应用未运行" | tee -a "$LOG_FILE"
    fi
    echo "" | tee -a "$LOG_FILE"
}

function check_resources() {
    local pid=$(get_app_pid)
    if [ -n "$pid" ]; then
        echo "💾 资源占用:" | tee -a "$LOG_FILE"
        
        local stats=$(ps -p "$pid" -o pid,rss,vsz,pcpu,etime=)
        local rss=$(echo "$stats" | awk '{print $2}')
        local vsz=$(echo "$stats" | awk '{print $3}')
        local cpu=$(echo "$stats" | awk '{print $4}')
        local etime=$(echo "$stats" | awk '{print $5}')
        
        local rss_mb=$((rss / 1024))
        local vsz_mb=$((vsz / 1024))
        
        echo "  实际内存 (RSS): ${rss_mb} MB" | tee -a "$LOG_FILE"
        echo "  虚拟内存 (VSZ): ${vsz_mb} MB" | tee -a "$LOG_FILE"
        echo "  CPU 占用: ${cpu}%" | tee -a "$LOG_FILE"
        echo "  运行时间: $etime" | tee -a "$LOG_FILE"
        echo "" | tee -a "$LOG_FILE"
        
        echo "📊 性能评估:" | tee -a "$LOG_FILE"
        
        if [ "$rss_mb" -lt 200 ]; then
            echo "  内存占用: ✅ 优秀 (< 200MB)" | tee -a "$LOG_FILE"
        elif [ "$rss_mb" -lt 500 ]; then
            echo "  内存占用: ⚠️ 良好 (200-500MB)" | tee -a "$LOG_FILE"
        else
            echo "  内存占用: ❌ 偏高 (> 500MB)" | tee -a "$LOG_FILE"
        fi
        
        if [ "$(echo "$cpu" | cut -d. -f1)" -lt 5 ]; then
            echo "  CPU 占用: ✅ 优秀 (< 5%)" | tee -a "$LOG_FILE"
        elif [ "$(echo "$cpu" | cut -d. -f1)" -lt 20 ]; then
            echo "  CPU 占用: ⚠️ 良好 (5-20%)" | tee -a "$LOG_FILE"
        else
            echo "  CPU 占用: ❌ 偏高 (> 20%)" | tee -a "$LOG_FILE"
        fi
        echo "" | tee -a "$LOG_FILE"
    fi
}

function check_logs() {
    echo "📋 日志检查:" | tee -a "$LOG_FILE"
    
    local log_dir="$HOME/Library/Logs/$APP_NAME"
    if [ -d "$log_dir" ]; then
        echo "  日志目录: $log_dir" | tee -a "$LOG_FILE"
        local latest_log=$(ls -t "$log_dir" | head -1)
        if [ -n "$latest_log" ]; then
            echo "  最新日志: $latest_log" | tee -a "$LOG_FILE"
            local log_size=$(du -h "$log_dir/$latest_log" | cut -f1)
            echo "  日志大小: $log_size" | tee -a "$LOG_FILE"
            echo "" | tee -a "$LOG_FILE"
            echo "  最近 10 行日志:" | tee -a "$LOG_FILE"
            tail -10 "$log_dir/$latest_log" | sed 's/^/    /' | tee -a "$LOG_FILE"
        fi
    else
        echo "  状态: ⚠️ 日志目录不存在" | tee -a "$LOG_FILE"
    fi
    echo "" | tee -a "$LOG_FILE"
}

function interactive_menu() {
    echo "🎮 交互菜单:" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo "请选择操作:" | tee -a "$LOG_FILE"
    echo "  1) 查看应用信息" | tee -a "$LOG_FILE"
    echo "  2) 检查窗口状态" | tee -a "$LOG_FILE"
    echo "  3) 检查系统托盘" | tee -a "$LOG_FILE"
    echo "  4) 检查资源占用" | tee -a "$LOG_FILE"
    echo "  5) 查看应用日志" | tee -a "$LOG_FILE"
    echo "  6) 全部检查" | tee -a "$LOG_FILE"
    echo "  7) 重启应用" | tee -a "$LOG_FILE"
    echo "  8) 退出应用" | tee -a "$LOG_FILE"
    echo "  0) 退出脚本" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo -n "请输入选项 (0-8): "
    read choice
    
    case $choice in
        1)
            get_app_info
            ;;
        2)
            check_window
            ;;
        3)
            check_tray
            ;;
        4)
            check_resources
            ;;
        5)
            check_logs
            ;;
        6)
            echo "🔄 执行全部检查..." | tee -a "$LOG_FILE"
            echo "" | tee -a "$LOG_FILE"
            get_app_info
            check_window
            check_tray
            check_resources
            check_logs
            ;;
        7)
            echo "🔄 重启应用..." | tee -a "$LOG_FILE"
            local pid=$(get_app_pid)
            if [ -n "$pid" ]; then
                kill "$pid"
                sleep 2
                open "dist-electron/mac-arm64/$APP_NAME.app"
                echo "✅ 应用已重启" | tee -a "$LOG_FILE"
            else
                echo "❌ 应用未运行，启动中..." | tee -a "$LOG_FILE"
                open "dist-electron/mac-arm64/$APP_NAME.app"
            fi
            ;;
        8)
            echo "🛑 退出应用..." | tee -a "$LOG_FILE"
            local pid=$(get_app_pid)
            if [ -n "$pid" ]; then
                kill "$pid"
                echo "✅ 应用已退出" | tee -a "$LOG_FILE"
            else
                echo "⚠️ 应用未运行" | tee -a "$LOG_FILE"
            fi
            ;;
        0)
            echo "👋 退出脚本" | tee -a "$LOG_FILE"
            exit 0
            ;;
        *)
            echo "❌ 无效选项" | tee -a "$LOG_FILE"
            ;;
    esac
}

echo "📋 监控日志: $LOG_FILE" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

while true; do
    interactive_menu
    echo "" | tee -a "$LOG_FILE"
    echo "---" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
done
