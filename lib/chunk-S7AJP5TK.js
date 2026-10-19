import {
  EDITABLE_FIELDS
} from "./chunk-YSAPYWNP.js";

// src/host/scanner.ts
import { promises as fs } from "fs";
import { basename, join } from "path";
import { homedir } from "os";
import { randomBytes } from "crypto";
var MengpoError = class extends Error {
  code;
  details;
  isDSHRemoteError = true;
  constructor(code, message, details) {
    super(message);
    this.name = "RemoteError";
    this.code = code;
    this.details = details;
  }
};
var MEMORY_DIR = ".dsh-project-memory";
var INSIGHTS_FILE = "insights.json";
var MAX_WRITE_ATTEMPTS = 3;
async function statOrNull(path) {
  try {
    return await fs.stat(path);
  } catch {
    return null;
  }
}
async function isDirectory(path) {
  const stat = await statOrNull(path);
  return stat !== null && stat.isDirectory();
}
function parseInsights(text) {
  const raw = JSON.parse(text);
  if (raw === null || typeof raw !== "object" || typeof raw.version !== "number" || !Array.isArray(raw.items)) {
    throw new MengpoError("mengpo/corrupt", "insights.json \u7ED3\u6784\u4E0D\u7B26\uFF1A\u7F3A\u5C11 version \u6216 items \u6570\u7EC4");
  }
  return raw;
}
async function readInsightsFile(insightsPath) {
  const stat = await statOrNull(insightsPath);
  if (stat === null || !stat.isFile()) {
    throw new MengpoError("mengpo/not-found", `\u8BB0\u5FC6\u6587\u4EF6\u4E0D\u5B58\u5728: ${insightsPath}`, { path: insightsPath });
  }
  const text = await fs.readFile(insightsPath, "utf8");
  try {
    return { data: parseInsights(text), mtimeMs: stat.mtimeMs };
  } catch (error) {
    if (error instanceof MengpoError) throw error;
    throw new MengpoError("mengpo/corrupt", `insights.json \u89E3\u6790\u5931\u8D25: ${error.message}`, {
      path: insightsPath
    });
  }
}
function projectNameOf(projectPath) {
  const trimmed = projectPath.replace(/[/\\]+$/, "");
  return basename(trimmed) || trimmed;
}
var LocalJsonDataSource = class {
  home;
  sessionsDir;
  fallbackRoots;
  hooks;
  /** 同一 insights.json 的写操作串行化（进程内） */
  writeChains = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    this.home = options.home ?? join(homedir(), ".dsh-beta");
    this.sessionsDir = options.sessionsDir ?? join(this.home, "storages", "session_projcache", "sessions");
    this.fallbackRoots = options.fallbackRoots ?? [join(homedir(), "code"), homedir()];
    this.hooks = options.hooks;
  }
  /** D1：distinct session cwd ∩ 存在 .dsh-project-memory；取不到 cwd 时降级目录扫描。 */
  async discoverProjectPaths() {
    const cwds = await this.readSessionCwds();
    if (cwds.length > 0) {
      const paths2 = await this.filterMemoryDirs(cwds);
      return { paths: paths2.sort(), discovery: "session-projcache" };
    }
    const candidates = [];
    for (const root of this.fallbackRoots) {
      candidates.push(root);
      let entries;
      try {
        entries = await fs.readdir(root, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith(".")) candidates.push(join(root, entry.name));
      }
    }
    const paths = await this.filterMemoryDirs([...new Set(candidates)]);
    return { paths: paths.sort(), discovery: "fallback-scan" };
  }
  /** 读 session 缓存里全部 distinct cwd；目录缺失/文件损坏都按「格式不符」处理。 */
  async readSessionCwds() {
    let files;
    try {
      files = (await fs.readdir(this.sessionsDir)).filter((name) => name.endsWith(".json"));
    } catch {
      return [];
    }
    const cwds = /* @__PURE__ */ new Set();
    for (const name of files) {
      try {
        const raw = JSON.parse(await fs.readFile(join(this.sessionsDir, name), "utf8"));
        const cwd = raw?.record?.identity?.cwd;
        if (typeof cwd === "string" && cwd.length > 0) cwds.add(cwd);
      } catch {
      }
    }
    return [...cwds];
  }
  async filterMemoryDirs(candidates) {
    const results = await Promise.all(
      candidates.map(async (path) => await isDirectory(join(path, MEMORY_DIR)) ? path : null)
    );
    return results.filter((path) => path !== null);
  }
  async summarize(projectPath) {
    const base = {
      path: projectPath,
      name: projectNameOf(projectPath),
      status: "ok",
      insightCount: 0,
      latestUpdatedAt: null
    };
    const insightsPath = join(projectPath, MEMORY_DIR, INSIGHTS_FILE);
    try {
      const { data } = await readInsightsFile(insightsPath);
      base.insightCount = data.items.length;
      base.latestUpdatedAt = data.items.map((item) => item.updatedAt ?? item.createdAt).filter((value) => typeof value === "string").sort().at(-1) ?? null;
      return base;
    } catch (error) {
      if (error instanceof MengpoError && error.code === "mengpo/corrupt") {
        return { ...base, status: "corrupt", error: error.message };
      }
      if (error instanceof MengpoError && error.code === "mengpo/not-found") {
        return { ...base, status: "missing" };
      }
      return { ...base, status: "corrupt", error: error.message };
    }
  }
  async listProjects(_cwd) {
    const { paths, discovery } = await this.discoverProjectPaths();
    const projects = await Promise.all(paths.map((path) => this.summarize(path)));
    return { projects, generatedAt: (/* @__PURE__ */ new Date()).toISOString(), discovery };
  }
  async getGlobal() {
    const path = join(this.home, "AGENTS.md");
    try {
      return { path, content: await fs.readFile(path, "utf8") };
    } catch {
      return { path, content: null };
    }
  }
  async getProject(path) {
    if (!await isDirectory(join(path, MEMORY_DIR))) {
      throw new MengpoError("mengpo/not-found", `\u9879\u76EE\u6CA1\u6709\u8BB0\u5FC6\u5E93: ${path}`, { path });
    }
    const summary = await this.summarize(path);
    if (summary.status !== "ok") return { ...summary, insights: [] };
    const { data } = await readInsightsFile(join(path, MEMORY_DIR, INSIGHTS_FILE));
    return { ...summary, insights: data.items };
  }
  async updateInsight(projectPath, insight) {
    return this.mutate(projectPath, (data) => {
      const index = data.items.findIndex((item) => item.id === insight.id);
      if (index < 0) {
        throw new MengpoError("mengpo/not-found", `insight \u4E0D\u5B58\u5728: ${insight.id}`, { id: insight.id });
      }
      const existing = data.items[index];
      const merged = { ...existing };
      for (const field of EDITABLE_FIELDS) {
        if (field in insight) {
          merged[field] = insight[field];
        } else {
          delete merged[field];
        }
      }
      merged.id = existing.id;
      merged.createdAt = existing.createdAt;
      merged.hitCount = existing.hitCount;
      if (existing.source !== void 0) merged.source = existing.source;
      merged.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      const items = [...data.items];
      items[index] = merged;
      return { next: { ...data, items }, value: merged };
    });
  }
  async deleteInsight(projectPath, insightId) {
    await this.mutate(projectPath, (data) => {
      const items = data.items.filter((item) => item.id !== insightId);
      if (items.length === data.items.length) {
        throw new MengpoError("mengpo/not-found", `insight \u4E0D\u5B58\u5728: ${insightId}`, { id: insightId });
      }
      return { next: { ...data, items }, value: void 0 };
    });
  }
  async setInsightDraft(projectPath, insightId, draft) {
    return this.mutate(projectPath, (data) => {
      const item = data.items.find((candidate) => candidate.id === insightId);
      if (item === void 0) {
        throw new MengpoError("mengpo/not-found", `insight \u4E0D\u5B58\u5728: ${insightId}`, { id: insightId });
      }
      const merged = { ...item, draft, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      return {
        next: { ...data, items: data.items.map((candidate) => candidate.id === insightId ? merged : candidate) },
        value: merged
      };
    });
  }
  /**
   * D2 写回策略：重读-合并-原子写。
   * 读 → 合并 → 写 tmp → 提交前重查 mtime，变了则丢弃 tmp 重新合并（最多 3 次）→ rename 覆盖。
   */
  mutate(projectPath, mutator) {
    const insightsPath = join(projectPath, MEMORY_DIR, INSIGHTS_FILE);
    const previous = this.writeChains.get(insightsPath) ?? Promise.resolve();
    const run = previous.catch(() => void 0).then(() => this.mutateLocked(insightsPath, mutator));
    this.writeChains.set(
      insightsPath,
      run.catch(() => void 0)
    );
    return run;
  }
  async mutateLocked(insightsPath, mutator) {
    let lastConflict = null;
    for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt++) {
      const { data, mtimeMs } = await readInsightsFile(insightsPath);
      const { next, value } = mutator(data);
      const tmpPath = `${insightsPath}.mengpo-${process.pid}-${randomBytes(6).toString("hex")}.tmp`;
      await fs.writeFile(tmpPath, JSON.stringify(next), "utf8");
      try {
        await this.hooks?.beforeCommit?.(insightsPath, attempt);
        const current = await statOrNull(insightsPath);
        if (current === null || current.mtimeMs !== mtimeMs) {
          lastConflict = new MengpoError("mengpo/conflict", "insights.json \u5728\u5199\u5165\u671F\u95F4\u88AB\u5916\u90E8\u4FEE\u6539\uFF0C\u5DF2\u91CD\u8BD5", {
            path: insightsPath,
            attempt
          });
          continue;
        }
        await fs.rename(tmpPath, insightsPath);
        return value;
      } finally {
        await fs.rm(tmpPath, { force: true }).catch(() => void 0);
      }
    }
    throw lastConflict ?? new MengpoError("mengpo/conflict", `insights.json \u8FDE\u7EED ${MAX_WRITE_ATTEMPTS} \u6B21\u5199\u5165\u51B2\u7A81`, {
      path: insightsPath
    });
  }
};

export {
  MengpoError,
  projectNameOf,
  LocalJsonDataSource
};
