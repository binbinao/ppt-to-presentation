export type RasterImageLoaderState = {
    cache: Map<string, Promise<ImageBitmap>>;
    images: Set<ImageBitmap>;
    signal: AbortSignal | null;
    timeoutInMilliseconds: number;
    [Symbol.dispose]: () => void;
};
export declare const makeRasterImageLoaderState: ({ signal, timeoutInMilliseconds, }: {
    signal: AbortSignal | null;
    timeoutInMilliseconds: number;
}) => RasterImageLoaderState;
export declare const getRasterImage: ({ src, state, sourceProperty, }: {
    src: string;
    sourceProperty: 'mask-image' | 'background-image';
    state: RasterImageLoaderState;
}) => Promise<ImageBitmap>;
