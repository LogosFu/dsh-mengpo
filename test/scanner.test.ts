import { mkdtempSync, rmSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalJsonDataSource, MengpoError, projectNameOf } from '../src/host/scanner.js';
import type { InsightsFile } from '../src/host/types.js';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'mengpo-test-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function insightsFile(items: Array<Record<string, unknown>>): InsightsFile {
  return { version: 2, migratedAt: null, items: items as InsightsFile['items'] };
}

function sampleInsight(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    kind: 'lesson',
    scope: 'project',
    title: `标题 ${id}`,
    source: 'agent',
    draft: false,
    confidence: 0.8,
    hitCount: 3,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    pattern: '问题模式',
    fix: '解决方案',
    ...extra,
  };
}

/** 建一个带记忆库的项目目录，返回项目路径。 */
async function makeProject(name: string, file?: InsightsFile | string): Promise<string> {
  const dir = join(root, name);
  await fs.mkdir(join(dir, '.dsh-project-memory'), { recursive: true });
  if (file !== undefined) {
    await fs.writeFile(
      join(dir, '.dsh-project-memory', 'insights.json'),
      typeof file === 'string' ? file : JSON.stringify(file),
      'utf8',
    );
  }
  return dir;
}

async function writeSession(sessionsDir: string, name: string, content: unknown): Promise<void> {
  await fs.mkdir(sessionsDir, { recursive: true });
  await fs.writeFile(
    join(sessionsDir, name),
    typeof content === 'string' ? content : JSON.stringify(content),
    'utf8',
  );
}

function sessionRecord(cwd: string) {
  return { version: 7, record: { identity: { formatVersion: 4, cwd } } };
}

describe('项目发现（D1）', () => {
  it('从 session 缓存取 distinct cwd，过滤出存在 .dsh-project-memory 的目录', async () => {
    const sessionsDir = join(root, 'sessions');
    const projA = await makeProject('项目 A');
    const projB = await makeProject('proj-b');
    const noMemory = join(root, 'no-memory');
    await fs.mkdir(noMemory);
    await writeSession(sessionsDir, 's1.json', sessionRecord(projA));
    await writeSession(sessionsDir, 's2.json', sessionRecord(projA)); // 重复 cwd
    await writeSession(sessionsDir, 's3.json', sessionRecord(projB));
    await writeSession(sessionsDir, 's4.json', sessionRecord(noMemory)); // 无记忆库
    await writeSession(sessionsDir, 's5.json', '{ 坏 JSON');
    await writeSession(sessionsDir, 's6.json', { version: 7, record: {} }); // 无 cwd

    const ds = new LocalJsonDataSource({ home: join(root, 'home'), sessionsDir });
    const { paths, discovery } = await ds.discoverProjectPaths();
    expect(discovery).toBe('session-projcache');
    expect(paths).toEqual([projA, projB].sort());
  });

  it('session 缓存目录不存在时降级为扫描 fallbackRoots（跳过隐藏目录）', async () => {
    const roots = join(root, 'code');
    await fs.mkdir(roots, { recursive: true });
    const proj = await makeProject(join('code', '农业'));
    await fs.mkdir(join(roots, '.hidden', '.dsh-project-memory'), { recursive: true });
    await fs.mkdir(join(roots, 'plain'));

    const ds = new LocalJsonDataSource({
      home: join(root, 'home'),
      sessionsDir: join(root, '不存在的目录'),
      fallbackRoots: [roots],
    });
    const { paths, discovery } = await ds.discoverProjectPaths();
    expect(discovery).toBe('fallback-scan');
    expect(paths).toEqual([proj]);
  });

  it('项目路径含中文与空格时正常处理', async () => {
    const sessionsDir = join(root, 'sessions');
    const proj = await makeProject('能源 集团（华南）');
    await writeSession(sessionsDir, 's1.json', sessionRecord(proj));
    const ds = new LocalJsonDataSource({ home: join(root, 'home'), sessionsDir });
    const { paths } = await ds.discoverProjectPaths();
    expect(paths).toEqual([proj]);
    expect(projectNameOf(proj)).toBe('能源 集团（华南）');
  });
});

