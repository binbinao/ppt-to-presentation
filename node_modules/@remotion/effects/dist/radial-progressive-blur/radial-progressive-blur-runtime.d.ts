import type { RadialProgressiveBlurResolved } from './index.js';
type RadialProgressiveBlurUniforms = {
    readonly uSource: WebGLUniformLocation | null;
    readonly uTexelSize: WebGLUniformLocation | null;
    readonly uCenter: WebGLUniformLocation | null;
    readonly uWidth: WebGLUniformLocation | null;
    readonly uHeight: WebGLUniformLocation | null;
    readonly uRotation: WebGLUniformLocation | null;
    readonly uStart: WebGLUniformLocation | null;
    readonly uStartBlur: WebGLUniformLocation | null;
    readonly uEndBlur: WebGLUniformLocation | null;
};
export type RadialProgressiveBlurState = {
    readonly gl: WebGL2RenderingContext;
    readonly programHorizontal: WebGLProgram;
    readonly programVertical: WebGLProgram;
    readonly vao: WebGLVertexArrayObject;
    readonly vbo: WebGLBuffer;
    readonly textureSource: WebGLTexture;
    readonly textureIntermediate: WebGLTexture;
    readonly framebuffer: WebGLFramebuffer;
    readonly horizontal: RadialProgressiveBlurUniforms;
    readonly vertical: RadialProgressiveBlurUniforms;
};
export declare const setupRadialProgressiveBlur: (target: HTMLCanvasElement) => RadialProgressiveBlurState;
export declare const cleanupRadialProgressiveBlur: (state: RadialProgressiveBlurState) => void;
export declare const applyRadialProgressiveBlur: ({ state, source, width, height, params, flipSourceY, }: {
    readonly state: RadialProgressiveBlurState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly params: RadialProgressiveBlurResolved;
    readonly flipSourceY: boolean;
}) => void;
export {};
