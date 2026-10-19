/**
 * 梦婆·记忆 —— spike（阶段一）验证脚本。
 * 在不安装进 DSH profile 的前提下，用模拟宿主环境真实执行构建产物：
 *  (a) client 入口能在模拟 ModuleLoader + cordis ctx 下注册侧边栏 tab 类型与正文席位；
 *  (b) host 入口能注册 Typert Remote namespace（描述符形状与 gateway 校验契约一致）；
 *  (c) host 服务方法对临时 fixture 做完整读写往返。
 * 运行前提：先 pnpm build。
 */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = mkdtempSync(join(tmpdir(), 'mengpo-spike-'));
let failures = 0;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${label} ${detail}`);
  }
}

// ---------- (a) client：模拟 window.__ModuleLoader__ 加载 lib/client.js ----------
console.log('(a) client 侧边栏 tab 注册');

const moduleLoaderCalls = [];
globalThis.window = {
  __ModuleLoader__: {
    load: (entry) => moduleLoaderCalls.push(entry),
  },
};
globalThis.document = {
  createElement: () => ({ dataset: {}, textContent: '' }),
  head: { appendChild: () => undefined },
};

const clientSource = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8');
// 构建产物是 window.__ModuleLoader__.load({id, factory}) 单调用
new Function('window', 'document', clientSource)(globalThis.window, globalThis.document);

check('ModuleLoader.load 被调用一次', moduleLoaderCalls.length === 1);
const loaderEntry = moduleLoaderCalls[0];
check('模块 id === 包名 dsh-mengpo', loaderEntry.id === 'dsh-mengpo', `实际: ${loaderEntry.id}`);

const reactStub = new Proxy(
  function () {},
  {
    get: (_target, prop) => {
      if (prop === 'useState' || prop === 'useMemo') return (v) => [typeof v === 'function' ? v() : v, () => undefined];
      if (prop === 'useEffect' || prop === 'useCallback' || prop === 'useRef') {
        return prop === 'useRef' ? (v) => ({ current: v }) : (fn) => fn;
      }
      if (prop === 'createElement') return () => null;
      return reactStub;
    },
    apply: () => null,
  },
);
const requireStub = (spec) => {
  if (spec === 'react' || spec === 'react-dom' || spec === 'react/jsx-runtime') return reactStub;
  throw new Error(`require("${spec}") missed the module table`);
};

const clientExports = loaderEntry.factory(requireStub);
check(
  'exports.inject 为服务名数组（slots/locale/sidebarRightTabs/remote）',
  JSON.stringify(clientExports.inject) === JSON.stringify(['slots', 'locale', 'sidebarRightTabs', 'remote']),
  `实际: ${JSON.stringify(clientExports.inject)}`,
);
check('exports.apply 是函数', typeof clientExports.apply === 'function');

// 模拟 cordis client ctx
const registeredTabs = [];
const registeredSlots = [];
const mounted = [];
const registeredLocale = [];
const effects = [];
const clientCtx = {
  effect: (fn, label) => {
    effects.push(label);
    return fn();
  },
  locale: {
    bind: (ns) => (key) => `${ns}:${key}`,
    register: (ns, dicts) => {
      registeredLocale.push([ns, dicts]);
      return () => undefined;
    },
  },
  sidebarRightTabs: {
    register: (definition) => {
      registeredTabs.push(definition);
      return () => undefined;
    },
  },
  slots: {
    inject: (_key, callback) => callback(),
    register: (options, component) => {
      registeredSlots.push([options, component]);
      return () => undefined;
    },
  },
  remote: {
    $mount: async (contribution) => {
      mounted.push(contribution);
      return async () => undefined;
    },
  },
};

await clientExports.apply(clientCtx);

check('locale 字典注册（命名空间 mengpo，含 zh/en）', registeredLocale.length === 1 && registeredLocale[0][0] === 'mengpo' && typeof registeredLocale[0][1].zh === 'object' && typeof registeredLocale[0][1].en === 'object');
check('tab 类型注册一次', registeredTabs.length === 1);
const tab = registeredTabs[0];
check('tab id === dsh-mengpo，kind === mengpo-memory，priority === extension', tab?.id === 'dsh-mengpo' && tab?.kind === 'mengpo-memory' && tab?.priority === 'extension', JSON.stringify({ id: tab?.id, kind: tab?.kind, priority: tab?.priority }));
check('tab title() 产出本地化标题', typeof tab?.title === 'function' && tab.title() === 'mengpo:type.label', tab?.title?.());
check('tab 带 guide 入口', Array.isArray(tab?.guide) && tab.guide.length === 1 && typeof tab.guide[0].title === 'function');
check('tab 正文席位注册（sidebar.right.pane.tab, key === tab id, locale === mengpo）', registeredSlots.length === 1 && registeredSlots[0][0].name === 'sidebar.right.pane.tab' && registeredSlots[0][0].key === 'dsh-mengpo' && registeredSlots[0][0].locale === 'mengpo');
check('正文组件是函数（React 组件）', typeof registeredSlots[0]?.[1] === 'function');

check('Remote namespace $mount 一次', mounted.length === 1);
const clientContrib = mounted[0];
check('client 贡献 package === dsh-mengpo', clientContrib?.package === 'dsh-mengpo');
const expectedMethods = ['listProjects', 'getGlobal', 'getProject', 'updateInsight', 'deleteInsight', 'setInsightDraft', 'refresh'];
check(
  `client 描述符含 ${expectedMethods.length} 个方法`,
  Array.isArray(clientContrib?.descriptors) && clientContrib.descriptors.length === expectedMethods.length &&
    expectedMethods.every((m) => clientContrib.descriptors.some((d) => d.method === m)),
);
check(
  'client 描述符合约：namespace=mengpo / direct / strict 入参 codec / src-json result / cancellation=signal',
  clientContrib?.descriptors?.every(
    (d) =>
      d.namespace === 'mengpo' &&
      d.invocation?.kind === 'direct' &&
      d.cancellation?.parameter === 'signal' &&
      d.result?.mode === 'src-json' &&
      d.parameters.every((p) => p.codec?.mode === 'strict' && typeof p.codec.typeSymbol === 'string' && typeof p.codec.create === 'function'),
  ) === true,
);

// ---------- (b) host：模拟 cordis host ctx 加载 lib/index.js ----------
console.log('(b) host Typert Remote namespace 注册');

const hostModule = await import(pathToFileURL(join(process.cwd(), 'lib/index.js')).href);
check('host 导出 name/inject/apply', hostModule.name === 'dsh-mengpo' && Array.isArray(hostModule.inject) && typeof hostModule.apply === 'function');
check('host inject 声明 typert 服务', hostModule.inject.includes('typert'));

const provided = new Map();
const hostContributions = [];
const hostCtx = {
  provide: (key, value) => provided.set(key, value),
  effect: (fn) => fn(),
  typert: {
    register: (contribution) => {
      hostContributions.push(contribution);
      return () => undefined;
    },
  },
};
hostModule.apply(hostCtx, { home: join(root, 'home'), sessionsDir: join(root, 'sessions') });

check('服务以 cordis key "mengpo" 提供', provided.has('mengpo'));
const service = provided.get('mengpo');
const binding = service?.typertRemote;
check(
  'typertRemote 绑定符合 gateway validateBinding 结构契约',
  binding !== undefined && binding.service === service && binding.serviceKey === 'mengpo' && binding.namespace === 'mengpo' && Object.isFrozen(binding),
);
check('typert.register 调用一次，face === host', hostContributions.length === 1 && hostContributions[0].face === 'host');
const hostContrib = hostContributions[0];
check('host 贡献 package === dsh-mengpo', hostContrib.package === 'dsh-mengpo');
check(
  'host invocations 与 client descriptors 方法一一对应',
  Array.isArray(hostContrib.invocations) &&
    hostContrib.invocations.length === expectedMethods.length &&
    expectedMethods.every((m) => hostContrib.invocations.some((d) => d.method === m)),
);
check(
  'host invocations 合约：service=mengpo / direct / src-json 入参 / cancellation=signal / src-json result',
  hostContrib.invocations.every(
    (d) =>
      d.service === 'mengpo' &&
      d.namespace === 'mengpo' &&
      d.invocation?.kind === 'direct' &&
      d.cancellation?.parameter === 'signal' &&
      d.result?.mode === 'src-json' &&
      d.parameters.every((p) => p.codec?.mode === 'src-json'),
  ),
);
check(
  'host/client 描述符参数列表一致',
  expectedMethods.every((m) => {
    const h = hostContrib.invocations.find((d) => d.method === m);
    const c = clientContrib.descriptors.find((d) => d.method === m);
    return JSON.stringify(h.parameters.map((p) => p.name)) === JSON.stringify(c.parameters.map((p) => p.name));
  }),
);

// ---------- (c) host 服务方法对 fixture 的完整读写往返 ----------
console.log('(c) host 服务方法读写往返（fixture）');

const sessionsDir = join(root, 'sessions');
const projDir = join(root, '演示 项目');
await fs.mkdir(join(projDir, '.dsh-project-memory'), { recursive: true });
await fs.writeFile(
  join(projDir, '.dsh-project-memory', 'insights.json'),
  JSON.stringify({
    version: 2,
    migratedAt: null,
    items: [
      { id: 'i1', kind: 'lesson', scope: 'project', title: '第一条', hitCount: 2, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z', pattern: 'p', fix: 'f' },
    ],
  }),
);
await fs.writeFile(join(sessionsDir, 's1.json'), JSON.stringify({ version: 7, record: { identity: { cwd: projDir } } }), { encoding: 'utf8', flag: 'w' }).catch(async () => {
  await fs.mkdir(sessionsDir, { recursive: true });
  await fs.writeFile(join(sessionsDir, 's1.json'), JSON.stringify({ version: 7, record: { identity: { cwd: projDir } } }));
});

const list = await service.listProjects(null);
check('listProjects 发现 1 个项目（session-projcache）', list.projects.length === 1 && list.discovery === 'session-projcache' && list.projects[0].insightCount === 1);
const detail = await service.getProject(projDir);
check('getProject 返回 insight', detail.insights.length === 1 && detail.insights[0].id === 'i1');
const updated = await service.updateInsight(projDir, { ...detail.insights[0], title: '改后的标题', hitCount: 999 });
check('updateInsight 编辑生效且 hitCount 保留', updated.title === '改后的标题' && updated.hitCount === 2);
const drafted = await service.setInsightDraft(projDir, 'i1', true);
check('setInsightDraft 禁用', drafted.draft === true);
await service.deleteInsight(projDir, 'i1');
const after = await service.getProject(projDir);
check('deleteInsight 删除', after.insights.length === 0);
const globalMem = await service.getGlobal();
check('getGlobal 不崩（content 可为 null）', typeof globalMem.path === 'string' && (globalMem.content === null || typeof globalMem.content === 'string'));
try {
  await service.getProject(join(root, '不存在'));
  check('无记忆库项目抛 mengpo/not-found', false);
} catch (error) {
  check('无记忆库项目抛 mengpo/not-found', error?.code === 'mengpo/not-found' && error?.isDSHRemoteError === true, `实际: ${error?.code}`);
}

rmSync(root, { recursive: true, force: true });
console.log(failures === 0 ? '\nSPIKE PASS' : `\nSPIKE FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
