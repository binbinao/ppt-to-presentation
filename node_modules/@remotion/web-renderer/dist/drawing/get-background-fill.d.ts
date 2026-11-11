import type { InternalState } from '../internal-state';
export declare const isColorTransparent: (color: string) => boolean;
export declare const getBackgroundFill: ({ backgroundImage, backgroundPosition, backgroundSize, backgroundRepeat, internalState, positioningArea, contextToDraw, boundingRect, offsetLeft, offsetTop, }: {
    backgroundImage: string;
    backgroundPosition: string;
    backgroundSize: string;
    backgroundRepeat: string;
    internalState: InternalState;
    positioningArea: DOMRect;
    contextToDraw: OffscreenCanvasRenderingContext2D;
    boundingRect: DOMRect;
    offsetLeft: number;
    offsetTop: number;
}) => Promise<CanvasGradient | CanvasPattern | {
    image: ImageBitmap;
    rects: Iterable<DOMRect>;
} | null>;
