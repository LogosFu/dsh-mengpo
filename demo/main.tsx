/** demo 入口：离线渲染真实 MemoryPage 组件（数据为脱敏样本），供 Playwright 截图。 */
import { createRoot } from 'react-dom/client';
import { createElement, StrictMode } from 'react';
import { createMemoryPage } from '../src/client/MemoryPage.js';
import { zh } from '../src/client/locale.js';
import { STYLES } from '../src/client/styles.js';
import data from './demo-data.json';

type RemoteResult<T> = { ok: true; value: T } | { ok: false; error: { code: string; message: string } };

const ok = <T,>(value: T): RemoteResult<T> => ({ ok: true, value });

const list = data.list;
const project = data.project;
const global = data.global;

const remote = {
  listProjects: async () => ok(list),
  getGlobal: async () => ok(global),
  getProject: async (path: string) =>
    ok(path === project.path ? project : { ...project, path, name: path.split('/').pop() }),
  updateInsight: async () => ok({ updated: true }),
  deleteInsight: async () => ok({ deleted: true }),
  setInsightDraft: async () => ok({ updated: true }),
  refresh: async () => ok(list),
};

const t = (key: string, params?: Record<string, string>): string => {
  let text = (zh as Record<string, string>)[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) text = text.replace(`{${k}}`, v);
  return text;
};

const style = document.createElement('style');
style.textContent = STYLES;
document.head.appendChild(style);

const Page = createMemoryPage(remote as never);
const root = createRoot(document.getElementById('root')!);
root.render(createElement(StrictMode, null, createElement(Page as never, { t } as never)));
