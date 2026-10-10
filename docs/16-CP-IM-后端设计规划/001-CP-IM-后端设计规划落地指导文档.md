# YYC³ CP-IM 后端设计规划落地指导文档

| 项 | 内容 |
|---|---|
| 文档编号 | 001-CP-IM-后端设计规划落地指导文档 |
| 版本 | v1.0.0 |
| 日期 | 2026-10-10 |
| 状态 | 规划评审稿（后端未构建，本文档为建设依据） |
| 关联 | 三枢纽记忆 `docs/agent-memory/YYC3-三枢纽-长久记忆.md`；前端协议 `src/app/types/index.ts` |

---

## 1. 背景与目标

### 1.1 现状盘点

- **前端（本仓库）已完成**：React 19 + TS 监控运维台，40+ 页面；监控数据链路具备"真实优先、模拟兜底"骨架（`useWebSocketData` + `WSMessage` 六类消息 + `api-config` 端点配置），全部页面数据当前来自 localStorage Mock（`dashboard-stores.ts` 11 类 store）。
- **API 网关已完成**：`YYC3-0379-World`（FastAPI）——全链路 AI 模型网关与智能协同平台，已完成多端 API 部署。路由覆盖 chat / agent / a2a / mcp / websocket / knowledge_base / rag / proxy / video_tasks / admin / model_registry；`app/api/websocket.py` 已有 ConnectionManager 与上游池实时快照（EWMA 延迟、熔断状态）。
- **数据资产已盘点**：三枢纽文件沉淀了 99 仓库矩阵、48 模型资产（三存储节点 2026-09-27 实测 ~9.78 TB）、35 篇 DGX Spark 操作指南 + 105 项 NVIDIA 技能。
- **缺口**：CloudPivot 的**监控运维后端**（设备采集 → 归一化 → 广播 → 可编辑数据 CRUD → 告警审计）尚未构建。

### 1.2 建设目标

1. 监控面板（Dashboard / TopBar / 告警 / AI 诊断）显示**真实设备数据**，断线自动回退模拟模式（前端行为已内置）。
2. 规划面板等"可修改数据及变量"的页面，其数据从 localStorage **迁移至后端 CRUD**，多端一致。
3. 与 YYC3-0379-World 网关能力**复用而非重复建设**：鉴权、虚拟 Key、上游池、用量日志直接沿用。
4. 与模型资产矩阵、DGX Spark 集群**数据贯通**：模型权重注册表、存储池容量、推理服务端点全部入库可查。

---

## 2. 全局功能与数据架构剖析

### 2.1 现状三层视图

```
┌─ 资产与设备层 ────────────────────────────────────────────┐
│ 存储：本地盘 /Users/yanyu/models（1.38TB）                  │
│       Max 高速盘 /Volumes/Max/models                       │
│       yyc3-45 NAS /Volume1/yyc3_hd/data（8.40TB）          │
│ 算力：Mac 本机 · DGX Spark 单机/双机/三机（GB10）           │
│ 推理：Ollama:11434 / vLLM:30000 / NIM / llama.cpp …       │
│ 现状：静态 HTML 台账（MODELS-HUB），无实时性                │
└──────────────────────┬────────────────────────────────────┘
┌─ API 网关层（YYC3-0379-World，已完成）────────────────────┐
│ /v1/chat /agent /a2a /mcp /rag /proxy /video_tasks        │
│ /v1/models（注册中心+用量统计+错误记录）                     │
│ /v1/admin/{upstreams, virtual-keys, usage, pricing}       │
│ WS /ws（流式聊天 + 上游池快照广播）                          │
│ 现状：有 ConnectionManager，无设备监控域                    │
└──────────────────────┬────────────────────────────────────┘
┌─ 前端消费层（CloudPivot，已完成）─────────────────────────┐
│ WSMessage 六类消息 → useWebSocketData → WebSocketContext  │
│ 40+ 页面 ← localStorage store（nodeStore 等 11 类）        │
│ api-config：/api/fs /api/db /api/cluster /wsEndpoint      │
│ 现状：协议就绪、端点就绪、数据是假的                        │
└───────────────────────────────────────────────────────────┘
```

