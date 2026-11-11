import type { Node } from '@babel/types';
export type LazyComponentImport = {
    importPath: string;
    exportName: string | 'default';
};
export declare const getLazyComponentImport: (lazyComponent: Node) => LazyComponentImport | null;
