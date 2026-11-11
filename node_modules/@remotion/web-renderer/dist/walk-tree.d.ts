export declare function skipToNextNonDescendant(treeWalker: TreeWalker, nextSibling?: (() => Node | null) | null): boolean;
export declare const createPaintOrderTraversal: ({ treeWalker, rootElement, acceptNode, onlyBackgroundClipText, }: {
    treeWalker: TreeWalker;
    rootElement: HTMLElement | SVGElement;
    acceptNode: (node: Node) => number;
    onlyBackgroundClipText: boolean;
}) => {
    skipChildren: () => boolean;
    nextNode: () => boolean;
};
