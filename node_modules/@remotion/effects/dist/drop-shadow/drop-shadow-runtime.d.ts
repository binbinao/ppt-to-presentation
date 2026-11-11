import type { ParsedColorRgba } from '../color-utils.js';
export type DropShadowState = {
    readonly gl: WebGL2RenderingContext;
    readonly programExtract: WebGLProgram;
    readonly programHorizontal: WebGLProgram;
    readonly programVertical: WebGLProgram;
    readonly programComposite: WebGLProgram;
    readonly vao: WebGLVertexArrayObject;
    readonly vbo: WebGLBuffer;
    readonly textureSource: WebGLTexture;
    readonly textureShadowA: WebGLTexture;
    readonly textureShadowB: WebGLTexture;
    readonly framebuffer: WebGLFramebuffer;
    readonly extract: {
        readonly uSource: WebGLUniformLocation | null;
        readonly uColor: WebGLUniformLocation | null;
        readonly uOpacity: WebGLUniformLocation | null;
    };
    readonly horizontal: {
        readonly uRadius: WebGLUniformLocation | null;
        readonly uTexelSize: WebGLUniformLocation | null;
        readonly uSource: WebGLUniformLocation | null;
    };
    readonly vertical: {
        readonly uRadius: WebGLUniformLocation | null;
        readonly uTexelSize: WebGLUniformLocation | null;
        readonly uSource: WebGLUniformLocation | null;
    };
    readonly composite: {
        readonly uSource: WebGLUniformLocation | null;
        readonly uShadow: WebGLUniformLocation | null;
        readonly uOffset: WebGLUniformLocation | null;
        readonly uTexelSize: WebGLUniformLocation | null;
    };
    readonly colorCtx: CanvasRenderingContext2D;
    cachedColorStr: string;
    cachedColorRgba: ParsedColorRgba;
};
export declare const setupDropShadow: (target: HTMLCanvasElement) => DropShadowState;
export declare const cleanupDropShadow: ({ gl, programExtract, programHorizontal, programVertical, programComposite, vao, vbo, textureSource, textureShadowA, textureShadowB, framebuffer, }: DropShadowState) => void;
type ApplyDropShadowParams = {
    readonly state: DropShadowState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly radius: number;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly opacity: number;
    readonly color: ParsedColorRgba;
    readonly flipSourceY: boolean;
};
export declare const applyDropShadow: ({ state, source, width, height, radius, offsetX, offsetY, opacity, color, flipSourceY, }: ApplyDropShadowParams) => void;
export {};
