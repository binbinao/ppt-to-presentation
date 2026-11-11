import type { CodemodProject } from './codemod-project';
import type { CompositionTarget } from './composition-editing';
import { type CompositionDestination } from './folder-editing';
export type MoveCompositionOptions<Project extends CodemodProject> = CompositionTarget & {
    project: Project;
    destination: CompositionDestination;
    destinationFile?: string | null;
};
export declare const moveComposition: <Project extends CodemodProject>({ project, compositionFile, compositionId, destination, destinationFile, }: MoveCompositionOptions<Project>) => import("./codemod-project").CodemodResult & {
    nodePathRemappings: import("./node-references").NodePathRemapping[];
} & {
    updatedNode: import("./node-references").NodeReference;
};
