# 梦婆（DSH 记忆管理）插件 设计方案

日期：2026-10-19
状态：已拍板，待开工
命名：中文名「梦婆」，npm 包名 `dsh-mengpo`（拼音，包名不可含中文）；侧边栏入口显示「梦婆·记忆」

## 背景现状

DSH 桌面端没有记忆管理 GUI（已验证：`dsh-web-frontend` 包内无 memory 路由，Hermes 时代的 /memory 页未迁移）。记忆实际分散在：

| 层 | 位置 | 格式 |
|---|---|---|
| 全局记忆 | `~/.dsh-beta/AGENTS.md` | Markdown |
| 项目 overlay | `<repo>/AGENTS.local.md` | Markdown |
| 项目记忆库 | `<repo>/.dsh-project-memory/` | `insights.json`（version:2, items[] 含 id/kind/scope/title/pattern/fix/hitCount）、`shards/*.json`（文档/符号索引）、`tasks.json`、`format.json`（layout: sharded） |
| Hindsight | 云端/本地 daemon | 未配置（无 token，401），V1 不纳入 |

已确认的事实：
- 当前机器 12 个项目有 `.dsh-project-memory`，34 条 insights 分布在 5 个仓库。
- DSH 插件体系 = cordis 组合包（bundle），通过侧边栏「插件」页或 `dsh plugin add` 从 npm/git/本地目录安装，支持 HMR。
- 侧边栏页本身就是 client 插件贡献的（`dsh-client-ui-plugin-manager` 等），第三方组合包可携带 client UI；client 插件改动在 `pnpm run dev:web` 下热更新。
- 插件可注册自己的配置页（「注册了配置页的插件在它自己的页面上编辑」——plugin-manager README）。

## 目标约束

- 工作区（全局）视图：看到全局记忆（AGENTS.md）+ 所有项目的记忆汇总列表。
- 项目视图：在某个项目（文件夹）会话中，看到本项目的记忆。
- V1 纯本地、只读为主，不碰 Hindsight。
- 不修改 DSH 本体，全部走公开插件机制，可随「插件」页启停/卸载。

## 总体设计

```
┌─ DSH 插件组合包 dsh-memory-viewer ─────────────────┐
│                                                    │
│  host 侧（cordis 插件，Node 环境）                  │
│   ├─ memory-scanner: 发现项目（扫描根目录下含       │
│   │   .dsh-project-memory/ 的文件夹）+ 读取各库     │
│   │   insights.json / tasks.json / stats           │
│   ├─ global-reader: 读 ~/.dsh-beta/AGENTS.md       │
│   │   与项目 AGENTS.local.md                       │
│   └─ JSON-RPC 服务方法: memory.listProjects /      │
│       memory.getProject / memory.getGlobal         │
│                                                    │
│  client 侧（Web client 插件，侧边栏「记忆」页）      │
│   ├─ 工作区模式: 全局记忆卡片 + 项目列表（名称/     │
│   │   路径/insight 数/最近更新），点进项目详情      │
│   ├─ 项目模式: 当前 cwd 匹配到项目库时直接展示      │
│   │   本项目 insights（分组: lesson/decision/       │
│   │   procedure/experience，标注 scope/命中数）     │
│   └─ 详情抽屉: pattern/fix/files/trigger 全文       │
└────────────────────────────────────────────────────┘
```

关键机制：client 通过现有 `api-remotes`/JSON-RPC 通道调 host 侧方法；host 侧直读 JSON 文件（`insights.json` 格式 version:2 稳定），不依赖 dsh-project-memory 插件内部 API。

## 改动清单（新建插件仓库，精确到文件）

- `package.json` — 声明 `dsh.profile.bundles`、展示 meta（icon/标题中英文）
- `cordis.bundle.yml`（或 bundle patch）— 插件行声明
- `src/host/index.ts` — cordis 插件入口，注册 JSON-RPC 方法
- `src/host/scanner.ts` — 项目发现 + 记忆读取（fs 直读）
- `src/client/index.ts` — client 插件入口，注册侧边栏页
- `src/client/MemoryPage.tsx` — 页面组件（列表+详情）
- `src/client/locale.ts` — 中英文 meta
- `README.md` — 安装说明（`dsh plugin add <本地路径>`）

## 验证方案

1. 本地安装：`dsh plugin add <插件目录>`（link: 方式），侧边栏出现「记忆」入口。
2. 工作区视图断言：≥12 个项目卡片，insight 计数与 `insights.json` 实测一致（34 条）。
3. 项目视图断言：在 charon 目录开会话 → 页面直接展示 11 条项目 insight。
4. 全局视图断言：AGENTS.md 内容渲染正确，修改后刷新生效。
5. 卸载后侧边栏入口消失，无残留进程。

## 决策点

| # | 决策 | 选项 | 推荐 |
|---|---|---|---|
| D1 | 项目发现方式 | A. 扫描可配置根目录（默认 ~/code + ~）<br>B. 被动注册（会话访问过才登记）<br>C. 读 DSH 内部 session_projcache | **A**：主动、即装即见全量；B 冷启动为空；C 依赖内部格式易碎 |
| D2 | V1 读写范围 | A. 纯只读<br>B. 只读 + 删除/禁用 insight | **A**：写回 insights.json 有并发风险（agent 会话也在写），V1 只做查看，管理动作仍走对话 |
| D3 | 页面挂载形态 | A. 侧边栏独立「记忆」页<br>B. 设置页分区 | **A**：与文件/插件平级，符合「工作区上面可以看到」的诉求 |
| D4 | 数据读取路径 | A. host 插件直读 JSON 文件<br>B. 调用 dsh-project-memory 插件内部 API | **A**：无耦合、格式已实测（version:2）；B 依赖未公开 API |
| D5 | Hindsight 是否纳入 | A. V1 不含，留扩展位<br>B. V1 即接入 | **A**：当前未配置（401），且语义层与本地库不同，避免 V1 范围膨胀 |

## 已拍板决策（2026-10-19，不得偏离）

| # | 结论 | 备注 |
|---|---|---|
| D1 | **读 DSH session_projcache** | 已验证可行：`~/.dsh-beta/storages/session_projcache/sessions/*.json` 共 109 个，每条 `record.identity.cwd` 给出项目绝对路径；取 distinct cwd ∩ 存在 `.dsh-project-memory/` 即项目列表。风险（内部格式）由 spike 第一步再验证，格式变动时降级为扫描根目录 |
| D2 | **只读 + 删除/禁用 + 全文编辑** | 写回策略：重读-合并-原子写（tmp+rename）；编辑覆盖 title/pattern/fix/files/trigger；禁用=draft 标记 |
| D3 | 侧边栏独立「记忆」页 | |
| D4 | host 直读 JSON 文件 | |
| D5 | V1 不含 Hindsight，留扩展位 | |

## 风险取舍

- **第三方 client 插件注册侧边栏页的公开性**：证据充分（插件页本身即 client 插件、市场机制存在、client HMR 接收器在跑），但打包版未附 cookbook 文档——开工第一步先做一个最小 spike 插件验证侧边栏注册，失败则降级为 D3-B 设置页或独立 localhost 页面。
- **insights.json 并发写**：只读规避；若 D2 未来升级写操作，需文件锁或走 agent 工具转写。
- **项目路径含中文/空格**：扫描与匹配一律用绝对路径，不做字符串假设（已有「能源」「农业」等目录实测）。
