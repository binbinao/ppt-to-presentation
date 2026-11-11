import { type MaskImageInfo } from './mask-image';
export declare const getBlendMode: (mixBlendMode: string) => GlobalCompositeOperation | null;
type TransformStyle = Pick<CSSStyleDeclaration, 'display' | 'rotate' | 'scale' | 'transform' | 'transformOrigin'>;
export type TransformStyleCache = WeakMap<Element, TransformStyle>;
export declare const calculateTransforms: ({ element, rootElement, transformStyleCache, isolated, }: {
    element: HTMLElement | SVGElement;
    rootElement: HTMLElement | SVGElement;
    transformStyleCache: TransformStyleCache;
    isolated: boolean;
}) => {
    dimensions: DOMRect;
    totalMatrix: DOMMatrix;
    hasCssTransform: boolean;
    [Symbol.dispose]: () => void;
    nativeTransformOrigin: {
        x: number;
        y: number;
    };
    computedStyle: CSSStyleDeclaration;
    opacity: number;
    maskImageInfo: MaskImageInfo | null;
    precompositing: {
        needs3DTransformViaWebGL: boolean;
        needsMaskImage: MaskImageInfo | null;
        needsFilterPrecompositing: string | null;
        needsBlendMode: GlobalCompositeOperation | null;
        needsIsolation: boolean;
        needsPrecompositing: boolean;
    };
};
export {};
