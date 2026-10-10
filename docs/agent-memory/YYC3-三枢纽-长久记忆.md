# YYC³ 枢纽文件与资产资料 · 长久记忆

> 记忆登记：2026-10-10（首版）→ 2026-10-10 13:00（第二次更新，纳入 5 个新附件）。
> 本笔记为跨会话持久记忆载体，后续会话涉及模型资产 / DGX Spark / 仓库矩阵 / NVIDIA 技能 / 后端规划时优先读本文件。
> **权威副本已复制进本仓库 `docs/agent-memory/refs/`**，离线可用；原位于 `/Users/yanyu/YYC-Cube/nvidia-workbench/`。

## 〇、资料清单（本仓库 refs/ 目录，2026-10-10 复制）

| 文件 | 大小 | 性质 |
| --- | --- | --- |
| `DGX-SPARK-HUB-OFFLINE.html` | 562 KB | **新版** DGX Spark 操作中心（已大幅扩容，见 §四） |
| `YYC-CUBE-HUB.html` | 129 KB | 仓库矩阵操作中心（99 仓库，未变化） |
| `Skills.md` | 181 KB | NVIDIA 技能全量中文目录 **401 项**（2026.10.0） |
| `YYC3-Models-资产详情.md` | 10.6 KB | 模型资产逐项核验详情（2026-09-27 实测口径） |
| `NVIDIA-NIM-全量模型-分析报告.md` | 41 KB | 138 款 NIM 模型分类分析 + DGX Spark 部署选型 |

## 一、文件定位与路径

用户口述路径 `YYC3-DGX-Spark/` 实际不存在。三枢纽权威副本：

| 文件 | 路径 | 内容 |
| --- | --- | --- |
| YYC-CUBE-HUB（远程项目仓库一览） | `/Users/yanyu/YYC-Cube/YYC3-0379-World/docs/YYC-CUBE-HUB.html` | 双组织 99 仓库统一操作中心 |
| YYC3-MODELS-HUB | `/Users/yanyu/YYC-Cube/YYC3-0379-World/docs/模型资产与路径/YYC3-MODELS-HUB.html` | 三节点模型资产矩阵（48 条目） |
| DGX-SPARK-HUB-OFFLINE | `/Users/yanyu/YYC-Cube/nvidia-workbench/DGX-SPARK-HUB-OFFLINE.html`（新版，比 0379-World 副本新） | DGX Spark 操作中心（226 指南 + 401 技能） |

同源副本还存在于：`YYC3-APPS/`、`YYC3-Knowledge-Base/docs/`、`YYC3-0379-World/docs/架构与部署/` 等。**以 nvidia-workbench 与 0379-World/docs 两处为最新**。

## 二、YYC-CUBE-HUB —— 仓库矩阵（未变化）

- 纳管 **YYC-Cube 与 YanYuCloudCube 双组织共 99 个仓库**（页面文案称 94，内嵌 GUIDES 数据实为 99 条）。
- 分类（8 类）：`org-yanyucloudcube`（组织官方）、`platform`（平台基座）、`ai-app`、`admin`、`finance`、`industry`、`creative` + 1。
- 关键项目：`YYC3-0379-World`（FastAPI AI 模型网关，API 已完成多端部署）、`YYC3-CloudPivot-Intelli-Matrix`（本工作区前端）、`YYC3-Cloud-Matrix`（多端推理矩阵看盘）、`NVIDIA-DGX-Workbench`、`YYC3-Bot`（AI 对话+设备监控+MCP 门户）。
- 功能：分类浏览、智能检索、5 步 GitHub Pages 部署指南（克隆→构建→Pages 发布→Actions→自定义域名 matrix.yyc3.top / Pivot.yyc3.top）、localStorage 进度追踪、导入导出。

## 三、YYC3-MODELS-HUB + 资产详情 —— 模型资产（2026-09-27 四轮 SSH 实测口径）

- `CONFIG` 三存储节点：**本地盘** `/Users/yanyu/models`、**Max 高速盘** `/Volumes/Max/models`、**yyc3-45 NAS** `/Volume1/yyc3_hd/data`。
- **yyc3-22 = 本机 macOS M4 Max 128G（主开发机）**；NAS 根目录 12 条目。
- `MODEL_DB` 48 条目、11 分类（yyc3/llm/vlm/image/video/voice/embed/nlp/spatial/safety/assets）；schema `{id, cats[], pills[], warn, stars, cat, hot, title, mono, vendor, tags[], desc, locs[]}`，`locs[i]={g: local|max|nas, p, gb, note}`。
- **总容量：本机两盘约 1.38 TB + NAS 约 8.40 TB ≈ 9.78 TB**；32 个权重目录 `du -sh` 实测；API Key 不入库。