### 2.2 数据流分类（决定后端设计）

| 数据类别 | 示例 | 特征 | 后端形态 |
|---|---|---|---|
| 实时遥测 | GPU 利用率、温度、QPS、延迟、Token 吞吐 | 高频、只写、短保留 | 采集 agent + WS 广播，时序表短周期落库 |
| 可编辑配置 | 节点注册表、模型部署清单、告警规则、巡逻配置 | 低频、CRUD、多端一致 | REST CRUD + PostgreSQL |
| 资产台账 | 48 模型条目 × 3 存储节点路径与容量 | 低频、批量核验 | 注册表 + 定时容量重核任务 |
| 审计事件 | 操作记录、告警、巡检报告 | 追加写、查询多 | 事件表 + 订阅推送 |
| 用量统计 | 模型调用量、Token、成本 | 网关已产出 | 复用 0379-World usage_logger，仅做展示 API 适配 |

### 2.3 关键设计约束（来自前端既有契约）

- WS 协议必须为 `types/index.ts` 的 `WSMessage` 联合类型，**字段不得改名**：`qps_update / latency_update / node_status / alert / throughput_history / system_stats`。
- 推送频率建议：`node_status` 2 s、`system_stats` 5 s、`throughput_history` 10 s 批量、`alert` 事件驱动；与前端 100 ms 渲染节流匹配。
- REST 前缀与 `api-config.ts` 既有占位对齐：`/api/cluster`（节点/模型部署）、`/api/fs`（文件）、`/api/db`（数据库管理）。
- `system_stats.storageUsed` 必须真实取值（前端目前是写死的 "12.8TB"）。

---

## 3. 后端总体架构

### 3.1 形态选型

| 方案 | 说明 | 优点 | 缺点 | 结论 |
|---|---|---|---|---|
| A. 独立监控服务 | 新建 FastAPI 服务专供 CloudPivot | 隔离性好 | 鉴权/配置/部署重复建设，与网关数据不通 | 不推荐 |
| **B. 0379-World 模块化扩展（推荐）** | 在既有网关新增 `infra` 域：`app/api/infra_*.py` + `app/services/infra/` | 复用鉴权、虚拟 Key、DB、WS 管理器、部署流水线 | 需保持模块边界清晰 | **采用** |
| C. 引入 Prometheus 全家桶 | node_exporter + DCGM + Prometheus + Grafana | 生态成熟、历史查询强 | 与前端 WSMessage 协议需桥接，运维成本高 | 第二阶段可选叠加 |

### 3.2 目标架构

```
┌─ 采集端（新增，轻量 agent）────────────────────────────┐
│ mac-node-agent：本机（GPU/内存/磁盘/温度，powermetrics/  │
│   os API；无 N 卡时降级为 CPU/内存/磁盘指标）              │
│ dgx-spark-agent：nvidia-smi/DCGM 指标 + Ollama/vLLM      │
│   /v1/models 活跃模型与 QPS 探测                          │
│ 协议：agent → 网关 POST /v1/infra/metrics（或 WS 上报）    │
└──────────────────────┬───────────────────────────────────┘
┌─ 网关扩展层（0379-World + infra 域）─────────────────────┐
│ app/api/infra_nodes.py      节点注册 CRUD                  │
│ app/api/infra_metrics.py    指标接收 + 查询                │
│ app/api/infra_models.py     模型资产注册（MODEL_DB 入库）   │
│ app/api/infra_storage.py    存储池容量核验                 │
│ app/api/infra_alerts.py     告警规则 + 事件                │
│ app/api/infra_audit.py      操作审计                       │
│ app/api/infra_settings.py   可编辑配置（替代 localStorage）│
│ app/services/infra/         collector/broadcaster/registry │
│ app/api/websocket.py 扩展    按 WSMessage 广播设备数据      │
└──────────────────────┬───────────────────────────────────┘
┌─ 存储层 ────────────────────────────────────────────────┐
│ PostgreSQL：registry / audit / alerts / settings          │
│ 时序：node_metrics 表（分区，7 天热 + 30 天聚合）或可选   │
│   TimescaleDB；NAS 容量快照单独表                         │
└───────────────────────────────────────────────────────────┘
```

