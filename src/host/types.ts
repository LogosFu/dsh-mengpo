/**
 * 梦婆·记忆 —— 线路上共享的数据类型。
 * host 与 client 都从这里 import（client 构建时会内联，运行时零依赖）。
 */

export type InsightKind = 'lesson' | 'decision' | 'procedure' | 'experience' | (string & {});

export type InsightScope = 'project' | 'global' | 'task' | (string & {});

/** insights.json (version:2) 中的一条记忆。未识别字段原样保留（读写往返不丢字段）。 */
export interface Insight {
  id: string;
  kind: InsightKind;
  scope: InsightScope;
  title: string;
  source?: string;
  draft?: boolean;
  confidence?: number;
  hitCount?: number;
  createdAt?: string;
  updatedAt?: string;
  lastHitAt?: string;
  pattern?: string;
  fix?: string;
  files?: string[];
  trigger?: string;
  [extra: string]: unknown;
}

export interface InsightsFile {
  version: number;
  migratedAt: string | null;
  items: Insight[];
  [extra: string]: unknown;
}

export type ProjectStatus = 'ok' | 'corrupt' | 'missing';

export interface ProjectSummary {
  /** 项目绝对路径（可能含中文/空格） */
  path: string;
  /** 目录名，用于展示 */
  name: string;
  status: ProjectStatus;
  insightCount: number;
  /** items 中最大的 updatedAt/createdAt；无则 null */
  latestUpdatedAt: string | null;
  /** status === 'corrupt' 时的解析错误摘要 */
  error?: string;
}

export interface ProjectDetail extends ProjectSummary {
  insights: Insight[];
}

export interface GlobalMemory {
  /** ~/.dsh-beta/AGENTS.md */
  path: string;
  /** 文件不存在时为 null */
  content: string | null;
}

export interface ProjectListResult {
  projects: ProjectSummary[];
  generatedAt: string;
  /** 项目发现走了哪条路：session 缓存 | 降级目录扫描 */
  discovery: 'session-projcache' | 'fallback-scan';
}

/** D5 扩展位：数据源抽象。V1 唯一实现是 LocalJsonDataSource（host/scanner.ts）。 */
export interface MemoryDataSource {
  listProjects(cwd: string | null): Promise<ProjectListResult>;
  getGlobal(): Promise<GlobalMemory>;
  getProject(path: string): Promise<ProjectDetail>;
  updateInsight(projectPath: string, insight: Insight): Promise<Insight>;
  deleteInsight(projectPath: string, insightId: string): Promise<void>;
  setInsightDraft(projectPath: string, insightId: string, draft: boolean): Promise<Insight>;
}

/** 编辑时允许覆盖的字段；id/createdAt/hitCount/source 由实现保留。 */
export const EDITABLE_FIELDS = [
  'title',
  'kind',
  'scope',
  'pattern',
  'fix',
  'files',
  'trigger',
  'confidence',
] as const;
