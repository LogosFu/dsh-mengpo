window.__ModuleLoader__.load({id:"dsh-mengpo",factory:(require)=>{var module={exports:{}};var exports=module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var client_exports = {};
__export(client_exports, {
  TAB_ID: () => TAB_ID,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);
var import_react2 = require("react");

// src/shared/remote.ts
var REMOTE_PACKAGE = "dsh-mengpo";
var REMOTE_NAMESPACE = "mengpo";
var REMOTE_METHODS = [
  { method: "listProjects", params: ["cwd"] },
  { method: "getGlobal", params: [] },
  { method: "getProject", params: ["path"] },
  { method: "updateInsight", params: ["projectPath", "insight"] },
  { method: "deleteInsight", params: ["projectPath", "insightId"] },
  { method: "setInsightDraft", params: ["projectPath", "insightId", "draft"] },
  { method: "refresh", params: ["cwd"] }
];
function descriptorOf(spec, codecOf) {
  return {
    id: `${REMOTE_PACKAGE}#${REMOTE_NAMESPACE}/${spec.method}`,
    service: REMOTE_NAMESPACE,
    namespace: REMOTE_NAMESPACE,
    method: spec.method,
    invocation: { kind: "direct" },
    parameters: spec.params.map((name) => ({ name, wire: name, source: "json", codec: codecOf(name) })),
    cancellation: { parameter: "signal" },
    result: { mode: "src-json" }
  };
}
function clientContribution() {
  return {
    package: REMOTE_PACKAGE,
    descriptors: REMOTE_METHODS.map(
      (spec) => descriptorOf(spec, (name) => ({
        mode: "strict",
        typeSymbol: `${REMOTE_PACKAGE}#${name}`,
        create: () => ({ parse: (value) => value })
      }))
    )
  };
}

// src/client/locale.ts
var NS = "mengpo";
var zh = {
  "title": "\u68A6\u5A46\xB7\u8BB0\u5FC6",
  "summary": "\u67E5\u770B\u4E0E\u7BA1\u7406 DSH \u8BB0\u5FC6\uFF1A\u5168\u5C40\u8BB0\u5FC6\uFF08AGENTS.md\uFF09\u548C\u5404\u9879\u76EE\u8BB0\u5FC6\u5E93\uFF0C\u652F\u6301\u7F16\u8F91\u3001\u5220\u9664\u3001\u7981\u7528 insight",
  "type.label": "\u68A6\u5A46\xB7\u8BB0\u5FC6",
  "guide.title": "\u8BB0\u5FC6",
  "guide.description": "\u67E5\u770B\u548C\u7BA1\u7406\u5168\u5C40\u4E0E\u9879\u76EE\u8BB0\u5FC6",
  "view.workspace": "\u5DE5\u4F5C\u533A",
  "view.project": "\u672C\u9879\u76EE",
  "action.refresh": "\u5237\u65B0",
  "action.back": "\u8FD4\u56DE\u5217\u8868",
  "action.edit": "\u7F16\u8F91",
  "action.save": "\u4FDD\u5B58",
  "action.cancel": "\u53D6\u6D88",
  "action.delete": "\u5220\u9664",
  "action.delete.confirm": "\u786E\u8BA4\u5220\u9664\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D",
  "action.disable": "\u7981\u7528",
  "action.enable": "\u542F\u7528",
  "action.close": "\u5173\u95ED",
  "global.title": "\u5168\u5C40\u8BB0\u5FC6\uFF08AGENTS.md\uFF09",
  "global.empty": "\u5168\u5C40\u8BB0\u5FC6\u6587\u4EF6\u4E0D\u5B58\u5728",
  "projects.title": "\u9879\u76EE\u8BB0\u5FC6\u5E93",
  "projects.empty": "\u672A\u53D1\u73B0\u4EFB\u4F55\u9879\u76EE\u8BB0\u5FC6\u5E93",
  "projects.count": "{count} \u6761 insight",
  "projects.updated": "\u6700\u8FD1\u66F4\u65B0 {time}",
  "projects.never": "\u6682\u65E0\u8BB0\u5F55",
  "status.corrupt": "\u6570\u636E\u635F\u574F",
  "status.missing": "\u65E0\u8BB0\u5FC6\u6587\u4EF6",
  "status.draft": "\u5DF2\u7981\u7528",
  "detail.hits": "\u547D\u4E2D {count} \u6B21",
  "detail.scope": "\u8303\u56F4",
  "detail.kind": "\u7C7B\u578B",
  "detail.source": "\u6765\u6E90",
  "detail.created": "\u521B\u5EFA\u4E8E",
  "detail.updated": "\u66F4\u65B0\u4E8E",
  "detail.pattern": "\u95EE\u9898\u6A21\u5F0F\uFF08pattern\uFF09",
  "detail.fix": "\u89E3\u51B3\u65B9\u6848\uFF08fix\uFF09",
  "detail.files": "\u5173\u8054\u6587\u4EF6\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF09",
  "detail.trigger": "\u89E6\u53D1\u6761\u4EF6\uFF08trigger\uFF09",
  "detail.title": "\u6807\u9898",
  "detail.confidence": "\u7F6E\u4FE1\u5EA6",
  "loading": "\u52A0\u8F7D\u4E2D\u2026",
  "error.load": "\u52A0\u8F7D\u5931\u8D25\uFF1A{message}",
  "error.save": "\u4FDD\u5B58\u5931\u8D25\uFF1A{message}",
  "kind.lesson": "\u6559\u8BAD",
  "kind.decision": "\u51B3\u7B56",
  "kind.procedure": "\u6D41\u7A0B",
  "kind.experience": "\u7ECF\u9A8C",
  "kind.other": "\u5176\u5B83",
  "empty.insights": "\u672C\u9879\u76EE\u6682\u65E0 insight",
  "current.project": "\u5F53\u524D\u9879\u76EE"
};
var en = {
  "title": "Mengpo Memory",
  "summary": "DSH memory browser: global AGENTS.md plus every project memory store, with edit, delete and disable",
  "type.label": "Mengpo Memory",
  "guide.title": "Memory",
  "guide.description": "View and manage global and project memory",
  "view.workspace": "Workspace",
  "view.project": "This Project",
  "action.refresh": "Refresh",
  "action.back": "Back to list",
  "action.edit": "Edit",
  "action.save": "Save",
  "action.cancel": "Cancel",
  "action.delete": "Delete",
  "action.delete.confirm": "Delete permanently? This cannot be undone.",
  "action.disable": "Disable",
  "action.enable": "Enable",
  "action.close": "Close",
  "global.title": "Global Memory (AGENTS.md)",
  "global.empty": "Global memory file does not exist",
  "projects.title": "Project Memory Stores",
  "projects.empty": "No project memory store discovered",
  "projects.count": "{count} insights",
  "projects.updated": "Updated {time}",
  "projects.never": "No records yet",
  "status.corrupt": "Corrupted",
  "status.missing": "No memory file",
  "status.draft": "Disabled",
  "detail.hits": "{count} hits",
  "detail.scope": "Scope",
  "detail.kind": "Kind",
  "detail.source": "Source",
  "detail.created": "Created",
  "detail.updated": "Updated",
  "detail.pattern": "Pattern",
  "detail.fix": "Fix",
  "detail.files": "Files (one per line)",
  "detail.trigger": "Trigger",
  "detail.title": "Title",
  "detail.confidence": "Confidence",
  "loading": "Loading\u2026",
  "error.load": "Load failed: {message}",
  "error.save": "Save failed: {message}",
  "kind.lesson": "Lessons",
  "kind.decision": "Decisions",
  "kind.procedure": "Procedures",
  "kind.experience": "Experiences",
  "kind.other": "Others",
  "empty.insights": "No insights in this project yet",
  "current.project": "Current project"
};

// src/client/MemoryPage.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var KIND_ORDER = ["lesson", "decision", "procedure", "experience"];
function unwrap(result) {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
}
function formOf(insight) {
  return {
    title: insight.title ?? "",
    kind: insight.kind ?? "lesson",
    scope: insight.scope ?? "project",
    pattern: insight.pattern ?? "",
    fix: insight.fix ?? "",
    files: Array.isArray(insight.files) ? insight.files.join("\n") : "",
    trigger: typeof insight.trigger === "string" ? insight.trigger : ""
  };
}
function timeText(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}
function createMemoryPage(remote) {
  return function MemoryPage(props) {
    const t = props.t ?? ((key) => key);
    const tabInfo = props.useTabInfo?.();
    const signal = tabInfo?.tab.signal;
    const cwd = props.useSessions?.(
      (sessions) => props.sessionId ? sessions.byId[props.sessionId]?.cwd : void 0
    );
    const [projects, setProjects] = (0, import_react.useState)(null);
    const [globalMem, setGlobalMem] = (0, import_react.useState)(null);
    const [view, setView] = (0, import_react.useState)("workspace");
    const [selectedPath, setSelectedPath] = (0, import_react.useState)(null);
    const [detail, setDetail] = (0, import_react.useState)(null);
    const [selected, setSelected] = (0, import_react.useState)(null);
    const [editing, setEditing] = (0, import_react.useState)(false);
    const [form, setForm] = (0, import_react.useState)(null);
    const [confirmingDelete, setConfirmingDelete] = (0, import_react.useState)(false);
    const [error, setError] = (0, import_react.useState)(null);
    const [busy, setBusy] = (0, import_react.useState)(false);
    const mountedRef = (0, import_react.useRef)(true);
    (0, import_react.useEffect)(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
      };
    }, []);
    const fail = (0, import_react.useCallback)(
      (prefixKey) => (cause) => {
        if (!mountedRef.current) return;
        const message = cause instanceof Error ? cause.message : String(cause);
        setError(t(prefixKey, { message }));
      },
      [t]
    );
    const loadList = (0, import_react.useCallback)(async () => {
      const list = unwrap(await remote.listProjects(cwd ?? null, signal));
      if (!mountedRef.current) return null;
      setProjects(list.projects);
      return list.projects;
    }, [remote, cwd, signal]);
    const loadGlobal = (0, import_react.useCallback)(async () => {
      const value = unwrap(await remote.getGlobal(signal));
      if (mountedRef.current) setGlobalMem(value);
    }, [remote, signal]);
    const loadDetail = (0, import_react.useCallback)(
      async (path) => {
        const value = unwrap(await remote.getProject(path, signal));
        if (mountedRef.current) setDetail(value);
      },
      [remote, signal]
    );
    (0, import_react.useEffect)(() => {
      setError(null);
      void (async () => {
        try {
          const [list] = await Promise.all([loadList(), loadGlobal()]);
          if (!mountedRef.current || list === null) return;
          const hit = cwd ? list.find((project) => project.path === cwd) : void 0;
          if (hit !== void 0) {
            setSelectedPath(hit.path);
            setView("project");
            await loadDetail(hit.path);
          }
        } catch (cause) {
          fail("error.load")(cause);
        }
      })();
    }, [loadList, loadGlobal, loadDetail, cwd, fail]);
    const refresh = (0, import_react.useCallback)(async () => {
      setBusy(true);
      setError(null);
      try {
        await Promise.all([loadList(), loadGlobal()]);
        if (selectedPath !== null) await loadDetail(selectedPath);
      } catch (cause) {
        fail("error.load")(cause);
      } finally {
        if (mountedRef.current) setBusy(false);
      }
    }, [loadList, loadGlobal, loadDetail, selectedPath, fail]);
    const openProject = (0, import_react.useCallback)(
      async (path) => {
        setSelectedPath(path);
        setView("project");
        setDetail(null);
        setError(null);
        try {
          await loadDetail(path);
        } catch (cause) {
          fail("error.load")(cause);
        }
      },
      [loadDetail, fail]
    );
    const openInsight = (0, import_react.useCallback)((insight) => {
      setSelected(insight);
      setEditing(false);
      setForm(formOf(insight));
      setConfirmingDelete(false);
    }, []);
    const afterMutation = (0, import_react.useCallback)(async () => {
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
    const saveEdit = (0, import_react.useCallback)(async () => {
      if (selected === null || form === null || selectedPath === null) return;
      setBusy(true);
      setError(null);
      try {
        const files = form.files.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
        const patch = {
          ...selected,
          title: form.title,
          kind: form.kind,
          scope: form.scope,
          pattern: form.pattern,
          fix: form.fix,
          files,
          trigger: form.trigger
        };
        unwrap(await remote.updateInsight(selectedPath, patch, signal));
        await afterMutation();
      } catch (cause) {
        fail("error.save")(cause);
        if (mountedRef.current) setBusy(false);
      }
    }, [selected, form, selectedPath, remote, signal, afterMutation, fail]);
    const removeInsight = (0, import_react.useCallback)(async () => {
      if (selected === null || selectedPath === null) return;
      setBusy(true);
      setError(null);
      try {
        unwrap(await remote.deleteInsight(selectedPath, selected.id, signal));
        await afterMutation();
      } catch (cause) {
        fail("error.save")(cause);
        if (mountedRef.current) setBusy(false);
      }
    }, [selected, selectedPath, remote, signal, afterMutation, fail]);
    const toggleDraft = (0, import_react.useCallback)(async () => {
      if (selected === null || selectedPath === null) return;
      setBusy(true);
      setError(null);
      try {
        unwrap(await remote.setInsightDraft(selectedPath, selected.id, !(selected.draft === true), signal));
        await afterMutation();
      } catch (cause) {
        fail("error.save")(cause);
        if (mountedRef.current) setBusy(false);
      }
    }, [selected, selectedPath, remote, signal, afterMutation, fail]);
    const grouped = (0, import_react.useMemo)(() => {
      if (detail === null) return [];
      const groups = /* @__PURE__ */ new Map();
      for (const insight of detail.insights) {
        const kind = typeof insight.kind === "string" ? insight.kind : "other";
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
    const kindLabel = (kind) => KIND_ORDER.includes(kind) ? t(`kind.${kind}`) : `${t("kind.other")} \xB7 ${kind}`;
    const currentHit = cwd !== void 0 && projects !== null && projects.some((p) => p.path === cwd);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-root", style: { position: "relative" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-toolbar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "mengpo-seg", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: view === "workspace" ? "mengpo-on" : "",
              onClick: () => setView("workspace"),
              children: t("view.workspace")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: view === "project" ? "mengpo-on" : "",
              disabled: !currentHit && selectedPath === null,
              onClick: () => {
                if (selectedPath !== null) void openProject(selectedPath);
                else if (cwd !== void 0) void openProject(cwd);
              },
              children: t("view.project")
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mengpo-spacer" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "mengpo-btn", disabled: busy, onClick: () => void refresh(), children: t("action.refresh") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-body", children: [
        error !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-error", children: error }),
        view === "workspace" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          WorkspaceView,
          {
            t,
            projects,
            globalMem,
            onOpenProject: (path) => void openProject(path)
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ProjectView,
          {
            t,
            path: selectedPath,
            detail,
            grouped,
            onBack: () => setView("workspace"),
            onOpenInsight: openInsight
          }
        )
      ] }),
      selected !== null && form !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        InsightDrawer,
        {
          t,
          insight: selected,
          editing,
          form,
          busy,
          confirmingDelete,
          onChange: (patch) => setForm((prev) => prev === null ? prev : { ...prev, ...patch }),
          onEdit: () => setEditing(true),
          onCancelEdit: () => {
            setEditing(false);
            setForm(formOf(selected));
          },
          onSave: () => void saveEdit(),
          onDelete: () => confirmingDelete ? void removeInsight() : setConfirmingDelete(true),
          onToggleDraft: () => void toggleDraft(),
          onClose: () => {
            setSelected(null);
            setEditing(false);
            setConfirmingDelete(false);
          }
        }
      )
    ] });
  };
}
function WorkspaceView({
  t,
  projects,
  globalMem,
  onOpenProject
}) {
  const [showGlobal, setShowGlobal] = (0, import_react.useState)(false);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-section", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "mengpo-section-title", children: t("global.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-row", onClick: () => setShowGlobal((prev) => !prev), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-row-main", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-row-sub", children: globalMem?.path ?? "" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mengpo-tag", children: showGlobal ? "\u2212" : "+" })
        ] }),
        showGlobal && (globalMem?.content != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { className: "mengpo-pre", children: globalMem.content }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-empty", children: t("global.empty") }))
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-section", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "mengpo-section-title", children: t("projects.title") }),
      projects === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-empty", children: t("loading") }) : projects.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-empty", children: t("projects.empty") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-card", children: projects.map((project) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-row", onClick: () => onOpenProject(project.path), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-row-main", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-row-title", children: project.name }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-row-sub", children: project.path })
        ] }),
        project.status === "corrupt" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mengpo-tag mengpo-warn", children: t("status.corrupt") }) : project.status === "missing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mengpo-tag mengpo-warn", children: t("status.missing") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mengpo-tag", children: t("projects.count", { count: String(project.insightCount) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mengpo-tag", children: project.latestUpdatedAt !== null ? t("projects.updated", { time: timeText(project.latestUpdatedAt) }) : t("projects.never") })
      ] }, project.path)) })
    ] })
  ] });
}
function ProjectView({
  t,
  path,
  detail,
  grouped,
  onBack,
  onOpenInsight
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-section", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-row", style: { cursor: "default", paddingLeft: 0 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "mengpo-btn", onClick: onBack, children: [
        "\u2190 ",
        t("action.back")
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-row-main", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-row-title", children: detail?.name ?? path ?? "" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-row-sub", children: path ?? "" })
      ] })
    ] }),
    detail === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-empty", children: t("loading") }) : detail.status === "corrupt" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-error", children: [
      t("status.corrupt"),
      ": ",
      detail.error ?? ""
    ] }) : detail.insights.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-empty", children: t("empty.insights") }) : grouped.map(([kind, items]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-group-head", children: [
        kindLabelOf(t, kind),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mengpo-tag", children: items.length })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-card", children: items.map((insight) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          className: `mengpo-row${insight.draft === true ? " mengpo-draft" : ""}`,
          onClick: () => onOpenInsight(insight),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-row-main", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-row-title", children: insight.title }),
              typeof insight.pattern === "string" && insight.pattern !== "" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-row-sub", children: insight.pattern })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mengpo-tag", children: String(insight.scope ?? "") }),
            typeof insight.hitCount === "number" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mengpo-tag", children: t("detail.hits", { count: String(insight.hitCount) }) }),
            insight.draft === true && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mengpo-tag mengpo-warn", children: t("status.draft") })
          ]
        },
        insight.id
      )) })
    ] }, kind))
  ] });
}
function kindLabelOf(t, kind) {
  return KIND_ORDER.includes(kind) ? t(`kind.${kind}`) : `${t("kind.other")} \xB7 ${kind}`;
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
  onClose
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-drawer-wrap", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-mask", onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-drawer", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-drawer-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: insight.title }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "mengpo-btn", onClick: onClose, children: t("action.close") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-drawer-body", children: editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { children: t("detail.title") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: form.title, onChange: (event) => onChange({ title: event.target.value }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { children: t("detail.kind") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { value: form.kind, onChange: (event) => onChange({ kind: event.target.value }), children: [
            KIND_ORDER.map((kind) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: kind, children: t(`kind.${kind}`) }, kind)),
            !KIND_ORDER.includes(form.kind) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: form.kind, children: form.kind })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { children: t("detail.scope") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { value: form.scope, onChange: (event) => onChange({ scope: event.target.value }), children: [
            ["project", "global", "task"].map((scope) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: scope, children: scope }, scope)),
            !["project", "global", "task"].includes(form.scope) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: form.scope, children: form.scope })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { children: t("detail.pattern") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { value: form.pattern, onChange: (event) => onChange({ pattern: event.target.value }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { children: t("detail.fix") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { value: form.fix, onChange: (event) => onChange({ fix: event.target.value }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { children: t("detail.files") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { value: form.files, onChange: (event) => onChange({ files: event.target.value }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { children: t("detail.trigger") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { value: form.trigger, onChange: (event) => onChange({ trigger: event.target.value }) })
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, { t, label: t("detail.kind"), value: kindLabelOf(t, String(insight.kind ?? "")) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, { t, label: t("detail.scope"), value: String(insight.scope ?? "") }),
        typeof insight.source === "string" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, { t, label: t("detail.source"), value: insight.source }),
        typeof insight.confidence === "number" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, { t, label: t("detail.confidence"), value: String(insight.confidence) }),
        typeof insight.hitCount === "number" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, { t, label: t("detail.hits", { count: String(insight.hitCount) }), value: "" }),
        typeof insight.createdAt === "string" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, { t, label: t("detail.created"), value: timeText(insight.createdAt) }),
        typeof insight.updatedAt === "string" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, { t, label: t("detail.updated"), value: timeText(insight.updatedAt) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LongText, { label: t("detail.pattern"), value: insight.pattern }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LongText, { label: t("detail.fix"), value: insight.fix }),
        Array.isArray(insight.files) && insight.files.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LongText, { label: t("detail.files"), value: insight.files.join("\n") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LongText, { label: t("detail.trigger"), value: typeof insight.trigger === "string" ? insight.trigger : void 0 })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-drawer-foot", children: editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "mengpo-btn mengpo-primary", disabled: busy, onClick: onSave, children: t("action.save") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "mengpo-btn", disabled: busy, onClick: onCancelEdit, children: t("action.cancel") })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "mengpo-btn", disabled: busy, onClick: onEdit, children: t("action.edit") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "mengpo-btn", disabled: busy, onClick: onToggleDraft, children: insight.draft === true ? t("action.enable") : t("action.disable") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mengpo-spacer", style: { flex: 1 } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: "mengpo-btn mengpo-danger",
            disabled: busy,
            onClick: onDelete,
            children: confirmingDelete ? t("action.delete.confirm") : t("action.delete")
          }
        )
      ] }) })
    ] })
  ] });
}
function Meta({ label, value }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-val", children: value })
  ] });
}
function LongText({ label, value }) {
  if (value === void 0 || value === "") return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mengpo-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mengpo-val", children: value })
  ] });
}

