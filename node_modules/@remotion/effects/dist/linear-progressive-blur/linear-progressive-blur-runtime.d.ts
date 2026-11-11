import type { LinearProgressiveBlurResolved } from './index.js';
type LinearProgressiveBlurUniforms = {
    readonly uSource: WebGLUniformLocation | null;
    readonly uTexelSize: WebGLUniformLocation | null;
    readonly uStart: WebGLUniformLocation | null;
    readonly uEnd: WebGLUniformLocation | null;
    readonly uStartBlur: WebGLUniformLocation | null;
    readonly uEndBlur: WebGLUniformLocation | null;
};
export type LinearProgressiveBlurState = {
    readonly gl: WebGL2RenderingContext;
    readonly programHorizontal: WebGLProgram;
    readonly programVertical: WebGLProgram;
    readonly vao: WebGLVertexArrayObject;
    readonly vbo: WebGLBuffer;
    readonly textureSource: WebGLTexture;
    readonly textureIntermediate: WebGLTexture;
    readonly framebuffer: WebGLFramebuffer;
    readonly horizontal: LinearProgressiveBlurUniforms;
    readonly vertical: LinearProgressiveBlurUniforms;
};
export declare const setupLinearProgressiveBlur: (target: HTMLCanvasElement) => LinearProgressiveBlurState;
export declare const cleanupLinearProgressiveBlur: (state: LinearProgressiveBlurState) => void;
export declare const applyLinearProgressiveBlur: ({ state, source, width, height, params, flipSourceY, }: {
    readonly state: LinearProgressiveBlurState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly params: LinearProgressiveBlurResolved;
    readonly flipSourceY: boolean;
}) => void;
export {};
