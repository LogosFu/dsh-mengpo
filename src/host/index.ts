/**
 * 梦婆·记忆 —— host 侧 cordis 插件入口。
 *
 * 零运行时依赖（不 import @deepseek-ai/* 包）：
 * - cordis 服务以普通对象 + ctx.provide 提供；
 * - Typert Remote 绑定按 dsh-api-gateway 的结构化校验手工构造
 *   （validateBinding 只检查 typertRemote.{service,serviceKey,namespace} 一致性）；
 * - 描述符通过 ctx.typert.register() 手写注册——dsh-typert-loader 明确支持的
 *   「不使用 ./typert 产物」的官方路径。
 */
import {
  LocalJsonDataSource,
  MengpoError,
  type ScannerOptions,
} from './scanner.js';
import type {
  GlobalMemory,
  Insight,
  MemoryDataSource,
  ProjectDetail,
  ProjectListResult,
} from './types.js';
import { REMOTE_NAMESPACE, hostContribution } from '../shared/remote.js';

export const name = 'dsh-mengpo';
export const inject = ['typert'];

export interface MengpoConfig extends ScannerOptions {}

interface CordisContext {
  provide(key: string, value: unknown): void;
  effect(effect: () => unknown, label?: string): unknown;
  typert: { register(contribution: unknown): () => void };
  [key: string]: unknown;
}

function asRemoteError(error: unknown): unknown {
  if (
    typeof error === 'object' &&
    error !== null &&
    (error as { isDSHRemoteError?: unknown }).isDSHRemoteError === true
  ) {
    return error;
  }
  return new MengpoError('mengpo/internal', (error as Error)?.message ?? String(error));
}

async function guard<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw asRemoteError(error);
  }
}

export function apply(ctx: CordisContext, config?: MengpoConfig): void {
  const source: MemoryDataSource = new LocalJsonDataSource(config);

  const service = {
    listProjects: (cwd: string | null, _signal?: AbortSignal): Promise<ProjectListResult> =>
      guard(() => source.listProjects(cwd ?? null)),
    getGlobal: (_signal?: AbortSignal): Promise<GlobalMemory> => guard(() => source.getGlobal()),
    getProject: (path: string, _signal?: AbortSignal): Promise<ProjectDetail> =>
      guard(() => source.getProject(path)),
    updateInsight: (projectPath: string, insight: Insight, _signal?: AbortSignal): Promise<Insight> =>
      guard(() => source.updateInsight(projectPath, insight)),
    deleteInsight: (projectPath: string, insightId: string, _signal?: AbortSignal): Promise<void> =>
      guard(() => source.deleteInsight(projectPath, insightId)),
    setInsightDraft: (
      projectPath: string,
      insightId: string,
      draft: boolean,
      _signal?: AbortSignal,
    ): Promise<Insight> => guard(() => source.setInsightDraft(projectPath, insightId, draft)),
    refresh: (cwd: string | null, _signal?: AbortSignal): Promise<ProjectListResult> =>
      guard(() => source.listProjects(cwd ?? null)),
  };

  // dsh-api-gateway validateBinding 的结构化契约：
  // original.typertRemote.{service === 服务本体, serviceKey, namespace}
  Object.defineProperty(service, 'typertRemote', {
    value: Object.freeze({ service, serviceKey: REMOTE_NAMESPACE, namespace: REMOTE_NAMESPACE }),
    enumerable: true,
  });

  ctx.provide(REMOTE_NAMESPACE, service);
  ctx.effect(() => ctx.typert.register(hostContribution()), 'dsh-mengpo: typert remote');
}
