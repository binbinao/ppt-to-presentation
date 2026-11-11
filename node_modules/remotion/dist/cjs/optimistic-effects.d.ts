import type { EffectDefinition, EffectDescriptor } from './effects/effect-types.js';
import type { SequencePropsSubscriptionKey } from './SequenceManager.js';
import type { CanUpdateSequencePropSource } from './use-schema.js';
type EffectId = string;
type NodePath = SequencePropsSubscriptionKey;
type Definition = EffectDefinition<unknown>;
type Descriptor = EffectDescriptor<unknown>;
type Item = {
    readonly id: EffectId;
    readonly definition: Definition;
    readonly originId: EffectId | null;
    readonly descriptor: Descriptor | null;
};
export type OptimisticEffectItem = Item & {
    readonly sourceIndex: number | null;
    readonly runtimeSourceIndex: number | null;
    readonly persistedIndex: number | null;
    readonly propStatuses: Record<string, CanUpdateSequencePropSource> | null;
};
export type OptimisticEffectAction = {
    readonly type: 'restore';
    readonly fromItems: readonly OptimisticEffectItem[];
    readonly movedIds: readonly EffectId[];
    readonly items: readonly OptimisticEffectItem[];
} | {
    readonly type: 'delete';
    readonly ids: readonly EffectId[];
} | {
    readonly type: 'duplicate';
    readonly ids: readonly EffectId[];
} | {
    readonly type: 'add';
    readonly definition: Definition;
    readonly descriptor: Descriptor | null;
    readonly index: number | null;
} | {
    readonly type: 'reorder';
    readonly id: EffectId;
    readonly beforeId: EffectId | null;
};
type OperationAction = Exclude<OptimisticEffectAction, {
    type: 'add';
}> | {
    readonly type: 'add';
    readonly beforeId: EffectId | null;
};
export type OptimisticEffectOperation = {
    readonly id: number;
    readonly addedIds: readonly EffectId[];
    readonly action: OperationAction;
    status: 'queued' | 'acknowledged' | 'settled' | 'failed' | 'cancelled';
    mutationId: string | null;
    nodePath: NodePath;
};
export type OptimisticEffectSnapshot = {
    readonly nodePath: NodePath;
    readonly compiledItems: readonly OptimisticEffectItem[];
    readonly persistedItems: readonly OptimisticEffectItem[];
    readonly items: readonly OptimisticEffectItem[];
    readonly operations: readonly OptimisticEffectOperation[];
};
declare const acknowledgeOperations: (operations: readonly OptimisticEffectOperation[], mutationId: string) => void;
export declare const OptimisticEffects: {
    get: (nodePath: NodePath) => OptimisticEffectSnapshot | null;
    getItems: (nodePath: NodePath, definitions: readonly Definition[] | null) => readonly OptimisticEffectItem[];
    getSnapshot: () => readonly OptimisticEffectSnapshot[];
    startSourceMutation: (revision: number) => void;
    finishSourceMutation: (revision: number) => void;
    startRefresh: () => void;
    acknowledgeMutation: (mutationId: string) => void;
    getPropStatuses: (nodePath: NodePath, id: EffectId) => {
        [x: string]: CanUpdateSequencePropSource;
    } | null;
    setPropStatuses: (nodePath: NodePath, id: EffectId, props: Record<string, CanUpdateSequencePropSource> | null) => void;
    subscribe: (listener: () => void) => () => void;
    subscribeToNode: (nodePath: NodePath, listener: () => void) => () => void;
    begin: ({ nodePath, definitions, action, }: {
        nodePath: NodePath;
        definitions: readonly Definition[];
        action: OptimisticEffectAction;
    }) => OptimisticEffectOperation;
    resolveIndex: (nodePath: NodePath, id: EffectId) => number | null;
    getOperationStatus: (operation: OptimisticEffectOperation) => "acknowledged" | "cancelled" | "failed" | "queued" | "settled";
    setAddedDescriptor: (operation: OptimisticEffectOperation, descriptor: Descriptor) => void;
    acknowledge: (operation: OptimisticEffectOperation, mutationId: string) => void;
    acknowledgeOperations: typeof acknowledgeOperations;
    settle: (mutationIds: readonly string[]) => void;
    rollback: (operation: OptimisticEffectOperation) => void;
    remap: (remappings: readonly {
        oldNodePath: NodePath;
        nodePath: NodePath | null;
    }[]) => void;
    clear: () => void;
    invalidateFile: (absolutePath: string) => void;
    reconcile: (nodePath: NodePath, definitions: readonly Definition[]) => void;
    projectEffects: (nodePath: NodePath | null, effects: readonly Descriptor[], history: Map<string, Descriptor> | null) => {
        effects: readonly Descriptor[];
        sourceIndices: readonly (number | null)[] | null;
        itemIds: readonly string[] | null;
    };
};
export declare const useOptimisticEffects: (nodePath: NodePath | null) => OptimisticEffectSnapshot | null;
export {};
