import {
  LocalJsonDataSource,
  MengpoError
} from "./chunk-S7AJP5TK.js";
import "./chunk-YSAPYWNP.js";

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
    parameters: spec.params.map((name2) => ({ name: name2, wire: name2, source: "json", codec: codecOf(name2) })),
    cancellation: { parameter: "signal" },
    result: { mode: "src-json" }
  };
}
function hostContribution() {
  return {
    package: REMOTE_PACKAGE,
    face: "host",
    schemas: [],
    invocations: REMOTE_METHODS.map((spec) => descriptorOf(spec, () => ({ mode: "src-json" })))
  };
}

// src/host/index.ts
var name = "dsh-mengpo";
var inject = ["typert"];
function asRemoteError(error) {
  if (typeof error === "object" && error !== null && error.isDSHRemoteError === true) {
    return error;
  }
  return new MengpoError("mengpo/internal", error?.message ?? String(error));
}
async function guard(operation) {
  try {
    return await operation();
  } catch (error) {
    throw asRemoteError(error);
  }
}
function apply(ctx, config) {
  const source = new LocalJsonDataSource(config);
  const service = {
    listProjects: (cwd, _signal) => guard(() => source.listProjects(cwd ?? null)),
    getGlobal: (_signal) => guard(() => source.getGlobal()),
    getProject: (path, _signal) => guard(() => source.getProject(path)),
    updateInsight: (projectPath, insight, _signal) => guard(() => source.updateInsight(projectPath, insight)),
    deleteInsight: (projectPath, insightId, _signal) => guard(() => source.deleteInsight(projectPath, insightId)),
    setInsightDraft: (projectPath, insightId, draft, _signal) => guard(() => source.setInsightDraft(projectPath, insightId, draft)),
    refresh: (cwd, _signal) => guard(() => source.listProjects(cwd ?? null))
  };
  Object.defineProperty(service, "typertRemote", {
    value: Object.freeze({ service, serviceKey: REMOTE_NAMESPACE, namespace: REMOTE_NAMESPACE }),
    enumerable: true
  });
  ctx.provide(REMOTE_NAMESPACE, service);
  ctx.effect(() => ctx.typert.register(hostContribution()), "dsh-mengpo: typert remote");
}
export {
  apply,
  inject,
  name
};