describe('insights 读取', () => {
  it('listProjects 汇总计数与最近更新时间，坏 JSON 项目标记 corrupt 而不拖垮整页', async () => {
    const sessionsDir = join(root, 'sessions');
    const ok = await makeProject('ok-proj', insightsFile([
      sampleInsight('a', { updatedAt: '2026-10-05T00:00:00.000Z' }),
      sampleInsight('b', { updatedAt: '2026-10-09T00:00:00.000Z' }),
    ]));
    const bad = await makeProject('bad-proj', '{ 这不是 JSON');
    const missing = await makeProject('missing-proj'); // 有目录无 insights.json
    await writeSession(sessionsDir, 's1.json', sessionRecord(ok));
    await writeSession(sessionsDir, 's2.json', sessionRecord(bad));
    await writeSession(sessionsDir, 's3.json', sessionRecord(missing));

    const ds = new LocalJsonDataSource({ home: join(root, 'home'), sessionsDir });
    const { projects } = await ds.listProjects(null);
    expect(projects).toHaveLength(3);
    const byPath = new Map(projects.map((p) => [p.path, p]));
    expect(byPath.get(ok)).toMatchObject({
      status: 'ok',
      insightCount: 2,
      latestUpdatedAt: '2026-10-09T00:00:00.000Z',
    });
    expect(byPath.get(bad)?.status).toBe('corrupt');
    expect(byPath.get(bad)?.error).toBeTruthy();
    expect(byPath.get(missing)?.status).toBe('missing');
  });

  it('结构不符（缺 items 数组）也视为 corrupt', async () => {
    const proj = await makeProject('proj', '{"version":2}');
    const ds = new LocalJsonDataSource({ home: join(root, 'home'), sessionsDir: join(root, 'none') });
    const detail = await ds.getProject(proj);
    expect(detail.status).toBe('corrupt');
    expect(detail.insights).toEqual([]);
  });

  it('getProject 对无记忆库目录抛 mengpo/not-found', async () => {
    const ds = new LocalJsonDataSource({ home: join(root, 'home') });
    await expect(ds.getProject(join(root, 'nowhere'))).rejects.toMatchObject({
      code: 'mengpo/not-found',
    });
  });

  it('getGlobal 读取 AGENTS.md，缺失时 content 为 null', async () => {
    const home = join(root, 'home');
    await fs.mkdir(home, { recursive: true });
    const ds = new LocalJsonDataSource({ home });
    await fs.writeFile(join(home, 'AGENTS.md'), '# 全局记忆\n内容', 'utf8');
    expect(await ds.getGlobal()).toEqual({ path: join(home, 'AGENTS.md'), content: '# 全局记忆\n内容' });
    await fs.rm(join(home, 'AGENTS.md'));
    expect((await ds.getGlobal()).content).toBeNull();
  });
});

