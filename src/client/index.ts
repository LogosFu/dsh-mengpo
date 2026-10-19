/**
 * 梦婆·记忆 —— Web client 插件入口（右侧边栏 tab「梦婆·记忆」）。
 *
 * 构建产物必须是 window.__ModuleLoader__.load 封装（见 tsup.config.ts banner/footer），
 * react 等 seed 词由 shell 模块表提供。
 */
import { clientContribution } from '../shared/remote.js';
import { NS, en, zh } from './locale.js';
import { createMemoryPage } from './MemoryPage.js';
import { STYLES } from './styles.js';

/** 本包在 tab 系统里的身份，同时是正文/标题注册的 key。 */
export const TAB_ID = 'dsh-mengpo';
/** 页类型 kind：按 kind 打开（无 patterns）。 */
export const TAB_KIND = 'mengpo-memory';

/** 必需的浏览器服务：keyed 席位、文案、tab 类型注册表、Remote 通道。 */
export const inject = ['slots', 'locale', 'sidebarRightTabs', 'remote'];

interface RemoteNamespace {
  listProjects(cwd: string | null, signal?: AbortSignal): Promise<RemoteResult<unknown>>;
  getGlobal(signal?: AbortSignal): Promise<RemoteResult<unknown>>;
  getProject(path: string, signal?: AbortSignal): Promise<RemoteResult<unknown>>;
  updateInsight(projectPath: string, insight: unknown, signal?: AbortSignal): Promise<RemoteResult<unknown>>;
  deleteInsight(projectPath: string, insightId: string, signal?: AbortSignal): Promise<RemoteResult<unknown>>;
  setInsightDraft(
    projectPath: string,
    insightId: string,
    draft: boolean,
    signal?: AbortSignal,
  ): Promise<RemoteResult<unknown>>;
  refresh(cwd: string | null, signal?: AbortSignal): Promise<RemoteResult<unknown>>;
}

export type RemoteResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: string; message: string; details?: Record<string, unknown> } };

export interface MengpoRemote {
  $mount(contribution: unknown): Promise<() => Promise<void>>;
  mengpo: RemoteNamespace;
}

interface ClientContext {
  effect(effect: () => unknown, label?: string): unknown;
  locale: {
    bind(ns: string): (key: string, params?: Record<string, string>) => string;
    register(ns: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): () => void;
  };
  sidebarRightTabs: {
    register(definition: {
      id: string;
      kind: string;
      priority?: 'builtin' | 'extension' | 'fallback';
      title: () => string;
      guide?: Array<{
        id: string;
        order?: number;
        title: () => string;
        description?: () => string;
      }>;
      keepMounted?: boolean;
    }): () => void;
  };
  slots: {
    inject(key: string, callback: () => unknown): unknown;
    register(options: { name: string; key: string; locale?: string }, component: unknown): () => void;
  };
  remote: MengpoRemote;
}

let stylesInstalled = false;

export async function apply(ctx: ClientContext): Promise<void> {
  const t = ctx.locale.bind(NS);

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-mengpo: dictionaries');

  if (!stylesInstalled) {
    stylesInstalled = true;
    const style = document.createElement('style');
    style.dataset.plugin = TAB_ID;
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  // 挂载自有 Remote namespace（fiber 级生命周期由 $mount 内部 effect 管理）
  await ctx.remote.$mount(clientContribution());

  ctx.effect(
    () =>
      ctx.sidebarRightTabs.register({
        id: TAB_ID,
        kind: TAB_KIND,
        priority: 'extension',
        title: () => t('type.label'),
        guide: [
          {
            id: 'memory',
            order: 40,
            title: () => t('guide.title'),
            description: () => t('guide.description'),
          },
        ],
        keepMounted: true,
      }),
    'dsh-mengpo: tab type',
  );

  const MemoryPage = createMemoryPage(ctx.remote.mengpo);
  ctx.effect(
    () =>
      ctx.slots.inject('sidebar.right.pane.tab', () =>
        ctx.slots.register({ name: 'sidebar.right.pane.tab', key: TAB_ID, locale: NS }, MemoryPage),
      ),
    'dsh-mengpo: tab body',
  );
}
