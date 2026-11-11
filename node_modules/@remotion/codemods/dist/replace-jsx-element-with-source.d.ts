import type { CodemodProject } from './codemod-project';
import { type NodeReference } from './node-references';
export type ReplaceJsxElementWithSourceOptions<Project extends CodemodProject> = {
    project: Project;
    node: NodeReference;
    source: string;
    importStatements: string[];
};
export declare const replaceJsxElementWithSource: <Project extends CodemodProject>({ project, node, source, importStatements, }: ReplaceJsxElementWithSourceOptions<Project>) => {
    changes: import("./codemod-project").CodemodFileChange[];
    nodePathRemappings: import("./node-references").NodePathRemapping[];
    logLine: number;
};
