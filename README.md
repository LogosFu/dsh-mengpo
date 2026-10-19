<div align="center">

<img src="icon.svg" alt="梦婆·记忆" width="112" height="112" />

# 梦婆·记忆 · dsh-mengpo

**DSH（DeepSeek Harness）本地记忆的可视化管理插件** —— 在「插件」页里查看、编辑、删除、禁用你的全局记忆与每一个项目的记忆。

[![License](https://img.shields.io/badge/license-MIT-6D4BFF.svg)](#license)
[![DSH](https://img.shields.io/badge/DSH-2.0.18--beta.1-E040FB.svg)](https://github.com/deepseek-ai/deepseek-harness)

</div>

---

## 它解决什么问题

DSH 的记忆默认只有「写入」没有「界面」：

- 全局偏好写在 `~/.dsh-beta/AGENTS.md`；
- 每个项目的经验/决策写在 `<项目>/.dsh-project-memory/insights.json`。

agent 一直在往里沉淀（`save_lesson` / `remember` / 自动注入），但你**看不到自己攒了什么**、更删不掉过时的条目。梦婆把这个黑盒变成可浏览、可编辑的界面。

## 功能

- **全局记忆**：直接展示 `AGENTS.md` 内容（只读，避免误改共享文件）。
- **项目记忆库**：自动发现所有带 `.dsh-project-memory/` 的项目，显示 insight 数、最近更新时间；有目录无数据的项目标「无记忆文件」，坏 JSON 标「数据损坏」而不拖垮整页。
- **Insight 管理**：按 kind（lesson / decision / procedure / experience）分组；点开抽屉可
  - **编辑**：标题、类型、范围、问题模式、解决方案、关联文件、触发条件
  - **禁用 / 启用**：等价于 `draft: true|false`，禁用后 agent 不再把它当作有效记忆
  - **删除**：二次确认，永久移除
- **中文 / English** 双语文案。

## 安装

```bash
# 从 NPM 安装（出现在 DSH 插件中心时用这个）
dsh plugin --profile <your-profile> add dsh-mengpo

# 或直接从本仓库源码安装
dsh plugin --profile <your-profile> add github:LogosFu/dsh-mengpo
```

> 桌面端的 profile 由 Electron 独占管理，CLI 会拒绝写入；请在界面里装：
> 侧边栏 **插件 → 添加插件 → 安装第三方插件**，填入 `dsh-mengpo`（或 GitHub 地址 / 本地目录）。

装完重启 DSH，进入 **插件** 页 → 顶部 **内置插件配置** → 点「**梦婆·记忆**」卡片。

## 使用

1. 左侧栏 **插件** → **内置插件配置** → **梦婆·记忆**
2. 「工作区」视图看全局记忆 + 全部项目记忆库列表
3. 点任意项目 → 看该项目的 insights（按类型分组）
4. 点任意一条 insight → 右侧抽屉 → 底部「编辑 / 禁用 / 删除」

## 数据与权限

| 项 | 说明 |
|---|---|
| 读取 | `~/.dsh-beta/AGENTS.md`、`~/.dsh-beta/storages/session_projcache/sessions/*.json`（只取 `record.identity.cwd` 用于项目发现）、各项目 `.dsh-project-memory/insights.json` |
| 写入 | **仅**各项目自己的 `.dsh-project-memory/insights.json`（编辑/删除/禁用时） |
| 不写入 | `~/.dsh-beta` 下任何文件；不联网；不采集遥测 |
| 写回策略 | 重读-合并-原子写（tmp + rename，提交前复查 mtime，冲突自动重试最多 3 次），保留 id/createdAt/hitCount/source |

## 兼容性

- 已验证：DSH Desktop **2.0.18-beta.1**（macOS，`desktop` profile）
- 依赖公开插件机制：`plugins.item` 设置卡 slot + 手写 Typert Remote 描述符（不引入 `@deepseek-ai/*` 运行时依赖）
- Node ≥ 22（宿主 runtime 提供）

## 开发

```bash
pnpm install
pnpm build      # lib/index.js（host）、lib/client.js（web）、lib/types/
pnpm test       # vitest：项目发现、insights 读写、原子写回与 mtime 冲突重试
pnpm spike      # 模拟 ModuleLoader/cordis 加载构建产物（33 项断言）
pnpm smoke      # 对真实 ~/.dsh-beta 只读冒烟：项目列表 + insight 计数
pnpm typecheck
```

架构：host 侧 cordis 插件直读 JSON 文件并经 `ctx.typert.register()` 暴露 `mengpo` namespace；client 侧用 `ctx.remote.$mount()` 挂载后在「插件」页注册卡片。详见 [docs/design.md](docs/design.md)。

## 卸载

「插件」页里停用或卸载即可，无后台进程、无残留文件。你的记忆数据不受影响（插件只读写既有 JSON）。

## License

[MIT](LICENSE)
