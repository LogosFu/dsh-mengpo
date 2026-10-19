/**
 * 梦婆·记忆 —— 本地 JSON 数据源（D1/D2/D4）。
 * 直读 ~/.dsh-beta 与各项目 .dsh-project-memory/insights.json，
 * 不依赖 dsh-project-memory 插件内部 API。所有文件 IO 均为 async。
 */
import { promises as fs } from 'node:fs';
import { basename, join } from 'node:path';
import { homedir } from 'node:os';
import { randomBytes } from 'node:crypto';
import {
  EDITABLE_FIELDS,
  type GlobalMemory,
  type Insight,
  type InsightsFile,
  type MemoryDataSource,
  type ProjectDetail,
  type ProjectListResult,
  type ProjectSummary,
} from './types.js';

/** 业务错误：code 会经 Remote 通道原样传到 client。 */
export class MengpoError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly isDSHRemoteError = true;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'RemoteError';
    this.code = code;
    this.details = details;
  }
}

export interface ScannerOptions {
  /** DSH home，默认 ~/.dsh-beta */
  home?: string;
  /** 会话→项目映射目录，默认 <home>/storages/session_projcache/sessions */
  sessionsDir?: string;
  /** D1 降级扫描根（session 缓存格式不符时），默认 [~/code, ~] */
  fallbackRoots?: string[];
  /** 测试钩子：tmp 写完、最终 stat+rename 之前调用，用于模拟并发写冲突 */
  hooks?: {
    beforeCommit?: (insightsPath: string, attempt: number) => void | Promise<void>;
  };
}

const MEMORY_DIR = '.dsh-project-memory';
const INSIGHTS_FILE = 'insights.json';
const MAX_WRITE_ATTEMPTS = 3;

async function statOrNull(path: string) {
  try {
    return await fs.stat(path);
  } catch {
    return null;
  }
}

async function isDirectory(path: string): Promise<boolean> {
  const stat = await statOrNull(path);
  return stat !== null && stat.isDirectory();
}

interface InsightsRead {
  data: InsightsFile;
  mtimeMs: number;
}

function parseInsights(text: string): InsightsFile {
  const raw: unknown = JSON.parse(text);
  if (
    raw === null ||
    typeof raw !== 'object' ||
    typeof (raw as InsightsFile).version !== 'number' ||
    !Array.isArray((raw as InsightsFile).items)
  ) {
    throw new MengpoError('mengpo/corrupt', 'insights.json 结构不符：缺少 version 或 items 数组');
  }
  return raw as InsightsFile;
}

async function readInsightsFile(insightsPath: string): Promise<InsightsRead> {
  const stat = await statOrNull(insightsPath);
  if (stat === null || !stat.isFile()) {
    throw new MengpoError('mengpo/not-found', `记忆文件不存在: ${insightsPath}`, { path: insightsPath });
  }
  const text = await fs.readFile(insightsPath, 'utf8');
  try {
    return { data: parseInsights(text), mtimeMs: stat.mtimeMs };
  } catch (error) {
    if (error instanceof MengpoError) throw error;
    throw new MengpoError('mengpo/corrupt', `insights.json 解析失败: ${(error as Error).message}`, {
      path: insightsPath,
    });
  }
}

/** 项目名：路径末段（兼容中文/空格）。 */
export function projectNameOf(projectPath: string): string {
  const trimmed = projectPath.replace(/[/\\]+$/, '');
  return basename(trimmed) || trimmed;
}

export class LocalJsonDataSource implements MemoryDataSource {
  readonly home: string;
  readonly sessionsDir: string;
  readonly fallbackRoots: string[];
  private readonly hooks?: ScannerOptions['hooks'];
  /** 同一 insights.json 的写操作串行化（进程内） */
  private readonly writeChains = new Map<string, Promise<unknown>>();

  constructor(options: ScannerOptions = {}) {
    this.home = options.home ?? join(homedir(), '.dsh-beta');
    this.sessionsDir = options.sessionsDir ?? join(this.home, 'storages', 'session_projcache', 'sessions');
    this.fallbackRoots = options.fallbackRoots ?? [join(homedir(), 'code'), homedir()];
    this.hooks = options.hooks;
  }

