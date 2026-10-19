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
import { type ScannerOptions } from './scanner.js';
export declare const name = "dsh-mengpo";
export declare const inject: string[];
export interface MengpoConfig extends ScannerOptions {
}
interface CordisContext {
    provide(key: string, value: unknown): void;
    effect(effect: () => unknown, label?: string): unknown;
    typert: {
        register(contribution: unknown): () => void;
    };
    [key: string]: unknown;
}
export declare function apply(ctx: CordisContext, config?: MengpoConfig): void;
export {};