// src/client/styles.ts
var STYLES = `
.mengpo-root { display: flex; flex-direction: column; height: 100%; overflow: hidden;
  color: var(--dsw-alias-label-primary, #1f2329); font-size: 13px; }
.mengpo-toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l2, #e5e6eb); flex: none; }
.mengpo-toolbar .mengpo-spacer { flex: 1; }
.mengpo-seg { display: inline-flex; border: 1px solid var(--dsw-alias-border-l2, #e5e6eb);
  border-radius: 6px; overflow: hidden; }
.mengpo-seg button { border: 0; background: transparent; padding: 4px 10px; cursor: pointer;
  color: var(--dsw-alias-label-secondary, #646a73); font-size: 12px; }
.mengpo-seg button.mengpo-on { background: var(--dsw-alias-interactive-bg-active, #e1eaff);
  color: var(--dsw-alias-label-primary, #1f2329); }
.mengpo-seg button:disabled { opacity: 0.45; cursor: default; }
.mengpo-btn { border: 1px solid var(--dsw-alias-border-l2, #e5e6eb); border-radius: 6px;
  background: var(--dsw-alias-button-tool-bar-fill, transparent); padding: 4px 10px;
  cursor: pointer; font-size: 12px; color: var(--dsw-alias-label-primary, #1f2329); }
.mengpo-btn:hover { background: var(--dsw-alias-button-tool-bar-hover, rgba(31,35,41,0.06)); }
.mengpo-btn:disabled { opacity: 0.5; cursor: default; }
.mengpo-btn.mengpo-primary { background: var(--dsw-alias-button-primary-fill, #3370ff);
  border-color: transparent; color: var(--dsw-alias-label-primary-foreground, #fff); }
.mengpo-btn.mengpo-primary:hover { background: var(--dsw-alias-button-primary-hover, #295fe8); }
.mengpo-btn.mengpo-danger { color: var(--dsw-alias-state-error-primary, #f54a45); }
.mengpo-body { flex: 1; overflow-y: auto; padding: 12px; }
.mengpo-section { margin-bottom: 16px; }
.mengpo-section-title { font-size: 12px; font-weight: 600; margin: 0 0 8px;
  color: var(--dsw-alias-label-secondary, #646a73); }
.mengpo-card { border: 1px solid var(--dsw-alias-border-l2, #e5e6eb); border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, #fff); }
.mengpo-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  cursor: pointer; border-bottom: 1px solid var(--dsw-alias-border-l2, #e5e6eb); }
.mengpo-row:last-child { border-bottom: 0; }
.mengpo-row:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(31,35,41,0.04)); }
.mengpo-row.mengpo-draft { opacity: 0.5; }
.mengpo-row-main { flex: 1; min-width: 0; }
.mengpo-row-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mengpo-row-sub { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8f959e);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mengpo-tag { flex: none; font-size: 10px; padding: 1px 6px; border-radius: 4px;
  background: var(--dsw-alias-bg-layer-2, #f5f6f7); color: var(--dsw-alias-label-secondary, #646a73);
  border: 1px solid var(--dsw-alias-border-l2, #e5e6eb); }
.mengpo-tag.mengpo-warn { color: var(--dsw-alias-state-error-primary, #f54a45);
  border-color: var(--dsw-alias-state-error-primary, #f54a45); }
.mengpo-pre { margin: 0; padding: 12px; white-space: pre-wrap; word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px;
  max-height: 320px; overflow-y: auto; }
.mengpo-empty { padding: 24px 12px; text-align: center;
  color: var(--dsw-alias-label-tertiary, #8f959e); }
.mengpo-error { padding: 10px 12px; border-radius: 8px; margin-bottom: 12px;
  color: var(--dsw-alias-state-error-primary, #f54a45);
  border: 1px solid var(--dsw-alias-state-error-primary, #f54a45); }
.mengpo-mask { position: absolute; inset: 0; background: var(--dsw-alias-bg-mask-1, rgba(31,35,41,0.4)); }
.mengpo-drawer-wrap { position: absolute; inset: 0; z-index: 10; }
.mengpo-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: min(440px, 92%);
  background: var(--dsw-alias-bg-base, #fff); border-left: 1px solid var(--dsw-alias-border-l2, #e5e6eb);
  display: flex; flex-direction: column; box-shadow: -8px 0 24px rgba(31,35,41,0.12); }
.mengpo-drawer-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l2, #e5e6eb); flex: none; }
.mengpo-drawer-head b { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mengpo-drawer-body { flex: 1; overflow-y: auto; padding: 12px; }
.mengpo-field { margin-bottom: 12px; }
.mengpo-field label { display: block; font-size: 11px; margin-bottom: 4px;
  color: var(--dsw-alias-label-tertiary, #8f959e); }
.mengpo-field .mengpo-val { white-space: pre-wrap; word-break: break-word; }
.mengpo-field input, .mengpo-field textarea, .mengpo-field select {
  width: 100%; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2, #e5e6eb);
  border-radius: 6px; padding: 6px 8px; font-size: 12px; font-family: inherit;
  background: var(--dsw-alias-bg-base, #fff); color: var(--dsw-alias-label-primary, #1f2329); }
.mengpo-field textarea { min-height: 72px; resize: vertical; }
.mengpo-drawer-foot { display: flex; gap: 8px; padding: 10px 12px;
  border-top: 1px solid var(--dsw-alias-border-l2, #e5e6eb); flex: none; }
.mengpo-group-head { display: flex; align-items: center; gap: 6px; margin: 12px 0 6px;
  font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-secondary, #646a73); }
`;

