import type { MengpoRemote } from './index.js';
type Remote = MengpoRemote['mengpo'];
type TFunction = (key: string, params?: Record<string, string>) => string;
interface PageProps {
    useTabInfo?: () => {
        tab: {
            signal?: AbortSignal;
            navigation?: {
                params?: Record<string, unknown>;
            };
        };
    };
    sessionId?: string;
    useSessions?: <T>(selector: (sessions: {
        byId: Record<string, {
            cwd?: string;
        }>;
    }) => T) => T;
    t?: TFunction;
}
export declare function createMemoryPage(remote: Remote): (props: PageProps) => import("react").JSX.Element;
export {};
