import { type File } from '@babel/types';
import type { TreeEntry } from './folder-editing';
import { type SourceEdit } from './source-edits';
export declare const transferRegistrationImports: ({ input, ast, entry, filePath, destinationInput, destinationAst, destinationFile, }: {
    input: string;
    ast: File;
    entry: TreeEntry;
    filePath: string;
    destinationInput: string;
    destinationAst: File;
    destinationFile: string;
}) => {
    input: string;
    localNames: Set<string>;
    importEdits: SourceEdit[];
};
