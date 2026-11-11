import React from 'react';
import type { TSequence } from './CompositionManager.js';
export declare function useRemotionContexts(): {
    mediaEnabledContext: {
        videoEnabled: boolean | null;
        audioEnabled: boolean | null;
    } | null;
    compositionManagerCtx: import("./CompositionManagerContext.js").CompositionManagerContext;
    videoContext: (import("./video-config.js").VideoConfig & {
        component: React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>> | React.ComponentType<Record<string, unknown>>;
    }) | null;
    timelineContext: import("./TimelineContext.js").TimelineContextValue | null;
    setTimelineContext: import("./TimelineContext.js").SetTimelineContextValue;
    sequenceContext: import("./SequenceContext.js").SequenceContextType | null;
    defaultPremountInSeconds: number;
    timelineTrackContext: import("./timeline-track-context.js").TimelineTrack | null;
    canUseRemotionHooksContext: boolean;
    preloadContext: {
        [x: string]: string;
    };
    resolveCompositionContext: {
        [x: string]: ({
            type: 'loading';
        } | {
            type: 'success';
            result: import("./video-config.js").VideoConfig;
            metadataSource: import("./resolve-video-config.js").VideoConfigMetadataSource | null;
        } | {
            type: 'success-and-refreshing';
            result: import("./video-config.js").VideoConfig;
            metadataSource: import("./resolve-video-config.js").VideoConfigMetadataSource | null;
        } | {
            type: 'error';
            error: Error;
        }) | undefined;
    } | null;
    renderAssetManagerContext: import("./RenderAssetManager.js").RenderAssetManagerContext;
    sequenceManagerActionsContext: import("./sequence-registry-context.js").SequenceManagerActions;
    sequenceManagerRefContext: import("./sequence-registry-context.js").SequenceManagerRef;
    sequenceRegistryContext: import("./registry-store.js").RegistryStore<TSequence[]> | null;
    sequenceRegistryScopeContext: {
        readonly commitRegistrationRequested: boolean;
        readonly onCommitSequences: (scopeId: string, sequences: readonly TSequence[], sequenceIds: readonly string[]) => void;
    } | null;
    sequenceRegistrationContext: boolean;
    disableSequenceRegistrationContext: boolean;
    remotionEnvironmentContext: import("./remotion-environment-context.js").RemotionEnvironment | null;
    visualModePropStatusesRefContext: import("./SequenceManager.js").VisualModePropStatusesRef;
    bufferManagerContext: {
        addBlock: () => {
            unblock: () => void;
        };
    } | null;
    logLevelContext: import("./log-level-context.js").LoggingContextValue;
    effectPreviewContext: {
        readonly setPreview: (preview: {
            readonly runtimeValues: import("./runtime-value-store.js").RuntimeValueStore;
            readonly effect: import("./index.js").EffectDescriptor<unknown>;
        } | null) => void;
        readonly subscribe: (runtimeValues: import("./runtime-value-store.js").RuntimeValueStore | null, listener: () => void) => () => void;
        readonly getSnapshot: (runtimeValues: import("./runtime-value-store.js").RuntimeValueStore | null) => import("./index.js").EffectDescriptor<unknown> | null;
    };
};
export interface RemotionContextProviderProps {
    readonly contexts: ReturnType<typeof useRemotionContexts>;
    readonly children: React.ReactNode;
}
export declare const RemotionContextProvider: (props: RemotionContextProviderProps) => React.JSX.Element;
