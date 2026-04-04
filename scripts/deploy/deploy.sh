#!/bin/bash

# ============================================================================
# YYC³ CloudPivot Intelli-Matrix - 自动化部署脚本
# ============================================================================
# 用途：一键部署到生产环境
# 使用：./scripts/deploy.sh [staging|production]
# ============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
ENVIRONMENT=${1:-staging}
PROJECT_NAME="yyc3-cpim"
REMOTE_USER="${REMOTE_USER:-deploy}"
REMOTE_HOST="${REMOTE_HOST:-192.168.3.x}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/yyc3-cpim}"
BACKUP_DIR="/backup/yyc3-cpim"

# 函数：打印信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 函数：检查依赖
check_dependencies() {
    print_info "检查依赖..."
    
    commands=("git" "node" "pnpm" "ssh" "rsync")
    for cmd in "${commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            print_error "未找到命令：$cmd"
            exit 1
        fi
    done
    
    print_success "依赖检查通过"
}

# 函数：检查环境
check_environment() {
    print_info "检查环境配置..."
    
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        print_error "无效的环境：$ENVIRONMENT (应该是 staging 或 production)"
        exit 1
    fi
    
    if [[ -z "$REMOTE_HOST" ]]; then
        print_error "未设置 REMOTE_HOST"
        exit 1
    fi
    
    print_success "环境检查通过 (环境：$ENVIRONMENT)"
}

# 函数：构建项目
build_project() {
    print_info "构建项目..."
    
    # 安装依赖
    pnpm install --frozen-lockfile
    
    # 运行测试
    print_info "运行测试..."
    pnpm test:ci || {
        print_error "测试失败，中止部署"
        exit 1
    }
    
    # 类型检查
    print_info "类型检查..."
    pnpm type-check || {
        print_warning "类型检查失败，继续部署..."
    }
    
    # 构建
    print_info "开始构建..."
    NODE_ENV=production pnpm build
    
    print_success "构建完成"
}

# 函数：备份远程服务器
backup_remote() {
    print_info "备份远程服务器..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_NAME="backup_${TIMESTAMP}"
    
    ssh ${REMOTE_USER}@${REMOTE_HOST} << EOF
        mkdir -p $BACKUP_DIR
        if [ -d "$REMOTE_PATH/current" ]; then
            cp -r $REMOTE_PATH/current $BACKUP_DIR/$BACKUP_NAME
            echo "备份完成：$BACKUP_DIR/$BACKUP_NAME"
        else
            echo "无现有部署，跳过备份"
        fi
EOF
    
    print_success "备份完成"
}

# 函数：部署到远程服务器
deploy_remote() {
    print_info "部署到远程服务器..."
    
    # 同步文件
    rsync -avz --delete \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='.env' \
        dist/ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/current/
    
    # 远程配置
    ssh ${REMOTE_USER}@${REMOTE_HOST} << EOF
        cd $REMOTE_PATH/current
        
        # 创建必要的目录
        mkdir -p logs
        
        # 设置权限
        chmod -R 755 .
        
        # 重启服务 (systemd)
        if command -v systemctl &> /dev/null; then
            sudo systemctl restart $PROJECT_NAME || true
        fi
        
        echo "部署完成"
EOF
    
    print_success "部署完成"
}

# 函数：健康检查
health_check() {
    print_info "执行健康检查..."
    
    MAX_RETRIES=30
    RETRY_DELAY=10
    HEALTH_URL="http://${REMOTE_HOST}:3118"
    
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -f -s -o /dev/null "$HEALTH_URL"; then
            print_success "健康检查通过 ($i/$MAX_RETRIES)"
            return 0
        fi
        print_warning "等待服务启动... ($i/$MAX_RETRIES)"
        sleep $RETRY_DELAY
    done
    
    print_error "健康检查失败"
    return 1
}

# 函数：回滚
rollback() {
    print_warning "执行回滚..."
    
    ssh ${REMOTE_USER}@${REMOTE_HOST} << EOF
        cd $REMOTE_PATH
        
        # 获取最新的备份
        LATEST_BACKUP=$(ls -t $BACKUP_DIR | head -1)
        
        if [ -n "$LATEST_BACKUP" ]; then
            # 停止当前服务
            sudo systemctl stop $PROJECT_NAME || true
            
            # 恢复备份
            rm -rf current
            cp -r $BACKUP_DIR/$LATEST_BACKUP current
            
            # 重启服务
            sudo systemctl start $PROJECT_NAME
            
            echo "回滚完成：$LATEST_BACKUP"
        else
            echo "未找到备份"
            exit 1
        fi
EOF
    
    print_success "回滚完成"
}

# 主函数
main() {
    echo "============================================"
    echo "  YYC³ CloudPivot Intelli-Matrix"
    echo "  自动化部署脚本"
    echo "  环境：$ENVIRONMENT"
    echo "============================================"
    echo ""
    
    # 检查
    check_dependencies
    check_environment
    
    # 构建
    build_project
    
    # 备份
    backup_remote
    
    # 部署
    if ! deploy_remote; then
        print_error "部署失败，执行回滚"
        rollback
        exit 1
    fi
    
    # 健康检查
    if ! health_check; then
        print_error "健康检查失败，执行回滚"
        rollback
        exit 1
    fi
    
    echo ""
    echo "============================================"
    print_success "部署成功完成！"
    echo "============================================"
    echo ""
    echo "访问地址：http://${REMOTE_HOST}:3118"
    echo ""
}

# 执行
main