// src/client/index.ts
var TAB_ID = "dsh-mengpo";
var inject = ["slots", "locale", "remote"];
var stylesInstalled = false;
function installStyles() {
  if (stylesInstalled) return;
  stylesInstalled = true;
  const style = document.createElement("style");
  style.dataset.plugin = TAB_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}
function createCard(Page) {
  return function MengpoCard(props) {
    const t = props.t ?? ((key) => key);
    if (props.view === "summary") return t("summary");
    return (0, import_react2.createElement)(Page, { t });
  };
}
function apply(ctx) {
  console.error("[dsh-mengpo] apply:start");
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-mengpo: dictionaries");
  installStyles();
  ctx.effect(() => {
    let dispose;
    let disposed = false;
    ctx.remote.$mount(clientContribution()).then((mounted) => {
      if (disposed) {
        void mounted().catch(() => void 0);
        return;
      }
      dispose = mounted;
      console.error("[dsh-mengpo] remote $mount resolved");
    }).catch((error) => {
      const detail = error instanceof Error ? error.stack ?? error.message : String(error);
      console.error(`[dsh-mengpo] remote $mount failed: ${detail}`);
    });
    return () => {
      disposed = true;
      if (dispose !== void 0) void dispose().catch(() => void 0);
    };
  }, "dsh-mengpo: remote namespace");
  ctx.inject(["remote.mengpo"], (scoped) => {
    console.error("[dsh-mengpo] inject remote.mengpo fired");
    const scopedT = scoped.locale.bind(NS);
    const Page = createMemoryPage(scoped.remote.mengpo);
    console.error("[dsh-mengpo] registering plugins.item card");
    scoped.effect(
      () => scoped.slots.inject(
        "plugins.item",
        () => scoped.slots.register(
          {
            name: "plugins.item",
            id: TAB_ID,
            order: 30,
            label: () => scopedT("title"),
            locale: NS,
            inject: () => ({})
          },
          createCard(Page)
        )
      ),
      "dsh-mengpo: plugins page card"
    );
    console.error(
      `[dsh-mengpo] plugins.item entries now: ${scoped.slots.entries("plugins.item").length}`
    );
  });
}
return module.exports;}});
