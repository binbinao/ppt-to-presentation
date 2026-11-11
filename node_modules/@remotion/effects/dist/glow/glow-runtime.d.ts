import type { ParsedColorRgba } from '../color-utils.js';
export type GlowState = {
    readonly gl: WebGL2RenderingContext;
    readonly programExtract: WebGLProgram;
    readonly programHorizontal: WebGLProgram;
    readonly programVertical: WebGLProgram;
    readonly programComposite: WebGLProgram;
    readonly vao: WebGLVertexArrayObject;
    readonly vbo: WebGLBuffer;
    readonly textureSource: WebGLTexture;
    readonly textureGlowA: WebGLTexture;
    readonly textureGlowB: WebGLTexture;
    readonly framebuffer: WebGLFramebuffer;
    readonly extract: {
        readonly uSource: WebGLUniformLocation | null;
        readonly uColor: WebGLUniformLocation | null;
        readonly uThreshold: WebGLUniformLocation | null;
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
        readonly uGlow: WebGLUniformLocation | null;
        readonly uIntensity: WebGLUniformLocation | null;
    };
    readonly colorCtx: CanvasRenderingContext2D;
    cachedColorStr: string;
    cachedColorRgba: ParsedColorRgba;
};
export declare const setupGlow: (target: HTMLCanvasElement) => GlowState;
export declare const cleanupGlow: ({ gl, programExtract, programHorizontal, programVertical, programComposite, vao, vbo, textureSource, textureGlowA, textureGlowB, framebuffer, }: GlowState) => void;
type ApplyGlowParams = {
    readonly state: GlowState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly radius: number;
    readonly intensity: number;
    readonly threshold: number;
    readonly color: ParsedColorRgba;
    readonly flipSourceY: boolean;
};
export declare const applyGlow: ({ state, source, width, height, radius, intensity, threshold, color, flipSourceY, }: ApplyGlowParams) => void;
export {};
