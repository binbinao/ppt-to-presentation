import type { SequenceNodePathInfo } from './get-timeline-sequence-sort-key';
type EffectSelection = {
    readonly nodePathInfo: SequenceNodePathInfo;
    readonly id: string;
};
type SelectEffects = (items: readonly EffectSelection[], reveal: boolean) => void;
export declare const registerOptimisticEffectSelection: (callback: SelectEffects) => () => void;
export declare const selectOptimisticEffects: (items: readonly EffectSelection[], reveal: boolean) => void | undefined;
export declare const selectOptimisticEffect: (nodePathInfo: SequenceNodePathInfo, id: string, reveal: boolean) => void | undefined;
export {};
