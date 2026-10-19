/**
 * 梦婆·记忆 —— 侧边栏页面：工作区/项目两视图 + insight 详情抽屉（查看/编辑/删除/禁用）。
 * 由 createMemoryPage(remote) 闭包注入 Remote namespace，避免模块级单例。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  GlobalMemory,
  Insight,
  ProjectDetail,
  ProjectListResult,
  ProjectSummary,
} from '../host/types.js';
import type { MengpoRemote, RemoteResult } from './index.js';

type Remote = MengpoRemote['mengpo'];

type TFunction = (key: string, params?: Record<string, string>) => string;

interface PageProps {
  useTabInfo?: () => {
    tab: { signal?: AbortSignal; navigation?: { params?: Record<string, unknown> } };
  };
  sessionId?: string;
  useSessions?: <T>(selector: (sessions: { byId: Record<string, { cwd?: string }> }) => T) => T;
  t?: TFunction;
}

interface EditForm {
  title: string;
  kind: string;
  scope: string;
  pattern: string;
  fix: string;
  files: string;
  trigger: string;
}

const KIND_ORDER = ['lesson', 'decision', 'procedure', 'experience'];

function unwrap<T>(result: RemoteResult<T>): T {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
}

function formOf(insight: Insight): EditForm {
  return {
    title: insight.title ?? '',
    kind: insight.kind ?? 'lesson',
    scope: insight.scope ?? 'project',
    pattern: insight.pattern ?? '',
    fix: insight.fix ?? '',
    files: Array.isArray(insight.files) ? insight.files.join('\n') : '',
    trigger: typeof insight.trigger === 'string' ? insight.trigger : '',
  };
}

function timeText(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

export function createMemoryPage(remote: Remote) {
  return function MemoryPage(props: PageProps) {
    const t: TFunction = props.t ?? ((key) => key);
    const tabInfo = props.useTabInfo?.();
    const signal = tabInfo?.tab.signal;
    const cwd = props.useSessions?.((sessions) =>
      props.sessionId ? sessions.byId[props.sessionId]?.cwd : undefined,
    );

    const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
    const [globalMem, setGlobalMem] = useState<GlobalMemory | null>(null);
    const [view, setView] = useState<'workspace' | 'project'>('workspace');
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [detail, setDetail] = useState<ProjectDetail | null>(null);
    const [selected, setSelected] = useState<Insight | null>(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<EditForm | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const mountedRef = useRef(true);
    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
      };
    }, []);

    const fail = useCallback(
      (prefixKey: string) => (cause: unknown) => {
        if (!mountedRef.current) return;
        const message = cause instanceof Error ? cause.message : String(cause);
        setError(t(prefixKey, { message }));
      },
      [t],
    );

    const loadList = useCallback(async () => {
      const list = unwrap(await remote.listProjects(cwd ?? null, signal)) as ProjectListResult;
      if (!mountedRef.current) return null;
      setProjects(list.projects);
      return list.projects;
    }, [remote, cwd, signal]);

    const loadGlobal = useCallback(async () => {
      const value = unwrap(await remote.getGlobal(signal)) as GlobalMemory;
      if (mountedRef.current) setGlobalMem(value);
    }, [remote, signal]);

    const loadDetail = useCallback(
      async (path: string) => {
        const value = unwrap(await remote.getProject(path, signal)) as ProjectDetail;
        if (mountedRef.current) setDetail(value);
      },
      [remote, signal],
    );

    // 首次加载：cwd 命中项目记忆库 → 直接进项目视图（D3 项目视图）
    useEffect(() => {
      setError(null);
      void (async () => {
        try {
          const [list] = await Promise.all([loadList(), loadGlobal()]);
          if (!mountedRef.current || list === null) return;
          const hit = cwd ? list.find((project) => project.path === cwd) : undefined;
          if (hit !== undefined) {
            setSelectedPath(hit.path);
            setView('project');
            await loadDetail(hit.path);
          }
        } catch (cause) {
          fail('error.load')(cause);
        }
      })();
    }, [loadList, loadGlobal, loadDetail, cwd, fail]);

    const refresh = useCallback(async () => {
      setBusy(true);
      setError(null);
      try {
        await Promise.all([loadList(), loadGlobal()]);
        if (selectedPath !== null) await loadDetail(selectedPath);
      } catch (cause) {
        fail('error.load')(cause);
      } finally {
        if (mountedRef.current) setBusy(false);
      }
    }, [loadList, loadGlobal, loadDetail, selectedPath, fail]);

    const openProject = useCallback(
      async (path: string) => {
        setSelectedPath(path);
        setView('project');
        setDetail(null);
        setError(null);
        try {
          await loadDetail(path);
        } catch (cause) {
          fail('error.load')(cause);
        }
      },
      [loadDetail, fail],
    );

    const openInsight = useCallback((insight: Insight) => {
      setSelected(insight);
      setEditing(false);
      setForm(formOf(insight));
      setConfirmingDelete(false);
    }, []);

    const afterMutation = useCallback(async () => {
      setSelected(null);
      setEditing(false);
      setConfirmingDelete(false);
      setBusy(true);
      try {
        await loadList();
        if (selectedPath !== null) await loadDetail(selectedPath);
      } finally {
        if (mountedRef.current) setBusy(false);
      }
    }, [loadList, loadDetail, selectedPath]);

    const saveEdit = useCallback(async () => {
      if (selected === null || form === null || selectedPath === null) return;
      setBusy(true);
      setError(null);
      try {
        const files = form.files
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        const patch: Insight = {
          ...selected,
          title: form.title,
          kind: form.kind,
          scope: form.scope,
          pattern: form.pattern,
          fix: form.fix,
          files,
          trigger: form.trigger,
        };
        unwrap(await remote.updateInsight(selectedPath, patch, signal));
        await afterMutation();
      } catch (cause) {
        fail('error.save')(cause);
        if (mountedRef.current) setBusy(false);
      }
    }, [selected, form, selectedPath, remote, signal, afterMutation, fail]);

    const removeInsight = useCallback(async () => {
      if (selected === null || selectedPath === null) return;
      setBusy(true);
      setError(null);
      try {
        unwrap(await remote.deleteInsight(selectedPath, selected.id, signal));
        await afterMutation();
      } catch (cause) {
        fail('error.save')(cause);
        if (mountedRef.current) setBusy(false);
      }
    }, [selected, selectedPath, remote, signal, afterMutation, fail]);

    const toggleDraft = useCallback(async () => {
      if (selected === null || selectedPath === null) return;
      setBusy(true);
      setError(null);
      try {
        unwrap(await remote.setInsightDraft(selectedPath, selected.id, !(selected.draft === true), signal));
        await afterMutation();
      } catch (cause) {
        fail('error.save')(cause);
        if (mountedRef.current) setBusy(false);
      }
    }, [selected, selectedPath, remote, signal, afterMutation, fail]);

    const grouped = useMemo(() => {
      if (detail === null) return [];
      const groups = new Map<string, Insight[]>();
      for (const insight of detail.insights) {
        const kind = typeof insight.kind === 'string' ? insight.kind : 'other';
        const bucket = groups.get(kind) ?? [];
        bucket.push(insight);
        groups.set(kind, bucket);
      }
      return [...groups.entries()].sort(([a], [b]) => {
        const ia = KIND_ORDER.indexOf(a);
        const ib = KIND_ORDER.indexOf(b);
        return (ia < 0 ? KIND_ORDER.length : ia) - (ib < 0 ? KIND_ORDER.length : ib) || a.localeCompare(b);
      });
    }, [detail]);

    const kindLabel = (kind: string) =>
      KIND_ORDER.includes(kind) ? t(`kind.${kind}`) : `${t('kind.other')} · ${kind}`;

    const currentHit = cwd !== undefined && projects !== null && projects.some((p) => p.path === cwd);

    return (
      <div className="mengpo-root" style={{ position: 'relative' }}>
        <div className="mengpo-toolbar">
          <span className="mengpo-seg">
            <button
              type="button"
              className={view === 'workspace' ? 'mengpo-on' : ''}
              onClick={() => setView('workspace')}
            >
              {t('view.workspace')}
            </button>
            <button
              type="button"
              className={view === 'project' ? 'mengpo-on' : ''}
              disabled={!currentHit && selectedPath === null}
              onClick={() => {
                if (selectedPath !== null) void openProject(selectedPath);
                else if (cwd !== undefined) void openProject(cwd);
              }}
            >
              {t('view.project')}
            </button>
          </span>
          <span className="mengpo-spacer" />
          <button type="button" className="mengpo-btn" disabled={busy} onClick={() => void refresh()}>
            {t('action.refresh')}
          </button>
        </div>
        <div className="mengpo-body">
          {error !== null && <div className="mengpo-error">{error}</div>}
          {view === 'workspace' ? (
            <WorkspaceView
              t={t}
              projects={projects}
              globalMem={globalMem}
              onOpenProject={(path) => void openProject(path)}
            />
          ) : (
            <ProjectView
              t={t}
              path={selectedPath}
              detail={detail}
              grouped={grouped}
              onBack={() => setView('workspace')}
              onOpenInsight={openInsight}
            />
          )}
        </div>
        {selected !== null && form !== null && (
          <InsightDrawer
            t={t}
            insight={selected}
            editing={editing}
            form={form}
            busy={busy}
            confirmingDelete={confirmingDelete}
            onChange={(patch) => setForm((prev) => (prev === null ? prev : { ...prev, ...patch }))}
            onEdit={() => setEditing(true)}
            onCancelEdit={() => {
              setEditing(false);
              setForm(formOf(selected));
            }}
            onSave={() => void saveEdit()}
            onDelete={() => (confirmingDelete ? void removeInsight() : setConfirmingDelete(true))}
            onToggleDraft={() => void toggleDraft()}
            onClose={() => {
              setSelected(null);
              setEditing(false);
              setConfirmingDelete(false);
            }}
          />
        )}
      </div>
    );
  };
}

function WorkspaceView({
  t,
  projects,
  globalMem,
  onOpenProject,
}: {
  t: TFunction;
  projects: ProjectSummary[] | null;
  globalMem: GlobalMemory | null;
  onOpenProject: (path: string) => void;
}) {
  const [showGlobal, setShowGlobal] = useState(false);
  return (
    <>
      <div className="mengpo-section">
        <h3 className="mengpo-section-title">{t('global.title')}</h3>
        <div className="mengpo-card">
          <div className="mengpo-row" onClick={() => setShowGlobal((prev) => !prev)}>
            <div className="mengpo-row-main">
              <div className="mengpo-row-sub">{globalMem?.path ?? ''}</div>
            </div>
            <span className="mengpo-tag">{showGlobal ? '−' : '+'}</span>
          </div>
          {showGlobal &&
            (globalMem?.content != null ? (
              <pre className="mengpo-pre">{globalMem.content}</pre>
            ) : (
              <div className="mengpo-empty">{t('global.empty')}</div>
            ))}
        </div>
      </div>
      <div className="mengpo-section">
        <h3 className="mengpo-section-title">{t('projects.title')}</h3>
        {projects === null ? (
          <div className="mengpo-empty">{t('loading')}</div>
        ) : projects.length === 0 ? (
          <div className="mengpo-empty">{t('projects.empty')}</div>
        ) : (
          <div className="mengpo-card">
            {projects.map((project) => (
              <div key={project.path} className="mengpo-row" onClick={() => onOpenProject(project.path)}>
                <div className="mengpo-row-main">
                  <div className="mengpo-row-title">{project.name}</div>
                  <div className="mengpo-row-sub">{project.path}</div>
                </div>
                {project.status === 'corrupt' ? (
                  <span className="mengpo-tag mengpo-warn">{t('status.corrupt')}</span>
                ) : project.status === 'missing' ? (
                  <span className="mengpo-tag mengpo-warn">{t('status.missing')}</span>
                ) : (
                  <span className="mengpo-tag">{t('projects.count', { count: String(project.insightCount) })}</span>
                )}
                <span className="mengpo-tag">
                  {project.latestUpdatedAt !== null
                    ? t('projects.updated', { time: timeText(project.latestUpdatedAt) })
                    : t('projects.never')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ProjectView({
  t,
  path,
  detail,
  grouped,
  onBack,
  onOpenInsight,
}: {
  t: TFunction;
  path: string | null;
  detail: ProjectDetail | null;
  grouped: Array<[string, Insight[]]>;
  onBack: () => void;
  onOpenInsight: (insight: Insight) => void;
}) {
  return (
    <div className="mengpo-section">
      <div className="mengpo-row" style={{ cursor: 'default', paddingLeft: 0 }}>
        <button type="button" className="mengpo-btn" onClick={onBack}>
          ← {t('action.back')}
        </button>
        <div className="mengpo-row-main">
          <div className="mengpo-row-title">{detail?.name ?? path ?? ''}</div>
          <div className="mengpo-row-sub">{path ?? ''}</div>
        </div>
      </div>
      {detail === null ? (
        <div className="mengpo-empty">{t('loading')}</div>
      ) : detail.status === 'corrupt' ? (
        <div className="mengpo-error">
          {t('status.corrupt')}: {detail.error ?? ''}
        </div>
      ) : detail.insights.length === 0 ? (
        <div className="mengpo-empty">{t('empty.insights')}</div>
      ) : (
        grouped.map(([kind, items]) => (
          <div key={kind}>
            <div className="mengpo-group-head">
              {kindLabelOf(t, kind)}
              <span className="mengpo-tag">{items.length}</span>
            </div>
            <div className="mengpo-card">
              {items.map((insight) => (
                <div
                  key={insight.id}
                  className={`mengpo-row${insight.draft === true ? ' mengpo-draft' : ''}`}
                  onClick={() => onOpenInsight(insight)}
                >
                  <div className="mengpo-row-main">
                    <div className="mengpo-row-title">{insight.title}</div>
                    {typeof insight.pattern === 'string' && insight.pattern !== '' && (
                      <div className="mengpo-row-sub">{insight.pattern}</div>
                    )}
                  </div>
                  <span className="mengpo-tag">{String(insight.scope ?? '')}</span>
                  {typeof insight.hitCount === 'number' && (
                    <span className="mengpo-tag">{t('detail.hits', { count: String(insight.hitCount) })}</span>
                  )}
                  {insight.draft === true && <span className="mengpo-tag mengpo-warn">{t('status.draft')}</span>}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function kindLabelOf(t: TFunction, kind: string): string {
  return KIND_ORDER.includes(kind) ? t(`kind.${kind}`) : `${t('kind.other')} · ${kind}`;
}

function InsightDrawer({
  t,
  insight,
  editing,
  form,
  busy,
  confirmingDelete,
  onChange,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onToggleDraft,
  onClose,
}: {
  t: TFunction;
  insight: Insight;
  editing: boolean;
  form: EditForm;
  busy: boolean;
  confirmingDelete: boolean;
  onChange: (patch: Partial<EditForm>) => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onToggleDraft: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mengpo-drawer-wrap">
      <div className="mengpo-mask" onClick={onClose} />
      <div className="mengpo-drawer">
        <div className="mengpo-drawer-head">
          <b>{insight.title}</b>
          <button type="button" className="mengpo-btn" onClick={onClose}>
            {t('action.close')}
          </button>
        </div>
        <div className="mengpo-drawer-body">
          {editing ? (
            <>
              <div className="mengpo-field">
                <label>{t('detail.title')}</label>
                <input value={form.title} onChange={(event) => onChange({ title: event.target.value })} />
              </div>
              <div className="mengpo-field">
                <label>{t('detail.kind')}</label>
                <select value={form.kind} onChange={(event) => onChange({ kind: event.target.value })}>
                  {KIND_ORDER.map((kind) => (
                    <option key={kind} value={kind}>
                      {t(`kind.${kind}`)}
                    </option>
                  ))}
                  {!KIND_ORDER.includes(form.kind) && <option value={form.kind}>{form.kind}</option>}
                </select>
              </div>
              <div className="mengpo-field">
                <label>{t('detail.scope')}</label>
                <select value={form.scope} onChange={(event) => onChange({ scope: event.target.value })}>
                  {['project', 'global', 'task'].map((scope) => (
                    <option key={scope} value={scope}>
                      {scope}
                    </option>
                  ))}
                  {!['project', 'global', 'task'].includes(form.scope) && (
                    <option value={form.scope}>{form.scope}</option>
                  )}
                </select>
              </div>
              <div className="mengpo-field">
                <label>{t('detail.pattern')}</label>
                <textarea value={form.pattern} onChange={(event) => onChange({ pattern: event.target.value })} />
              </div>
              <div className="mengpo-field">
                <label>{t('detail.fix')}</label>
                <textarea value={form.fix} onChange={(event) => onChange({ fix: event.target.value })} />
              </div>
              <div className="mengpo-field">
                <label>{t('detail.files')}</label>
                <textarea value={form.files} onChange={(event) => onChange({ files: event.target.value })} />
              </div>
              <div className="mengpo-field">
                <label>{t('detail.trigger')}</label>
                <textarea value={form.trigger} onChange={(event) => onChange({ trigger: event.target.value })} />
              </div>
            </>
          ) : (
            <>
              <Meta t={t} label={t('detail.kind')} value={kindLabelOf(t, String(insight.kind ?? ''))} />
              <Meta t={t} label={t('detail.scope')} value={String(insight.scope ?? '')} />
              {typeof insight.source === 'string' && <Meta t={t} label={t('detail.source')} value={insight.source} />}
              {typeof insight.confidence === 'number' && (
                <Meta t={t} label={t('detail.confidence')} value={String(insight.confidence)} />
              )}
              {typeof insight.hitCount === 'number' && (
                <Meta t={t} label={t('detail.hits', { count: String(insight.hitCount) })} value="" />
              )}
              {typeof insight.createdAt === 'string' && (
                <Meta t={t} label={t('detail.created')} value={timeText(insight.createdAt)} />
              )}
              {typeof insight.updatedAt === 'string' && (
                <Meta t={t} label={t('detail.updated')} value={timeText(insight.updatedAt)} />
              )}
              <LongText label={t('detail.pattern')} value={insight.pattern} />
              <LongText label={t('detail.fix')} value={insight.fix} />
              {Array.isArray(insight.files) && insight.files.length > 0 && (
                <LongText label={t('detail.files')} value={insight.files.join('\n')} />
              )}
              <LongText label={t('detail.trigger')} value={typeof insight.trigger === 'string' ? insight.trigger : undefined} />
            </>
          )}
        </div>
        <div className="mengpo-drawer-foot">
          {editing ? (
            <>
              <button type="button" className="mengpo-btn mengpo-primary" disabled={busy} onClick={onSave}>
                {t('action.save')}
              </button>
              <button type="button" className="mengpo-btn" disabled={busy} onClick={onCancelEdit}>
                {t('action.cancel')}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="mengpo-btn" disabled={busy} onClick={onEdit}>
                {t('action.edit')}
              </button>
              <button type="button" className="mengpo-btn" disabled={busy} onClick={onToggleDraft}>
                {insight.draft === true ? t('action.enable') : t('action.disable')}
              </button>
              <span className="mengpo-spacer" style={{ flex: 1 }} />
              <button
                type="button"
                className="mengpo-btn mengpo-danger"
                disabled={busy}
                onClick={onDelete}
              >
                {confirmingDelete ? t('action.delete.confirm') : t('action.delete')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { t: TFunction; label: string; value: string }) {
  return (
    <div className="mengpo-field">
      <label>{label}</label>
      <div className="mengpo-val">{value}</div>
    </div>
  );
}

function LongText({ label, value }: { label: string; value: string | undefined }) {
  if (value === undefined || value === '') return null;
  return (
    <div className="mengpo-field">
      <label>{label}</label>
      <div className="mengpo-val">{value}</div>
    </div>
  );
}
