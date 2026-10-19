# 梦婆·记忆（dsh-mengpo）

DSH（DeepSeek Harness）桌面端的记忆可视化/管理插件。安装后在 Web GUI 右侧边栏出现「梦婆·记忆」tab：

- **工作区视图**：全局记忆（`~/.dsh-beta/AGENTS.md`）+ 所有项目记忆库汇总（项目名、路径、insight 数、最近更新时间）。
- **项目视图**：当前会话 cwd 命中某项目记忆库时自动直进本项目 insight 列表（按 kind 分组：lesson/decision/procedure/experience，标注 scope、命中数；禁用项置灰）。
- 对 insight 支持：查看全文、编辑（title/kind/scope/pattern/fix/files/trigger）、删除、禁用/启用（禁用 = `draft: true`）。

## 原理

- host 侧 cordis 插件直读 `~/.dsh-beta` 与各项目 `.dsh-project-memory/insights.json`（version:2），不依赖 dsh-project-memory 插件内部 API。
- 项目发现（D1）：读 `~/.dsh-beta/storages/session_projcache/sessions/*.json` 的 `record.identity.cwd`，取 distinct 后过滤出存在 `.dsh-project-memory/` 的目录；格式不符时降级为扫描 `~/code` 与 `~` 的直接子目录。
- client ↔ host 走 Typert Remote 通道（namespace `mengpo`）：host 用 `ctx.typert.register()` 手写描述符注册，client 用 `ctx.remote.$mount()` 挂载后调用。
- 写回策略（D2）：重读-合并-原子写（tmp + rename；提交前复查 mtime，变了重新合并，最多重试 3 次）。编辑保留 id/createdAt/hitCount/source，更新 updatedAt。

## 安装

```bash
# 构建（必须，lib/ 是运行时产物）
cd /Users/shiwei/code/mengpo
pnpm install && pnpm build

# 安装到 DSH 桌面 profile（三选一）
# 1. 桌面 UI：侧边栏「插件」→ 添加插件 → 安装第三方插件 → 输入 /Users/shiwei/code/mengpo
# 2. CLI：dsh plugin --profile desktop add link:/Users/shiwei/code/mengpo
# 3. Creator 模式 agent 的 plugin_manager 工具 install_bundle
```

本地目录以 `link:` 方式安装（live symlink）。改代码后重新 `pnpm build`，HMR 或重启 DSH 生效。

## 开发

```bash
pnpm build      # 产出 lib/index.js（host）、lib/client.js（web）、lib/types/
pnpm test       # vitest：scanner 项目发现、insights 读/写/合并/原子写回（含 mtime 冲突重试）
pnpm spike      # 模拟 ModuleLoader/cordis 环境加载构建产物，验证 tab 注册与 Remote 描述符
pnpm smoke      # 对真实 ~/.dsh-beta 数据做只读聚合冒烟（项目列表 + insight 计数）
pnpm typecheck
```

## 卸载

在「插件」页停用/卸载即可，无残留进程；不会修改 `~/.dsh-beta` 下任何文件（本插件只读该目录，写操作仅发生在各项目自己的 `.dsh-project-memory/insights.json`）。
