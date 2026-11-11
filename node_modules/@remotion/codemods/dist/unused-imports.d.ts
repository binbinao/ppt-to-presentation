import type { Node } from '@babel/types';
export declare const collectReferencedNames: (node: Node) => Set<string>;
export declare const removeUnusedImports: ({ input, localNames, }: {
    input: string;
    localNames: Set<string>;
}) => string;
