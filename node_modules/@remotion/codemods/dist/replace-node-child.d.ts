import type { CodemodElement } from './codemod-element';
import type { CodemodProject } from './codemod-project';
import { type NodeReference } from './node-references';
export type ReplaceNodeChildOptions<Project extends CodemodProject> = {
    project: Project;
    node: NodeReference;
    element: CodemodElement;
};
export declare const replaceNodeChild: <Project extends CodemodProject>({ project, node, element, }: ReplaceNodeChildOptions<Project>) => {
    changes: import("./codemod-project").CodemodFileChange[];
    nodePathRemappings: import("./node-references").NodePathRemapping[];
    logLine: number;
    replacedSource: string;
    replacedImports: string[];
    sceneImportSource: string | null;
};
