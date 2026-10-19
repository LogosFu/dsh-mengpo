import { type GlobalMemory, type Insight, type MemoryDataSource, type ProjectDetail, type ProjectListResult } from './types.js';
/** 业务错误：code 会经 Remote 通道原样传到 client。 */
export declare class MengpoError extends Error {
    readonly code: string;
    readonly details?: Record<string, unknown>;
    readonly isDSHRemoteError = true;
    constructor(code: string, message: string, details?: Record<string, unknown>);
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
/** 项目名：路径末段（兼容中文/空格）。 */
export declare function projectNameOf(projectPath: string): string;
export declare class LocalJsonDataSource implements MemoryDataSource {
    readonly home: string;
    readonly sessionsDir: string;
    readonly fallbackRoots: string[];
    private readonly hooks?;
    /** 同一 insights.json 的写操作串行化（进程内） */
    private readonly writeChains;
    constructor(options?: ScannerOptions);
    /** D1：distinct session cwd ∩ 存在 .dsh-project-memory；取不到 cwd 时降级目录扫描。 */
    discoverProjectPaths(): Promise<{
        paths: string[];
        discovery: ProjectListResult['discovery'];
    }>;
    /** 读 session 缓存里全部 distinct cwd；目录缺失/文件损坏都按「格式不符」处理。 */
    private readSessionCwds;
    private filterMemoryDirs;
    private summarize;
    listProjects(_cwd: string | null): Promise<ProjectListResult>;
    getGlobal(): Promise<GlobalMemory>;
    getProject(path: string): Promise<ProjectDetail>;
    updateInsight(projectPath: string, insight: Insight): Promise<Insight>;
    deleteInsight(projectPath: string, insightId: string): Promise<void>;
    setInsightDraft(projectPath: string, insightId: string, draft: boolean): Promise<Insight>;
    /**
     * D2 写回策略：重读-合并-原子写。
     * 读 → 合并 → 写 tmp → 提交前重查 mtime，变了则丢弃 tmp 重新合并（最多 3 次）→ rename 覆盖。
     */
    private mutate;
    private mutateLocked;
}
