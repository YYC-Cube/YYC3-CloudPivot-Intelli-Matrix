#!/bin/bash

# YYC³ CloudPivot Intelli-Matrix - 智能化校测脚本
# ============================================================
# 以可用性为前提，智能检测为核心
# 覆盖：环境、功能、存储、API、Ollama本地
# ============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 结果存储目录
RESULTS_DIR="$PROJECT_ROOT/docs/smart-check-results"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
REPORT_FILE="$RESULTS_DIR/smart-check-report-$TIMESTAMP.md"

# 创建结果目录
mkdir -p "$RESULTS_DIR"

# ============================================================
# 检测结果数组
# ============================================================

CHECK_RESULTS_env_score=0
CHECK_RESULTS_env_max=0
CHECK_RESULTS_env_status=""
CHECK_RESULTS_func_score=0
CHECK_RESULTS_func_max=0
CHECK_RESULTS_func_status=""
CHECK_RESULTS_storage_score=0
CHECK_RESULTS_storage_max=0
CHECK_RESULTS_storage_status=""
CHECK_RESULTS_api_score=0
CHECK_RESULTS_api_max=0
CHECK_RESULTS_api_status=""
CHECK_RESULTS_ollama_score=0
CHECK_RESULTS_ollama_max=0
CHECK_RESULTS_ollama_status=""

CRITICAL_ISSUES=""
WARNING_ISSUES=""
INFO_MESSAGES=""

# 辅助函数
print_header() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_section() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "  ${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "  ${YELLOW}⚠${NC} $1"
    if [ -z "$WARNING_ISSUES" ]; then
        WARNING_ISSUES="$1"
    else
        WARNING_ISSUES="$WARNING_ISSUES\n- $1"
    fi
}

print_error() {
    echo -e "  ${RED}✗${NC} $1"
    if [ -z "$CRITICAL_ISSUES" ]; then
        CRITICAL_ISSUES="$1"
    else
        CRITICAL_ISSUES="$CRITICAL_ISSUES\n- $1"
    fi
}

print_info() {
    echo -e "  ${CYAN}ℹ${NC} $1"
    if [ -z "$INFO_MESSAGES" ]; then
        INFO_MESSAGES="$1"
    else
        INFO_MESSAGES="$INFO_MESSAGES\n- $1"
    fi
}

# ============================================================
# 1. 环境可用性检测
# ============================================================

check_environment() {
    print_header "环境可用性检测"
    print_section "基础环境检查"
    
    local env_score=0
    local max_env_score=5
    
    # Node.js 版本
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$NODE_MAJOR" -ge 18 ]; then
            print_success "Node.js 版本: $NODE_VERSION (满足要求 ≥18)"
            ((env_score++))
        else
            print_error "Node.js 版本: $NODE_VERSION (需要 ≥18)"
        fi
    else
        print_error "Node.js 未安装"
        if [ -z "$CRITICAL_ISSUES" ]; then
            CRITICAL_ISSUES="Node.js 未安装"
        else
            CRITICAL_ISSUES="$CRITICAL_ISSUES\n- Node.js 未安装"
        fi
    fi
    
    # pnpm 版本
    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=$(pnpm -v)
        print_success "pnpm 版本: $PNPM_VERSION"
        ((env_score++))
    else
        print_error "pnpm 未安装"
        if [ -z "$CRITICAL_ISSUES" ]; then
            CRITICAL_ISSUES="pnpm 未安装"
        else
            CRITICAL_ISSUES="$CRITICAL_ISSUES\n- pnpm 未安装"
        fi
    fi
    
    # 依赖安装检查
    if [ -f "package.json" ]; then
        if [ -d "node_modules" ]; then
            DEPS_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
            print_success "依赖已安装: $DEPS_COUNT 个包"
            ((env_score++))
        else
            print_error "依赖未安装，请运行: pnpm install"
            CRITICAL_ISSUES+=("node_modules 不存在")
        fi
    else
        print_error "package.json 不存在"
        CRITICAL_ISSUES+=("package.json 不存在")
    fi
    
    # 端口检查
    print_section "端口可用性检查"
    if command -v lsof &> /dev/null; then
        PORT_3218=$(lsof -ti:3218 2>/dev/null || echo "available")
        if [ "$PORT_3218" = "available" ]; then
            print_success "端口 3218: 可用"
            ((env_score++))
        else
            print_info "端口 3218: 已被占用 (开发服务器)"
        fi
    else
        print_warning "lsof 命令不可用，跳过端口检查"
    fi
    
    # 环境变量检查
    print_section "环境变量检查"
    if [ -f ".env" ]; then
        print_success ".env 文件存在"
        ((env_score++))
        
        if grep -q "API_PROXY_BASE_URL" .env; then
            if grep -q "https://api.0379.world" .env; then
                print_success "API 代理网关 URL 已配置"
                ((env_score++))
            else
                print_warning "API 代理网关 URL 未配置 (使用默认值)"
            fi
        else
            print_warning "API 代理网关 URL 未定义"
        fi
    else
        print_warning ".env 文件不存在 (使用默认配置)"
    fi
    
    CHECK_RESULTS_env_score=$env_score
    CHECK_RESULTS_env_max=$max_env_score
    CHECK_RESULTS_env_status=$([ $env_score -eq $max_env_score ] && echo "excellent" || echo "partial")
    
    echo -e "\n环境得分: ${GREEN}$env_score${NC} / $max_env_score"
}