### 逐项核验要点（来自 YYC3-Models-资产详情.md）

- **DeepSeek**：V4-Flash 149G · V4-Pro 806G · Base 双版本 275G（46 分片）+ 1.5T（64 分片）。
- **GLM**：GLM-5.1 1.4T · GLM-5.1-FP8 705G · GLM-5.3-Flash 306G（与 Max 盘一致）· Cogagent-9B 26G · Cogvideox-5B 21G · **ChatGLM3-6B / CodeGeeX4-9B / CodeGeex4-9B_Q8 三个 0 字节空壳**（启用需重新下载）。
- **Qwen 冷备全谱**：0.6B~3.8 系列 + Coder-30B-A3B（114G 全量 / 18G Q4）+ Qwen3.5-122B-A10B 229G + 397B-A17B 752G + Embedding-8B 15G + Reranker-8B 16G + ASR 0.6B/1.7B。
- **Qwen3.8-Flash-Next 336G**：131 分片 BF16 全量，含图像+视频 preprocessor——**多模态旗舰，非占位**。
- **Kimi-K2.6 555G**（1T MoE 冷备）；**Ring-2.6-1T 970G**：BailingMoeV2_5（蚂蚁 Ling 系混合注意力 MoE），80 层 / hidden 8192 / 256 experts top-8 + 1 shared / MLA kv_lora_rank 512 / FP8_DYNAMIC / 175 safetensors 分片平铺（非 HF cache）。
- **MegaStyle-1.4M 41.9G 已重新归类为数据集**（arXiv 2604.08364，170K 风格 prompt × 400K 内容 prompt → 1.4M 图像，Qwen-Image 风格映射管线；5 片 parquet ≈ 2.58GB/片）。
- **Ternary-Bonsai-2-27B 64G**：三值 GGUF 实验发布包（F16 主权重 + PQ2_0/PTQ1_0 量化 + BF16/Q8 视觉投影器），**发布方未识别、未收录于 NIM-138 清单，部署前先读 KNOWN_ISSUES.md**。
- 本地盘新品（2026-09-27 快照 25 目录）：IndexTTS-2.5、laya、MiniCPM5-2B、Qwen-Image-2.1、Qwen3-ASR 系列、VoxCPM2、MiniMax-H3-NF4 等。

## 四、DGX-SPARK-HUB-OFFLINE —— 操作中心（新版大幅扩容）

- 硬件：NVIDIA DGX Spark（GB10，128GB 统一内存），支持单机 / 双机 200Gbps RoCE QSFP 直连（TP=2）/ 三机环形 / CX-7 交换机组网。
- **新版数据规模（较旧版 35 指南 + 105 技能大幅扩充）**：
  - `GUIDES`：**226 条**，分类：nvidia-docs 131（NVIDIA 官方文档外链）、github-repos 17、nim-models 12、ai-application 11、inference 9、mid-term 9、nvidia-resources 8、development 7、finetuning 6、cluster 5、data-science 4、yyc3-ops 4、getting-started / security / quantization 各 1；**157 条为外部链接型**（`type:'external'` + `externalUrl`）。新 schema：无引号键 + 单引号值，字段含 `order, titleEn, diff, time, prereq, overview`。
  - `SKILLS`：**401 条**，分类 Top：tao 76、doca 60、jetson 38、bionemo 21、megatron 20、vss 15、medical-imaging 14、isaac-health 14、deepstream 13、nemo-relay 10、nvflare 9、cuopt 8、physical-ai 8、earth2 7、holoscan 6、dynamo 4、rag 3、nemotron 3、cudaq 2 等；字段 `cmd: 'npx skills add NVIDIA/skills --skill <id>'`。
- 关键服务端点：Ollama `:11434`、vLLM `:30000/v1`、Jupyter `:8888`、ComfyUI `:8188`、自定义推理 `:8000/generate`、`rag:8000`、`vlm:8000`。

## 五、Skills.md —— NVIDIA 技能全量目录（2026.10.0，2026-10-09 更新）

