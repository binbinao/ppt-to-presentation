import type { CompositionMetadata } from '../composition-editing';
import type { OpenTimelineAnnotation, OpenTimelineDiagnostic } from './types';
export type { OpenTimelineAnnotation, OpenTimelineDiagnostic } from './types';
export type OpenTimelineResolvedMedia = {
    src: string;
    source: 'url' | 'public';
    kind: 'video' | 'audio' | 'image';
};
/** For image sequences, targetUrl and the returned src are directory bases. */
export type OpenTimelineMediaResolver = (options: {
    reference: Readonly<Record<string, unknown>>;
    targetUrl: string | null;
    path: string;
    trackKind: 'Video' | 'Audio';
}) => OpenTimelineResolvedMedia | null;
export type OpenTimelineAsset = Omit<OpenTimelineResolvedMedia, 'kind'> & {
    path: string;
    kind: OpenTimelineResolvedMedia['kind'] | 'image-sequence';
};
export type GenerateOpenTimelineCompositionOptions = {
    timeline: unknown;
    componentName: string;
    fps: number;
    width: number;
    height: number;
    resolveMedia?: OpenTimelineMediaResolver;
};
export type GenerateOpenTimelineCompositionResult = {
    source: string | null;
    metadata: CompositionMetadata | null;
    diagnostics: OpenTimelineDiagnostic[];
    assets: OpenTimelineAsset[];
    annotations: OpenTimelineAnnotation[];
    globalStartTime: {
        value: number;
        rate: number;
    } | null;
};
/** Pure, synchronous compilation. No filesystem access, media probing or downloads. */
export declare const generateOpenTimelineComposition: ({ timeline, componentName, fps, width, height, resolveMedia, }: GenerateOpenTimelineCompositionOptions) => GenerateOpenTimelineCompositionResult;
