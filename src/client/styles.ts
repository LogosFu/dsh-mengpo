/** 梦婆·记忆 —— 页面样式（前缀 mengpo-，只引用 --dsw-alias-* 令牌并带兜底值）。 */

export const STYLES = `
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
