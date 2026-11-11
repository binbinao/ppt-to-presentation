import type { RegionBlurUvCoordinate } from './index.js';
type BlurUniforms = {
    readonly source: WebGLUniformLocation | null;
    readonly radius: WebGLUniformLocation | null;
    readonly texelSize: WebGLUniformLocation | null;
};
export type RegionBlurState = {
    readonly gl: WebGL2RenderingContext;
    readonly horizontalProgram: WebGLProgram;
    readonly verticalProgram: WebGLProgram;
    readonly compositeProgram: WebGLProgram;
    readonly vao: WebGLVertexArrayObject;
    readonly vbo: WebGLBuffer;
    readonly sourceTexture: WebGLTexture;
    readonly horizontalTexture: WebGLTexture;
    readonly blurredTexture: WebGLTexture;
    readonly framebuffer: WebGLFramebuffer;
    readonly horizontalUniforms: BlurUniforms;
    readonly verticalUniforms: BlurUniforms;
    readonly compositeUniforms: {
        readonly source: WebGLUniformLocation | null;
        readonly blurred: WebGLUniformLocation | null;
        readonly resolution: WebGLUniformLocation | null;
        readonly topLeft: WebGLUniformLocation | null;
        readonly bottomRight: WebGLUniformLocation | null;
        readonly feather: WebGLUniformLocation | null;
        readonly roundness: WebGLUniformLocation | null;
    };
};
export declare const setupRegionBlur: (target: HTMLCanvasElement) => RegionBlurState;
export declare const applyRegionBlur: ({ state, source, width, height, flipSourceY, topLeft, bottomRight, blurRadius, feather, roundness, }: {
    readonly state: RegionBlurState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly flipSourceY: boolean;
    readonly topLeft: RegionBlurUvCoordinate;
    readonly bottomRight: RegionBlurUvCoordinate;
    readonly blurRadius: number;
    readonly feather: number;
    readonly roundness: number;
}) => void;
export declare const cleanupRegionBlur: (state: RegionBlurState) => void;
export {};
