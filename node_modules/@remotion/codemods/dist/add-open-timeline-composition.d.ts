import type { CodemodProject } from './codemod-project';
import type { CompositionTarget, FolderReference } from './composition-editing';
import type { CodemodInsertionResult } from './node-references';
import { type OpenTimelineAnnotation, type OpenTimelineAsset, type OpenTimelineDiagnostic, type OpenTimelineMediaResolver } from './open-timeline/generate';
export type AddOpenTimelineCompositionOptions<Project extends CodemodProject> = CompositionTarget & {
    project: Project;
    component: {
        filePath: string;
        importName: string;
        importPath: string;
    };
    timeline: unknown;
    fps: number;
    width: number;
    height: number;
    folder?: FolderReference;
    resolveMedia?: OpenTimelineMediaResolver;
};
export type AddOpenTimelineCompositionResult = CodemodInsertionResult & {
    diagnostics: OpenTimelineDiagnostic[];
    assets: OpenTimelineAsset[];
    annotations: OpenTimelineAnnotation[];
    globalStartTime: {
        value: number;
        rate: number;
    } | null;
};
export declare class OpenTimelineImportError extends Error {
    readonly diagnostics: OpenTimelineDiagnostic[];
    constructor(diagnostics: OpenTimelineDiagnostic[]);
}
export declare const addOpenTimelineComposition: <Project extends CodemodProject>({ project, compositionFile, compositionId, component, timeline, fps, width, height, folder, resolveMedia, }: AddOpenTimelineCompositionOptions<Project>) => AddOpenTimelineCompositionResult;
