export type HotMiddlewareMessage = {
    action: 'project-unchanged';
    hash: string;
    previousMutationId: string | null;
    sourceMutationId: string;
} | {
    action: 'building';
    name?: string;
} | {
    action: 'built' | 'sync';
    name: string;
    time: number | undefined;
    errors: unknown[];
    warnings: unknown[];
    hash: string | undefined;
    sourceMutationId: string | null;
    modules: {
        [key: string]: string;
    };
};
export declare const hotMiddlewareOptions: {
    timeout: number;
    reload: boolean;
    warn: boolean;
};
export type HotMiddlewareOptions = typeof hotMiddlewareOptions;
export type ModuleMap = {
    [key: string]: string;
};