# ============================================================
# 2. 功能完整性检测
# ============================================================

check_functionality() {
    print_header "功能完整性检测"
    print_section "核心文件检查"
    
    local func_score=0
    local max_func_score=8
    
    # 入口文件
    if [ -f "index.html" ]; then
        print_success "index.html 存在"
        ((func_score++))
    else
        print_error "index.html 不存在"
    fi
    
    # manifest.json
    if [ -f "public/manifest.json" ]; then
        print_success "manifest.json 存在"
        
        if grep -q "icons" public/manifest.json; then
            print_success "PWA 图标配置存在"
            ((func_score++))
        else
            print_warning "PWA 图标配置缺失"
        fi
    else
        print_warning "manifest.json 不存在"
    fi
    
    # 主要组件
    if [ -f "src/main.tsx" ]; then
        print_success "main.tsx 入口文件存在"
        ((func_score++))
    else
        print_error "main.tsx 不存在"
    fi
    
    # Hook 文件
    if [ -f "src/app/hooks/useModelProvider.ts" ]; then
        print_success "useModelProvider.ts 存在"
        ((func_score++))
    else
        print_error "useModelProvider.ts 不存在"
    fi
    
    # 图标资源
    if [ -d "public/yyc3-icons/pwa" ]; then
        ICON_COUNT=$(ls public/yyc3-icons/pwa/*.png 2>/dev/null | wc -l)
        if [ $ICON_COUNT -ge 4 ]; then
            print_success "PWA 图标: $ICON_COUNT 个文件"
            ((func_score++))
        else
            print_warning "PWA 图标数量不足 ($ICON_COUNT/4)"
        fi
    else
        print_error "public/yyc3-icons/pwa 目录不存在"
    fi
    
    # 类型定义
    if [ -f "src/app/types/index.ts" ]; then
        print_success "types/index.ts 存在"
        ((func_score++))
    else
        print_warning "types/index.ts 不存在"
    fi
    
    # 国际化文件
    if [ -f "src/app/i18n/zh-CN.ts" ]; then
        print_success "i18n 中文配置存在"
        ((func_score++))
    else
        print_warning "i18n 配置缺失"
    fi
    
    # 测试覆盖
    if [ -d "src/app/__tests__" ]; then
        TEST_COUNT=$(find src/app/__tests__ -name "*.test.*" | wc -l)
        print_success "测试文件: $TEST_COUNT 个"
        if [ $TEST_COUNT -ge 50 ]; then
            ((func_score++))
        else
            print_warning "测试覆盖不足 ($TEST_COUNT/50)"
        fi
    else
        print_warning "测试目录不存在"
    fi
    
    CHECK_RESULTS_func_score=$func_score
    CHECK_RESULTS_func_max=$max_func_score
    CHECK_RESULTS_func_status=$([ $func_score -ge 6 ] && echo "good" || ([ $func_score -ge 4 ] && echo "acceptable" || echo "poor"))
    
    echo -e "\n功能得分: ${GREEN}$func_score${NC} / $max_func_score"
}

# ============================================================
# 3. 本地存储检测
# ============================================================

check_local_storage() {
    print_header "本地存储检测"
    print_section "LocalStorage 功能检查"
    
    local storage_score=0
    local max_storage_score=4
    
    # 存储键检查
    STORAGE_KEY="yyc3_configured_models"
    
    print_info "存储键: $STORAGE_KEY"
    print_info "存储位置: 浏览器 localStorage"
    
    # 检查代码中的存储逻辑
    if grep -q "localStorage.getItem.*yyc3_configured_models" src/app/hooks/useModelProvider.ts; then
        print_success "存储读取逻辑存在"
        ((storage_score++))
    else
        print_error "存储读取逻辑缺失"
        if [ -z "$CRITICAL_ISSUES" ]; then
            CRITICAL_ISSUES="localStorage 读取逻辑缺失"
        else
            CRITICAL_ISSUES="$CRITICAL_ISSUES\n- localStorage 读取逻辑缺失"
        fi
    fi
    
    if grep -q "localStorage.setItem.*yyc3_configured_models" src/app/hooks/useModelProvider.ts; then
        print_success "存储写入逻辑存在"
        ((storage_score++))
    else
        print_error "存储写入逻辑缺失"
        if [ -z "$CRITICAL_ISSUES" ]; then
            CRITICAL_ISSUES="localStorage 写入逻辑缺失"
        else
            CRITICAL_ISSUES="$CRITICAL_ISSUES\n- localStorage 写入逻辑缺失"
        fi
    fi
    
    # 错误处理
    if grep -q "try.*localStorage" src/app/hooks/useModelProvider.ts; then
        print_success "存储错误处理存在"
        ((storage_score++))
    else
        print_warning "存储错误处理建议添加"
    fi
    
    # JSON 解析
    if grep -q "JSON.parse" src/app/hooks/useModelProvider.ts; then
        print_success "JSON 解析逻辑存在"
        ((storage_score++))
    else
        print_warning "JSON 解析逻辑缺失"
    fi
    
    CHECK_RESULTS_storage_score=$storage_score
    CHECK_RESULTS_storage_max=$max_storage_score
    CHECK_RESULTS_storage_status=$([ $storage_score -eq $max_storage_score ] && echo "excellent" || ([ $storage_score -ge 3 ] && echo "good" || echo "needs_improvement"))
    
    echo -e "\n存储得分: ${GREEN}$storage_score${NC} / $max_storage_score"
}

# ============================================================
# 4. 大模型 API 检测
# ============================================================

check_apis() {
    print_header "大模型 API 检测"
    print_section "服务商配置检查"
    
    local api_score=0
    local max_api_score=5
    
    # 服务商定义
    if grep -q "MODEL_PROVIDERS.*=" src/app/hooks/useModelProvider.ts; then
        print_success "服务商常量定义存在"
        ((api_score++))
    else
        print_error "服务商定义缺失"
    fi
    
    # 支持的服务商数量
    PROVIDER_COUNT=$(grep -o '"id":' src/app/hooks/useModelProvider.ts | wc -l)
    if [ $PROVIDER_COUNT -ge 8 ]; then
        print_success "服务商数量: $PROVIDER_COUNT 个"
        ((api_score++))
    else
        print_warning "服务商数量不足 ($PROVIDER_COUNT/8)"
    fi
    
    # 添加模型函数
    if grep -q "addModel.*=" src/app/hooks/useModelProvider.ts; then
        print_success "addModel 函数存在"
        ((api_score++))
    else
        print_error "addModel 函数缺失"
    fi
    
    # 测试连接函数
    if grep -q "testConnection.*=" src/app/hooks/useModelProvider.ts; then
        print_success "testConnection 函数存在"
        ((api_score++))
    else
        print_error "testConnection 函数缺失"
    fi
    
    # API Key 配置
    if grep -q "apiKey.*:" src/app/hooks/useModelProvider.ts; then
        print_success "API Key 配置逻辑存在"
        ((api_score++))
    else
        print_warning "API Key 配置逻辑缺失"
    fi
    
    # 支持的服务商列表
    print_section "支持的服务商"
    echo -e "  ${CYAN}智谱 AI${NC} - Z.ai / Z.ai-plan"
    echo -e "  ${CYAN}Kimi${NC} - Kimi-CN / Kimi-Global"
    echo -e "  ${CYAN}DeepSeek${NC} - deepseek"
    echo -e "  ${CYAN}火山引擎${NC} - volcengine / volcengine-plan"
    echo -e "  ${CYAN}OpenAI${NC} - openai"
    echo -e "  ${CYAN}Ollama${NC} - ollama (本地)"
    
    CHECK_RESULTS_api_score=$api_score
    CHECK_RESULTS_api_max=$max_api_score
    CHECK_RESULTS_api_status=$([ $api_score -eq $max_api_score ] && echo "excellent" || ([ $api_score -ge 4 ] && echo "good" || echo "needs_improvement"))
    
    echo -e "\nAPI 得分: ${GREEN}$api_score${NC} / $max_api_score"
}

# ============================================================
# 5. Ollama 本地检测
# ============================================================

check_ollama() {
    print_header "Ollama 本地检测"
    print_section "Ollama 服务检查"
    
    local ollama_score=0
    local max_ollama_score=4
    
    # Ollama 命令检查
    if command -v ollama &> /dev/null; then
        OLLAMA_VERSION=$(ollama -v)
        print_success "Ollama 已安装: $OLLAMA_VERSION"
        ((ollama_score++))
    else
        print_warning "Ollama 未安装 (可选，用于本地推理)"
    fi
    
    # Ollama 服务检查
    print_info "检查 Ollama 服务: http://localhost:11434"
    if command -v curl &> /dev/null; then
        OLLAMA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:11434/api/tags 2>/dev/null || echo "000")
        
        if [ "$OLLAMA_STATUS" = "200" ]; then
            print_success "Ollama 服务运行中"
            ((ollama_score++))
            
            # 获取已安装模型
            OLLAMA_MODELS=$(curl -s http://localhost:11434/api/tags 2>/dev/null | grep -o '"name":"[^"]*"' | wc -l || echo "0")
            if [ $OLLAMA_MODELS -gt 0 ]; then
                print_success "已安装模型: $OLLAMA_MODELS 个"
                ((ollama_score++))
            else
                print_warning "未检测到已安装模型"
            fi
        elif [ "$OLLAMA_STATUS" = "000" ]; then
            print_info "Ollama 服务未运行 (端口 11434 未响应)"
        else
            print_warning "Ollama 服务异常 (HTTP $OLLAMA_STATUS)"
        fi
    else
        print_warning "curl 命令不可用，跳过服务检查"
    fi
    
    # 自动识别逻辑检查
    if grep -q "fetchOllamaModels" src/app/hooks/useModelProvider.ts; then
        print_success "Ollama 自动识别逻辑存在"
        ((ollama_score++))
    else
        print_error "Ollama 自动识别逻辑缺失"
    fi
    
    # Mock 数据检查
    if grep -q "mockModels" src/app/hooks/useModelProvider.ts; then
        print_success "Ollama Mock 回退逻辑存在"
        ((ollama_score++))
    else
        print_warning "Ollama Mock 回退逻辑建议添加"
    fi
    
    CHECK_RESULTS_ollama_score=$ollama_score
    CHECK_RESULTS_ollama_max=$max_ollama_score
    CHECK_RESULTS_ollama_status=$([ $ollama_score -eq $max_ollama_score ] && echo "excellent" || ([ $ollama_score -ge 3 ] && echo "good" || echo "needs_improvement"))
    
    echo -e "\nOllama 得分: ${GREEN}$ollama_score${NC} / $max_ollama_score"
}

# ============================================================
# 生成报告
# ============================================================

generate_report() {
    print_header "检测报告生成"
    
    # 计算总分
    TOTAL_SCORE=0
    TOTAL_MAX=0
    
    [ -n "$CHECK_RESULTS_env_score" ] && TOTAL_SCORE=$((TOTAL_SCORE + CHECK_RESULTS_env_score))
    [ -n "$CHECK_RESULTS_env_max" ] && TOTAL_MAX=$((TOTAL_MAX + CHECK_RESULTS_env_max))
    [ -n "$CHECK_RESULTS_func_score" ] && TOTAL_SCORE=$((TOTAL_SCORE + CHECK_RESULTS_func_score))
    [ -n "$CHECK_RESULTS_func_max" ] && TOTAL_MAX=$((TOTAL_MAX + CHECK_RESULTS_func_max))
    [ -n "$CHECK_RESULTS_storage_score" ] && TOTAL_SCORE=$((TOTAL_SCORE + CHECK_RESULTS_storage_score))
    [ -n "$CHECK_RESULTS_storage_max" ] && TOTAL_MAX=$((TOTAL_MAX + CHECK_RESULTS_storage_max))
    [ -n "$CHECK_RESULTS_api_score" ] && TOTAL_SCORE=$((TOTAL_SCORE + CHECK_RESULTS_api_score))
    [ -n "$CHECK_RESULTS_api_max" ] && TOTAL_MAX=$((TOTAL_MAX + CHECK_RESULTS_api_max))
    [ -n "$CHECK_RESULTS_ollama_score" ] && TOTAL_SCORE=$((TOTAL_SCORE + CHECK_RESULTS_ollama_score))
    [ -n "$CHECK_RESULTS_ollama_max" ] && TOTAL_MAX=$((TOTAL_MAX + CHECK_RESULTS_ollama_max))
    
    # 确保总数大于0再计算百分比
    if [ $TOTAL_MAX -gt 0 ]; then
        PERCENTAGE=$((TOTAL_SCORE * 100 / TOTAL_MAX))
    else
        PERCENTAGE=0
    fi
    
    # 评定等级
    if [ $PERCENTAGE -ge 90 ]; then
        GRADE="${GREEN}A${NC} (优秀)"
    elif [ $PERCENTAGE -ge 80 ]; then
        GRADE="${YELLOW}B${NC} (良好)"
    elif [ $PERCENTAGE -ge 70 ]; then
        GRADE="${YELLOW}C${NC} (合格)"
    elif [ $PERCENTAGE -ge 60 ]; then
        GRADE="${RED}D${NC} (需改进)"
    else
        GRADE="${RED}F${NC} (不合格)"
    fi
    
    # 生成 Markdown 报告
    cat > "$REPORT_FILE" << EOF
---
@file: smart-check-report-$TIMESTAMP.md
@description: YYC³ CloudPivot Intelli-Matrix 智能化校测报告
@author: YYC³ QA Team
@version: 1.0.0
@created: $(date +"%Y-%m-%d")
@status: completed
@tags: smart-check, validation, testing
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ CloudPivot Intelli-Matrix 智能化校测报告

**检测时间**: $(date +"%Y-%m-%d %H:%M:%S")
**项目路径**: $PROJECT_ROOT
**报告版本**: 1.0.0

---

## 📊 执行摘要

| 指标 | 得分 | 满分 | 状态 |
|-----|------|------|------|
| 环境可用性 | ${CHECK_RESULTS_env_score:-} | ${CHECK_RESULTS_env_max:-} | ${CHECK_RESULTS_env_status:-} |
| 功能完整性 | ${CHECK_RESULTS_func_score:-} | ${CHECK_RESULTS_func_max:-} | ${CHECK_RESULTS_func_status:-} |
| 本地存储 | ${CHECK_RESULTS_storage_score:-} | ${CHECK_RESULTS_storage_max:-} | ${CHECK_RESULTS_storage_status:-} |
| 大模型 API | ${CHECK_RESULTS_api_score:-} | ${CHECK_RESULTS_api_max:-} | ${CHECK_RESULTS_api_status:-} |
| Ollama 本地 | ${CHECK_RESULTS_ollama_score:-} | ${CHECK_RESULTS_ollama_max:-} | ${CHECK_RESULTS_ollama_status:-} |
| **总分** | **${TOTAL_SCORE}** | **${TOTAL_MAX}** | **$PERCENTAGE%** |

**综合评定**: $GRADE

---

## 🔴 严重问题 (需要立即处理)

${CRITICAL_ISSUES:-无严重问题}

---

## ⚠️  警告信息 (建议优化)

${WARNING_ISSUES:-无警告}

---

## ℹ️  信息汇总

${INFO_MESSAGES:-无额外信息}

---

## 📋 详细检测结果

### 1️⃣ 环境可用性检测

#### 基础环境检查
EOF
    
    # 重新执行检测以获取详细信息（简化版）
    echo -e "${CYAN}✓ 报告已生成: ${GREEN}$REPORT_FILE${NC}"
    echo -e "${CYAN}✓ 总分: ${GREEN}$TOTAL_SCORE${NC} / $TOTAL_MAX (${PERCENTAGE}%)"
    echo -e "${CYAN}✓ 综合评定: $GRADE${NC}"
}

# ============================================================
# 主执行流程
# ============================================================

main() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                                    ║"
    echo "║   YYC³ CloudPivot Intelli-Matrix - 智能化校测系统           ║"
    echo "║                                                                    ║"
    echo "║   以可用性为前提 · 智能检测为核心 · 全面验证         ║"
    echo "║                                                                    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # 执行所有检测
    check_environment
    check_functionality
    check_local_storage
    check_apis
    check_ollama
    
    # 生成报告
    generate_report
    
    # 显示总结
    print_header "检测完成"
    echo -e "${GREEN}所有检测脚本已执行完成！${NC}"
    echo -e "${CYAN}详细报告已保存至: $REPORT_FILE${NC}"
    echo ""
    echo -e "${YELLOW}下一步建议:${NC}"
    echo -e "  1. 查看报告了解详细检测结果"
    echo -e "  2. 根据严重问题优先处理"
    echo -e "  3. 针对警告项进行优化"
    echo ""
}

# 执行主函数
main
