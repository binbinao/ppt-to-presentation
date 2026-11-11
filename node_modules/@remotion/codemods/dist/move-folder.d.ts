import type { AddFolderOptions } from './add-folder';
import type { CodemodProject } from './codemod-project';
import { type CompositionDestination } from './folder-editing';
export type MoveFolderOptions<Project extends CodemodProject> = AddFolderOptions<Project> & {
    destination: CompositionDestination;
    destinationFile?: string | null;
};
export declare const moveFolder: <Project extends CodemodProject>({ project, compositionFile, folder, destination, destinationFile, }: MoveFolderOptions<Project>) => import("./codemod-project").CodemodResult & {
    nodePathRemappings: import("./node-references").NodePathRemapping[];
} & {
    updatedNode: import("./node-references").NodeReference;
};
