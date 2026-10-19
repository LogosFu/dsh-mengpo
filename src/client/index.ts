/**
 * 梦婆·记忆 —— Web client 插件入口。
 *
 * 挂载点：「插件」页（左侧栏 插件按钮）里的配置卡片。
 * 通过 plugins.item 列表 slot 注册（与官方 终端 / 网页搜索 配置页同一机制），
 * 卡片详情页渲染完整记忆管理界面（全局记忆 + 各项目记忆 + 编辑/删除/禁用）。
 *
 * 构建产物必须是 window.__ModuleLoader__.load 封装（见 tsup.config.ts banner/footer），
 * react 等 seed 词由 shell 模块表提供。
 */
import { createElement } from 'react';
import { clientContribution } from '../shared/remote.js';
import { NS, zh, en } from './locale.js';
import { createMemoryPage } from './MemoryPage.js';
import { STYLES } from './styles.js';

/** 本包在插件页的条目 id。 */
export const TAB_ID = 'dsh-mengpo';

/** 必需的浏览器服务：keyed 席位、文案、Remote 通道。 */
export const inject = ['slots', 'locale', 'remote'];

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
    register(ns: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): () => void;
  };
  slots: {
    inject(key: string, callback: () => unknown): unknown;
    register(options: SlotEntryOptions, component: unknown): () => void;
  };
  remote: MengpoRemote;
}

let stylesInstalled = false;

function installStyles(): void {
  if (stylesInstalled) return;
  stylesInstalled = true;
  const style = document.createElement('style');
  style.dataset.plugin = TAB_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}

/** 卡片组件：summary 视图给插件页一行描述，page 视图渲染完整记忆管理页。 */
function createCard(Page: unknown) {
  return function MengpoCard(props: {
    view?: 'summary' | 'page';
    t?: (key: string, params?: Record<string, string>) => string;
  }) {
    const t = props.t ?? ((key: string) => key);
    if (props.view === 'summary') return t('summary');
    return createElement(Page as never, { t } as never);
  };
}

export function apply(ctx: ClientContext): void {
  console.error('[dsh-mengpo] apply:start');
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-mengpo: dictionaries');

  installStyles();

  // 挂载自有 Remote namespace。apply 必须同步返回（客户端 Loader 以同步审计启动条目），
  // 异步副作用放进 effect；失败时把真实原因打到 console（桌面端会写进宿主日志）。
  ctx.effect(() => {
    let dispose: (() => Promise<void>) | undefined;
    let disposed = false;
    ctx.remote
      .$mount(clientContribution())
      .then((mounted) => {
        if (disposed) {
          void mounted().catch(() => undefined);
          return;
        }
        dispose = mounted;
        console.error('[dsh-mengpo] remote $mount resolved');
      })
      .catch((error: unknown) => {
        const detail = error instanceof Error ? error.stack ?? error.message : String(error);
        console.error(`[dsh-mengpo] remote $mount failed: ${detail}`);
      });
    return () => {
      disposed = true;
      if (dispose !== undefined) void dispose().catch(() => undefined);
    };
  }, 'dsh-mengpo: remote namespace');

  // namespace 服务出现后，把卡片注册进「插件」页的 plugins.item slot。
  ctx.inject(['remote.mengpo'], (scoped) => {
    console.error('[dsh-mengpo] inject remote.mengpo fired');
    const scopedT = scoped.locale.bind(NS);
    const Page = createMemoryPage(scoped.remote.mengpo);
    scoped.effect(
      () =>
        scoped.slots.inject('plugins.item', () =>
          scoped.slots.register(
            {
              name: 'plugins.item',
              id: TAB_ID,
              order: 30,
              label: () => scopedT('title'),
              locale: NS,
              inject: () => ({}),
            },
            createCard(Page),
          ),
        ),
      'dsh-mengpo: plugins page card',
    );
  });
}
