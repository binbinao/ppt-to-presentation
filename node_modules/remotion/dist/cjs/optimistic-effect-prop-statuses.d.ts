import type { SequencePropsSubscriptionKey } from './SequenceManager.js';
import type { CanUpdateSequencePropSource } from './use-schema.js';
type NodePath = SequencePropsSubscriptionKey;
type Props = Record<string, CanUpdateSequencePropSource>;
export declare const OptimisticEffectPropStatuses: {
    get: (nodePath: NodePath, id: string) => Props | null;
    set: (nodePath: NodePath, id: string, props: Props | null) => void;
    copy: (nodePath: NodePath, fromId: string, toId: string) => void;
    removeNode: (nodePath: NodePath) => void;
    remap: (remappings: readonly {
        oldNodePath: NodePath;
        nodePath: NodePath | null;
    }[]) => void;
    clear: () => void;
    subscribe: (listener: (nodePath: NodePath) => void) => () => void;
};
export {};