- **401 项 Agent Skills 中文规范版**，上游 `github.com/NVIDIA/skills`，Apache-2.0。
- 安装：`npx skills add NVIDIA/skills --skill <skill-id>`；浏览 `--list`；一键更新 `bash scripts/update-skills.sh`（重建→校验→推送→GitHub Pages 部署→线上验证）。
- 智能体调用范式：意图识别 → 匹配 Skill ID → 安装调度 → 按 SKILL.md 执行 → 多技能协同时优先 setup/router/discover 类。
- 20 章分类：01 GPU 加速计算 3 · 02 优化求解 8 · 03 CUDA-Q 量子 2 · 04 DeepStream 13 · 05 医疗数字健康 20 · 06 Dynamo 4 · 07 Earth2Studio 7 · 08 Holoscan 16 · 09 NeMo 训练 46 · 10 NeMo 智能体 8 · 11 物理 AI 36 · 12 边缘/DPU 98 · 13 RAG 3 · 14 TAO 视觉 76 · 15 TileGym 7 · 16 VSS 15 · 17 桌面创作 ~11 · 18 BioNeMo ~19 · 19 NVFlare 9 · 20 技能治理 2。
- 与 DGX-SPARK-HUB 的 `SKILLS`（401 条）**数量一致、同源**，互为中英文索引。

## 六、NVIDIA-NIM-全量模型分析报告 —— 138 款 NIM 模型

- 10 大分类：LLM 32 · 多模态 VLM 18 · RAG 全链路 21 · 语音音频 15 · 图像生成编辑 9 · 视频媒体 10 · 生物医药 13 · 自动驾驶/物理 AI 9 · 安全合规 8 · 行业工具 3。
- **DGX Spark 单机（128GB）选型**：主 LLM 占 60% 内存 / 配套 25% / 系统预留 15%；组合示例：代码助手 deepseek-v4-flash(INT4) 或 glm-5.2(NVFP4) + OCR/embed/rerank ≈ 95GB；通用知识库 nemotron-3-super-120b ≈ 80GB；多模态 minimax-m3 + FLUX.1-schnell ≈ 90GB。
- **双机（256GB，TP=2）选型**：deepseek-v4-flash（NVFP4，1M 上下文，企业代码库首选）· glm-5.2（政企中文）· nemotron-3-ultra-550b（旗舰智能体）· kimi-k2.6（多模态内容生产）。
- **双机环境标准**：DGX OS 6.2+ / Driver 560+ / CUDA 12.8 / NCCL 2.29+ · RoCE v2 + ConnectX-7 200Gbps + GPUDirect RDMA · NIM 官方容器 + docker-compose · NVFP4 混合量化（注意力 BF16 + FFN NVFP4）+ FP8 KV 缓存 · vLLM 0.7+ 张量并行 · DCGM + Prometheus + Grafana 监控。
- 行业全链路方案：软件研发（OCR→embed→Milvus + deepseek-v4-flash + content-safety/gliner-pii）· 政企（paddleocr + bge-m3 + glm-5.2 + nemoguard）· 生物制药（AlphaFold2/OpenFold3 + molmim/rfdiffusion + diffdock/esm2）。

## 七、与后端规划的衔接要点（2026-10-10 上下文）

- 前端 `YYC3-CloudPivot-Intelli-Matrix`（本工作区）监控链路已就绪：WSMessage 六种消息、`api-config.ts` 端点配置、`useWebSocketData` 断线降级模拟，**仅缺后端采集与广播**。
- `YYC3-0379-World` FastAPI 网关已完成：chat/agent/a2a/mcp/websocket/knowledge_base/rag/proxy/video_tasks/admin/model_registry；`app/api/websocket.py` 已有 ConnectionManager + 上游池实时快照，可作监控 WS 扩展基础。
- 后端设计规划落地指导文档：`docs/16-CP-IM-后端设计规划/001-CP-IM-后端设计规划落地指导文档.md`。
- 入库资产口径：模型资产以 §三 的 2026-09-27 实测为准（48 条目 + 三节点 locs）；NIM 138 清单与 401 技能作为注册中心的**选型号引数据**；DGX Spark 单机/双机选型表直接映射 `infra_nodes` 的部署规划字段。
- 硬件登记：yyc3-22 = 本机 M4 Max 128G 主开发机；yyc3-45 = NAS 节点；DGX Spark 节点待命名（建议 dgx-spark-01/02）。