describe('insights 写回（D2：重读-合并-原子写）', () => {
  const insightsPathOf = (proj: string) => join(proj, '.dsh-project-memory', 'insights.json');
  const readBack = async (proj: string): Promise<InsightsFile> =>
    JSON.parse(await fs.readFile(insightsPathOf(proj), 'utf8')) as InsightsFile;

  it('编辑保留 id/createdAt/hitCount/source，覆盖可编辑字段并更新 updatedAt，重读一致', async () => {
    const proj = await makeProject('proj', insightsFile([sampleInsight('x'), sampleInsight('y')]));
    const ds = new LocalJsonDataSource({ home: join(root, 'home') });
    const before = (await readBack(proj)).items[0]!;

    const merged = await ds.updateInsight(proj, {
      ...before,
      title: '新标题',
      pattern: '新模式',
      fix: '新方案',
      files: ['a.ts', 'b.ts'],
      trigger: '触发',
      hitCount: 999, // 应被忽略，保留原值
      createdAt: '1999-01-01T00:00:00.000Z', // 应被忽略
    });

    expect(merged.title).toBe('新模式'.length > 0 ? '新标题' : '');
    expect(merged.id).toBe('x');
    expect(merged.hitCount).toBe(3);
    expect(merged.createdAt).toBe('2026-10-01T00:00:00.000Z');
    expect(merged.source).toBe('agent');
    expect(Date.parse(merged.updatedAt!)).toBeGreaterThan(Date.parse('2026-10-02T00:00:00.000Z'));

    const after = await readBack(proj);
    expect(after.items).toHaveLength(2);
    expect(after.items[0]).toEqual(merged);
    expect(after.items[1]).toMatchObject({ id: 'y', title: '标题 y' }); // 其它条目不动
    // 无 tmp 残留
    await expect(fs.readdir(join(proj, '.dsh-project-memory'))).resolves.not.toContainEqual(
      expect.stringMatching(/\.tmp$/),
    );
  });

  it('编辑不存在的 insight 抛 mengpo/not-found', async () => {
    const proj = await makeProject('proj', insightsFile([sampleInsight('x')]));
    const ds = new LocalJsonDataSource({ home: join(root, 'home') });
    await expect(ds.updateInsight(proj, sampleInsight('ghost') as never)).rejects.toMatchObject({
      code: 'mengpo/not-found',
    });
  });

  it('删除后重读一致；重复删除抛 not-found', async () => {
    const proj = await makeProject('proj', insightsFile([sampleInsight('x'), sampleInsight('y')]));
    const ds = new LocalJsonDataSource({ home: join(root, 'home') });
    await ds.deleteInsight(proj, 'x');
    const after = await readBack(proj);
    expect(after.items.map((item) => item.id)).toEqual(['y']);
    await expect(ds.deleteInsight(proj, 'x')).rejects.toMatchObject({ code: 'mengpo/not-found' });
  });

  it('禁用/启用（draft 置位）往返', async () => {
    const proj = await makeProject('proj', insightsFile([sampleInsight('x')]));
    const ds = new LocalJsonDataSource({ home: join(root, 'home') });
    const disabled = await ds.setInsightDraft(proj, 'x', true);
    expect(disabled.draft).toBe(true);
    expect((await readBack(proj)).items[0]!.draft).toBe(true);
    const enabled = await ds.setInsightDraft(proj, 'x', false);
    expect(enabled.draft).toBe(false);
    expect((await readBack(proj)).items[0]!.draft).toBe(false);
  });

  it('提交前发现 mtime 变化则丢弃 tmp 重新合并（冲突重试成功）', async () => {
    const proj = await makeProject('proj', insightsFile([sampleInsight('x'), sampleInsight('y')]));
    const insightsPath = insightsPathOf(proj);
    let attempts = 0;
    const ds = new LocalJsonDataSource({
      home: join(root, 'home'),
      hooks: {
        beforeCommit: async (path, attempt) => {
          attempts = attempt;
          if (attempt === 1) {
            // 模拟 agent 会话并发写入：外部新增一条 insight 并改变 mtime
            const current = JSON.parse(await fs.readFile(path, 'utf8')) as InsightsFile;
            current.items.push(sampleInsight('external'));
            await fs.writeFile(path, JSON.stringify(current), 'utf8');
          }
        },
      },
    });

    await ds.deleteInsight(proj, 'x');
    expect(attempts).toBe(2); // 第一次冲突，第二次成功
    const after = await readBack(proj);
    // 合并基于最新内容：x 被删除，外部新增的 external 保留
    expect(after.items.map((item) => item.id).sort()).toEqual(['external', 'y']);
  });

  it('持续冲突超过 3 次抛 mengpo/conflict，且原文件不被破坏', async () => {
    const original = insightsFile([sampleInsight('x')]);
    const proj = await makeProject('proj', original);
    const insightsPath = insightsPathOf(proj);
    const ds = new LocalJsonDataSource({
      home: join(root, 'home'),
      hooks: {
        beforeCommit: async (path) => {
          await fs.writeFile(path, JSON.stringify(insightsFile([sampleInsight('x')])), 'utf8');
        },
      },
    });
    await expect(ds.deleteInsight(proj, 'x')).rejects.toMatchObject({ code: 'mengpo/conflict' });
    // 原文件仍是合法 JSON，条目仍在
    const after = await readBack(proj);
    expect(after.items.map((item) => item.id)).toEqual(['x']);
    // tmp 清理干净
    const names = await fs.readdir(join(proj, '.dsh-project-memory'));
    expect(names.filter((name) => name.endsWith('.tmp'))).toEqual([]);
  });

  it('同一文件的写操作串行执行（并发 update 不交错）', async () => {
    const proj = await makeProject('proj', insightsFile([sampleInsight('x'), sampleInsight('y')]));
    const ds = new LocalJsonDataSource({ home: join(root, 'home') });
    await Promise.all([
      ds.setInsightDraft(proj, 'x', true),
      ds.setInsightDraft(proj, 'y', true),
      ds.deleteInsight(proj, 'x'),
    ]);
    const after = await readBack(proj);
    expect(after.items).toHaveLength(1);
    expect(after.items[0]).toMatchObject({ id: 'y', draft: true });
  });
});

describe('MengpoError', () => {
  it('携带 code 与 isDSHRemoteError 标记（可跨 Remote 通道）', () => {
    const error = new MengpoError('mengpo/not-found', '不存在', { id: 'x' });
    expect(error.code).toBe('mengpo/not-found');
    expect(error.isDSHRemoteError).toBe(true);
    expect(error.details).toEqual({ id: 'x' });
    expect(error).toBeInstanceOf(Error);
  });
});
