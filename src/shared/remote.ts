/**
 * 梦婆·记忆 —— host/client 共享的 Remote namespace 声明（单一事实源）。
 * host 侧以 src-json codec 注册（ctx.typert.register），
 * client 侧以 strict codec 挂载（ctx.remote.$mount，client 不校验入参，create 不会被调用）。
 */

export const REMOTE_PACKAGE = 'dsh-mengpo';
export const REMOTE_NAMESPACE = 'mengpo';

export interface RemoteMethodSpec {
  method: string;
  /** 业务参数名（wire 字段同名）；尾随的 AbortSignal 由 cancellation 声明，不在此列 */
  params: string[];
}

export const REMOTE_METHODS: RemoteMethodSpec[] = [
  { method: 'listProjects', params: ['cwd'] },
  { method: 'getGlobal', params: [] },
  { method: 'getProject', params: ['path'] },
  { method: 'updateInsight', params: ['projectPath', 'insight'] },
  { method: 'deleteInsight', params: ['projectPath', 'insightId'] },
  { method: 'setInsightDraft', params: ['projectPath', 'insightId', 'draft'] },
  { method: 'refresh', params: ['cwd'] },
];

interface Codec {
  mode: string;
  typeSymbol?: string;
  create?: () => { parse: (value: unknown) => unknown };
}

interface Parameter {
  name: string;
  wire: string;
  source: 'json';
  codec: Codec;
}

export interface RemoteDescriptor {
  id: string;
  service: string;
  namespace: string;
  method: string;
  invocation: { kind: 'direct' };
  parameters: Parameter[];
  cancellation: { parameter: 'signal' };
  result: { mode: 'src-json' };
}

function descriptorOf(spec: RemoteMethodSpec, codecOf: (name: string) => Codec): RemoteDescriptor {
  return {
    id: `${REMOTE_PACKAGE}#${REMOTE_NAMESPACE}/${spec.method}`,
    service: REMOTE_NAMESPACE,
    namespace: REMOTE_NAMESPACE,
    method: spec.method,
    invocation: { kind: 'direct' },
    parameters: spec.params.map((name) => ({ name, wire: name, source: 'json', codec: codecOf(name) })),
    cancellation: { parameter: 'signal' },
    result: { mode: 'src-json' },
  };
}

/** host 贡献：ctx.typert.register() 接受 src-json 入参 codec。 */
export function hostContribution() {
  return {
    package: REMOTE_PACKAGE,
    face: 'host' as const,
    schemas: [],
    invocations: REMOTE_METHODS.map((spec) => descriptorOf(spec, () => ({ mode: 'src-json' }))),
  };
}

/** client 贡献：$mount 要求入参 strict codec（client 端不会真正调用 create）。 */
export function clientContribution() {
  return {
    package: REMOTE_PACKAGE,
    descriptors: REMOTE_METHODS.map((spec) =>
      descriptorOf(spec, (name) => ({
        mode: 'strict',
        typeSymbol: `${REMOTE_PACKAGE}#${name}`,
        create: () => ({ parse: (value: unknown) => value }),
      })),
    ),
  };
}