---

## 4. 数据模型设计（PostgreSQL DDL 核心表）

```sql
-- 4.1 节点注册表（对应前端 NodeData 扩展）
CREATE TABLE infra_nodes (
  id            TEXT PRIMARY KEY,              -- GPU-A100-01 / dgx-spark-01 / mac-studio
  hostname      TEXT NOT NULL,
  kind          TEXT NOT NULL,                 -- gpu_server | dgx_spark | mac | nas
  status        TEXT NOT NULL DEFAULT 'active',-- active | warning | inactive
  model_deployed TEXT DEFAULT '',
  labels        JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 4.2 节点实时指标（时序，短保留）
CREATE TABLE infra_node_metrics (
  node_id     TEXT REFERENCES infra_nodes(id),
  ts          TIMESTAMPTZ NOT NULL DEFAULT now(),
  gpu_util    REAL, mem_util REAL, temp_c REAL,
  active_tasks INT, qps REAL, latency_ms REAL, tokens_s BIGINT
);
-- 建 hypertable（TimescaleDB）或按天分区 + 7 天自动清理

-- 4.3 模型资产注册（MODELS-HUB MODEL_DB 入库）
CREATE TABLE model_assets (
  asset_id   TEXT PRIMARY KEY,                 -- ym-1 … ym-48
  title      TEXT NOT NULL,
  vendor     TEXT,
  category   TEXT NOT NULL,                    -- yyc3|llm|vlm|image|video|voice|embed|nlp|spatial|safety|assets
  tags       JSONB DEFAULT '[]',
  hot        BOOLEAN DEFAULT FALSE,
  desc       TEXT
);
CREATE TABLE model_asset_locations (           -- locs[] 展开
  asset_id   TEXT REFERENCES model_assets(asset_id),
  storage    TEXT NOT NULL,                    -- local | max | nas
  path       TEXT NOT NULL,
  size_gb    REAL,
  note       TEXT,
  verified_at TIMESTAMPTZ,                     -- 2026-09-27 首轮全量核验
  UNIQUE(asset_id, storage, path)
);

-- 4.4 存储池与容量快照
CREATE TABLE storage_pools (
  id   TEXT PRIMARY KEY,                       -- local | max | nas
  root TEXT NOT NULL,
  total_gb BIGINT, used_gb BIGINT, scanned_at TIMESTAMPTZ
);

-- 4.5 告警与审计
CREATE TABLE infra_alerts (
  id        BIGSERIAL PRIMARY KEY,
  severity  TEXT NOT NULL,                     -- info|warning|error|critical
  source    TEXT NOT NULL,
  message   TEXT NOT NULL,
  node_id   TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  acked_at  TIMESTAMPTZ
);
CREATE TABLE ops_audit (
  id        BIGSERIAL PRIMARY KEY,
  op_id     TEXT, action TEXT, target TEXT,
  actor     TEXT, status TEXT, detail JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.6 可编辑配置（前端 store 迁移目标）
CREATE TABLE app_settings (
  scope TEXT NOT NULL, key TEXT NOT NULL,
  value JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (scope, key)
);
```

> 与前端类型的对应关系：前端 `NodeStatusRecord`（snake_case，schema 注释已写明 `infra.nodes`）是 `infra_nodes + infra_node_metrics` 的视图投影，直接用 `toNodeData()` 转换——**该函数在代码库里已存在，是当初预留的接入口**。

---

## 5. API 设计

### 5.1 REST 路由（统一前缀 `/api/cluster`，鉴权复用网关 verify_api_key / 虚拟 Key）

