export declare const createsStackingContext: (element: Element) => boolean;
export declare const getElementsNeedingIsolation: ({ rootElement, acceptNode, }: {
    rootElement: HTMLElement | SVGElement;
    acceptNode: (node: Node) => number;
}) => WeakSet<Element>;