  /** D1：distinct session cwd ∩ 存在 .dsh-project-memory；取不到 cwd 时降级目录扫描。 */
  async discoverProjectPaths(): Promise<{ paths: string[]; discovery: ProjectListResult['discovery'] }> {
    const cwds = await this.readSessionCwds();
    if (cwds.length > 0) {
      const paths = await this.filterMemoryDirs(cwds);
      return { paths: paths.sort(), discovery: 'session-projcache' };
    }
    const candidates: string[] = [];
    for (const root of this.fallbackRoots) {
      candidates.push(root);
      let entries;
      try {
        entries = await fs.readdir(root, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) candidates.push(join(root, entry.name));
      }
    }
    const paths = await this.filterMemoryDirs([...new Set(candidates)]);
    return { paths: paths.sort(), discovery: 'fallback-scan' };
  }

  /** 读 session 缓存里全部 distinct cwd；目录缺失/文件损坏都按「格式不符」处理。 */
  private async readSessionCwds(): Promise<string[]> {
    let files: string[];
    try {
      files = (await fs.readdir(this.sessionsDir)).filter((name) => name.endsWith('.json'));
    } catch {
      return [];
    }
    const cwds = new Set<string>();
    for (const name of files) {
      try {
        const raw: unknown = JSON.parse(await fs.readFile(join(this.sessionsDir, name), 'utf8'));
        const cwd = (raw as { record?: { identity?: { cwd?: unknown } } })?.record?.identity?.cwd;
        if (typeof cwd === 'string' && cwd.length > 0) cwds.add(cwd);
      } catch {
        // 单个会话文件损坏/格式变动：跳过，不拖垮发现流程
      }
    }
    return [...cwds];
  }

  private async filterMemoryDirs(candidates: string[]): Promise<string[]> {
    const results = await Promise.all(
      candidates.map(async (path) => ((await isDirectory(join(path, MEMORY_DIR))) ? path : null)),
    );
    return results.filter((path): path is string => path !== null);
  }

  private async summarize(projectPath: string): Promise<ProjectSummary> {
    const base: ProjectSummary = {
      path: projectPath,
      name: projectNameOf(projectPath),
      status: 'ok',
      insightCount: 0,
      latestUpdatedAt: null,
    };
    const insightsPath = join(projectPath, MEMORY_DIR, INSIGHTS_FILE);
    try {
      const { data } = await readInsightsFile(insightsPath);
      base.insightCount = data.items.length;
      base.latestUpdatedAt =
        data.items
          .map((item) => item.updatedAt ?? item.createdAt)
          .filter((value): value is string => typeof value === 'string')
          .sort()
          .at(-1) ?? null;
      return base;
    } catch (error) {
      if (error instanceof MengpoError && error.code === 'mengpo/corrupt') {
        return { ...base, status: 'corrupt', error: error.message };
      }
      if (error instanceof MengpoError && error.code === 'mengpo/not-found') {
        return { ...base, status: 'missing' };
      }
      return { ...base, status: 'corrupt', error: (error as Error).message };
    }
  }

  async listProjects(_cwd: string | null): Promise<ProjectListResult> {
    const { paths, discovery } = await this.discoverProjectPaths();
    const projects = await Promise.all(paths.map((path) => this.summarize(path)));
    return { projects, generatedAt: new Date().toISOString(), discovery };
  }

  async getGlobal(): Promise<GlobalMemory> {
    const path = join(this.home, 'AGENTS.md');
    try {
      return { path, content: await fs.readFile(path, 'utf8') };
    } catch {
      return { path, content: null };
    }
  }

  async getProject(path: string): Promise<ProjectDetail> {
    if (!(await isDirectory(join(path, MEMORY_DIR)))) {
      throw new MengpoError('mengpo/not-found', `项目没有记忆库: ${path}`, { path });
    }
    const summary = await this.summarize(path);
    if (summary.status !== 'ok') return { ...summary, insights: [] };
    const { data } = await readInsightsFile(join(path, MEMORY_DIR, INSIGHTS_FILE));
    return { ...summary, insights: data.items };
  }

