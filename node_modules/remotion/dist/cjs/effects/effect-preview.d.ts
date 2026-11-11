import React from 'react';
import type { RuntimeValueStore } from '../runtime-value-store.js';
import type { EffectDescriptor } from './effect-types.js';
type EffectPreview = {
    readonly runtimeValues: RuntimeValueStore;
    readonly effect: EffectDescriptor<unknown>;
};
type EffectPreviewStore = {
    readonly setPreview: (preview: EffectPreview | null) => void;
    readonly subscribe: (runtimeValues: RuntimeValueStore | null, listener: () => void) => () => void;
    readonly getSnapshot: (runtimeValues: RuntimeValueStore | null) => EffectDescriptor<unknown> | null;
};
export declare const EffectPreviewContext: React.Context<EffectPreviewStore>;
export declare const EffectPreviewProvider: React.FC<{
    readonly children: React.ReactNode;
}>;
export declare const useEffectPreview: (runtimeValues: RuntimeValueStore | null) => EffectDescriptor<unknown> | null;
export {};
