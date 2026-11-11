import type { LinearGradientInfo } from './parse-linear-gradient';
type LinearGradientMaskImageInfo = {
    type: 'linear-gradient';
    gradientInfo: LinearGradientInfo;
};
export type UrlMaskImageInfo = {
    type: 'url';
    src: string;
    maskSize: string;
    maskRepeat: string;
    maskPosition: string;
};
export type MaskImageInfo = LinearGradientMaskImageInfo | UrlMaskImageInfo;
export declare const getMaskImageValue: (computedStyle: CSSStyleDeclaration) => string | null;
export declare const parseUrlFunction: (value: string) => string | null;
export declare const parseMaskImage: (maskImageValue: string, computedStyle: CSSStyleDeclaration) => MaskImageInfo | null;
export declare const containsUrlMaskImage: (element: HTMLElement) => boolean;
export {};