| 方法 | 路径 | 说明 | 替代的前端 Mock |
|---|---|---|---|
| GET/POST/PATCH/DELETE | `/api/cluster/nodes` | 节点注册 CRUD | nodeStore |
| GET | `/api/cluster/nodes/{id}/metrics?range=1h` | 历史指标查询 | throughputHistory |
| GET | `/api/cluster/stats` | 系统总览（活跃节点/GPU 均值/吞吐/存储） | system_stats |
| GET/PUT | `/api/cluster/models/deployed` | 部署模型清单 | deployedModelStore |
| GET | `/api/cluster/models/assets` | 模型资产（含 locs） | MODELS-HUB 数据 |
| POST | `/api/cluster/storage/scan` | 触发容量重核（du 异步任务） | — |
| GET | `/api/cluster/storage/pools` | 存储池容量 | storageUsed |
| GET/POST/PATCH | `/api/cluster/alerts/rules` | 告警规则 | 前端 useAlertRules |
| GET | `/api/cluster/alerts/events` | 告警事件流 | alerts |
| GET/POST | `/api/cluster/audit` | 操作审计 | recentOpsStore |
| GET/PUT | `/api/cluster/settings/{scope}` | 可编辑配置（节点/模型/雷达/日志等 scope） | 其余 11 类 store |
| POST | `/v1/infra/metrics` | 采集 agent 上报入口（mTLS/预共享密钥） | — |

### 5.2 WebSocket 协议（扩展 `app/api/websocket.py`）

- 沿用既有 ConnectionManager，新增 channel 概念：`/ws` 保持聊天；新增 `/ws/monitor` 频道广播设备数据。
- 广播负载**严格使用 WSMessage 类型**，由 `services/infra/broadcaster.py` 定时汇总：

```jsonc
// 2s  node_status: NodeData[]          ← infra_nodes JOIN 最新 metrics
// 5s  system_stats: {activeNodes, gpuUtil, tokenThroughput, storageUsed}
// 10s throughput_history: ThroughputPoint[]（近 60 点窗口）
// 事件 alert: AlertData                 ← infra_alerts INSERT 触发
```

- 网关自身的上游池快照（`_upstream_snapshot()`）建议并入 `system_stats` 的扩展字段，让监控面板同时看到"模型网关健康度"。

---

## 6. 与三枢纽的数据贯通

| 枢纽 | 数据 | 落地动作 |
|---|---|---|
| MODELS-HUB | MODEL_DB 48 条 + CONFIG 三节点 | 一次性迁移脚本 `scripts/import_model_assets.py`（解析 HTML 内嵌 JSON → `model_assets` + `model_asset_locations`）；`verified_at=2026-09-27` 原样保留；此后容量重核走 `/storage/scan` |
| DGX-SPARK-HUB | 35 指南 + 105 技能 + 服务端点表 | 端点表入库为 `infra_services`（供连通性巡检）；指南/技能作为知识库喂给 0379-World RAG（knowledge_base 路由已存在） |
| YYC-CUBE-HUB | 99 仓库清单 | 入库 `repo_registry`，供部署状态与 CI 进度追踪；与 GitHub API 定时同步 stars/最近提交 |

---

## 7. 采集端设计（最小可用）

**mac-node-agent（Python，单文件即可起步）**：
- 指标源：`psutil`（CPU/内存/磁盘/网络）+ `powermetrics --samplers gpu`（Apple Silicon GPU）或 `nvidia-smi --query-gpu=utilization.gpu,memory.used,temperature.gpu`（DGX Spark）。
- 行为：每 2 s 采样 → POST `/v1/infra/metrics`（批量窗口 10 s），失败指数退避，本地环形缓冲断点续传。
- DGX Spark 增强：轮询 Ollama `/api/ps` 与 vLLM `/metrics` 得活跃模型与 QPS，映射 `model_deployed / qps / tokens_s`。

**Electron 形态**：桌面版可将 agent 嵌入 `electron/main.ts` 主进程，经 IPC → 渲染层直接入 WebSocketContext，桌面端零网络依赖。

---

## 8. 分阶段落地路线

