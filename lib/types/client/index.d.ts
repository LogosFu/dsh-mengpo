/** 本包在插件页的条目 id。 */
export declare const TAB_ID = "dsh-mengpo";
/** 必需的浏览器服务：keyed 席位、文案、Remote 通道。 */
export declare const inject: string[];
interface RemoteNamespace {
    listProjects(cwd: string | null, signal?: AbortSignal): Promise<RemoteResult<unknown>>;
    getGlobal(signal?: AbortSignal): Promise<RemoteResult<unknown>>;
    getProject(path: string, signal?: AbortSignal): Promise<RemoteResult<unknown>>;
    updateInsight(projectPath: string, insight: unknown, signal?: AbortSignal): Promise<RemoteResult<unknown>>;
    deleteInsight(projectPath: string, insightId: string, signal?: AbortSignal): Promise<RemoteResult<unknown>>;
    setInsightDraft(projectPath: string, insightId: string, draft: boolean, signal?: AbortSignal): Promise<RemoteResult<unknown>>;
    refresh(cwd: string | null, signal?: AbortSignal): Promise<RemoteResult<unknown>>;
}
export type RemoteResult<T> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
};
export interface MengpoRemote {
    $mount(contribution: unknown): Promise<() => Promise<void>>;
    mengpo: RemoteNamespace;
}
interface SlotEntryOptions {
    name: string;
    /** 列表 slot 的条目 id（plugins.item 用它区分卡片）。 */
    id: string;
    order?: number;
    label?: () => string;
    locale?: string;
    /** 卡片与详情页共享的数据面。 */
    inject?: () => Record<string, unknown>;
}
interface ClientContext {
    effect(effect: () => unknown, label?: string): unknown;
    inject(services: string[], callback: (ctx: ClientContext) => void): unknown;
    locale: {
        bind(ns: string): (key: string, params?: Record<string, string>) => string;
        register(ns: string, dicts: {
            zh: Record<string, string>;
            en: Record<string, string>;
        }): () => void;
    };
    slots: {
        inject(key: string, callback: () => unknown): unknown;
        register(options: SlotEntryOptions, component: unknown): () => void;
        entries(name: string): unknown[];
    };
    remote: MengpoRemote;
}
export declare function apply(ctx: ClientContext): void;
export {};