  async updateInsight(projectPath: string, insight: Insight): Promise<Insight> {
    return this.mutate(projectPath, (data) => {
      const index = data.items.findIndex((item) => item.id === insight.id);
      if (index < 0) {
        throw new MengpoError('mengpo/not-found', `insight 不存在: ${insight.id}`, { id: insight.id });
      }
      const existing = data.items[index]!;
      // 保留 id/createdAt/hitCount/source 及其它未识别字段，只覆盖可编辑字段
      const merged: Insight = { ...existing };
      for (const field of EDITABLE_FIELDS) {
        if (field in insight) {
          (merged as Record<string, unknown>)[field] = (insight as Record<string, unknown>)[field];
        } else {
          delete (merged as Record<string, unknown>)[field];
        }
      }
      merged.id = existing.id;
      merged.createdAt = existing.createdAt;
      merged.hitCount = existing.hitCount;
      if (existing.source !== undefined) merged.source = existing.source;
      merged.updatedAt = new Date().toISOString();
      const items = [...data.items];
      items[index] = merged;
      return { next: { ...data, items }, value: merged };
    });
  }

  async deleteInsight(projectPath: string, insightId: string): Promise<void> {
    await this.mutate(projectPath, (data) => {
      const items = data.items.filter((item) => item.id !== insightId);
      if (items.length === data.items.length) {
        throw new MengpoError('mengpo/not-found', `insight 不存在: ${insightId}`, { id: insightId });
      }
      return { next: { ...data, items }, value: undefined };
    });
  }

  async setInsightDraft(projectPath: string, insightId: string, draft: boolean): Promise<Insight> {
    return this.mutate(projectPath, (data) => {
      const item = data.items.find((candidate) => candidate.id === insightId);
      if (item === undefined) {
        throw new MengpoError('mengpo/not-found', `insight 不存在: ${insightId}`, { id: insightId });
      }
      const merged: Insight = { ...item, draft, updatedAt: new Date().toISOString() };
      return {
        next: { ...data, items: data.items.map((candidate) => (candidate.id === insightId ? merged : candidate)) },
        value: merged,
      };
    });
  }

  /**
   * D2 写回策略：重读-合并-原子写。
   * 读 → 合并 → 写 tmp → 提交前重查 mtime，变了则丢弃 tmp 重新合并（最多 3 次）→ rename 覆盖。
   */
  private mutate<T>(
    projectPath: string,
    mutator: (data: InsightsFile) => { next: InsightsFile; value: T },
  ): Promise<T> {
    const insightsPath = join(projectPath, MEMORY_DIR, INSIGHTS_FILE);
    const previous = this.writeChains.get(insightsPath) ?? Promise.resolve();
    const run = previous.catch(() => undefined).then(() => this.mutateLocked(insightsPath, mutator));
    this.writeChains.set(
      insightsPath,
      run.catch(() => undefined),
    );
    return run;
  }

  private async mutateLocked<T>(
    insightsPath: string,
    mutator: (data: InsightsFile) => { next: InsightsFile; value: T },
  ): Promise<T> {
    let lastConflict: MengpoError | null = null;
    for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt++) {
      const { data, mtimeMs } = await readInsightsFile(insightsPath);
      const { next, value } = mutator(data);
      const tmpPath = `${insightsPath}.mengpo-${process.pid}-${randomBytes(6).toString('hex')}.tmp`;
      await fs.writeFile(tmpPath, JSON.stringify(next), 'utf8');
      try {
        await this.hooks?.beforeCommit?.(insightsPath, attempt);
        const current = await statOrNull(insightsPath);
        if (current === null || current.mtimeMs !== mtimeMs) {
          lastConflict = new MengpoError('mengpo/conflict', 'insights.json 在写入期间被外部修改，已重试', {
            path: insightsPath,
            attempt,
          });
          continue;
        }
        await fs.rename(tmpPath, insightsPath);
        return value;
      } finally {
        await fs.rm(tmpPath, { force: true }).catch(() => undefined);
      }
    }
    throw (
      lastConflict ??
      new MengpoError('mengpo/conflict', `insights.json 连续 ${MAX_WRITE_ATTEMPTS} 次写入冲突`, {
        path: insightsPath,
      })
    );
  }
}