| 阶段 | 目标 | 交付物 | 验收 |
|---|---|---|---|
| **P0（1~2 周）采集 + WS 直通** | 监控面板显示真实数据 | infra 域最小集：metrics 上报接口 + broadcaster + mac/DGX agent + `node_status/system_stats/throughput_history` 广播 | Dashboard 真实/模拟徽标正确切换；数值与 `nvidia-smi` 一致 |
| **P1（2~3 周）注册中心 + CRUD 迁移** | 规划面板等页面数据后端化 | 节点/部署模型/设置 CRUD；前端 11 类 store 逐一切换为 REST + 离线回退（复用 backgroundSync 队列） | 两端浏览器同时编辑无冲突；刷新后一致 |
| **P2（2 周）告警 + 审计 + 资产入库** | 告警闭环与资产台账 | 告警规则引擎（阈值/温度）、audit 表、MODEL_DB 迁移、存储扫描任务 | 温度超阈值 5 s 内面板弹告警；资产查询返回 48 条 |
| **P3（持续）多端部署 + 网关融合** | 与 0379-World 一体部署 | docker-compose（gateway+postgres+agent）；上游池快照并入监控；Prometheus 可选叠加 | 单机 `docker compose up` 全栈可跑 |

前端配套改动（每阶段内同步完成，量都很小）：`enableBackend` 开关接入、双 WS hook 收敛为 Context、`storageUsed` 打通、store→API 适配层。

---

## 9. 部署架构

```
┌─ yyc3-45 NAS ──────────────┐
│ 模型冷备 /Volume1/yyc3_hd   │
│ PostgreSQL（可选，容器）     │
└──────────┬───────────────────┘
┌─ Mac 本机 ─────────────────┐     ┌─ DGX Spark ───────────────┐
│ CloudPivot 前端 (3218)      │     │ dgx-spark-agent           │
│ 0379-World 网关 (:3113/ws)  │←──→│ nvidia-smi + Ollama:11434 │
│ mac-node-agent              │     │ vLLM:30000 / NIM          │
└─────────────────────────────┘     └───────────────────────────┘
```
- 单机起步：`docker compose` = gateway + postgres +（可选）agent；与既有 0379-World 部署并轨。
- 远程访问：Tailscale（DGX-SPARK-HUB 已有指南），WS 经 Tailscale 域名暴露，前端 `api-config` 设置页填地址即可（该 UI 已存在）。

## 10. 风险与注意事项

1. **协议冻结**：`WSMessage` 六类消息字段是前端契约，后端广播层必须加 schema 校验（pydantic），违规消息丢弃并告警，不许"迁就式"改前端。
2. **采集降级的诚实性**：无 N 卡的节点 `gpu_util` 应上报 `null` 而非 0，前端已能用 `status` 区分；杜绝"假真实数据"。
3. **时序表膨胀**：`infra_node_metrics` 必须配保留策略（7 天热数据 + 小时级聚合 30 天），否则 3 节点 × 2 s 一年即 4700 万行。
4. **CRUD 迁移的离线语义**：前端 PWA 离线模式依赖 localStorage store，迁移后需保留本地缓存层（backgroundSync 队列已有雏形），不能做成"在线才能用"。
5. **敏感信息**：沿用 MODELS-HUB 口径——API Key 不入库；agent 上报密钥用预共享密钥 + IP 白名单，后续升级 mTLS。
6. **双配置系统**：`api-config.ts` 与 `network-utils.ts` 的 wsUrl 并存问题（rf001 测试已标注）须在 P0 一并收敛，否则部署时会出现"设置页改了一个、连的是另一个"。

## 11. 验收标准（总）

- 监控面板全部指标来自真实采集，断网自动切模拟且有明显徽标；
- 规划面板等可编辑页面数据落库，双端一致，离线可改、联网同步；
- 模型资产查询接口返回 48 条 + 三节点路径，容量与 2026-09-27 台账一致（重核后更新）；
- `docker compose up` 一键起全栈；`pnpm test` 前端测试全绿。
