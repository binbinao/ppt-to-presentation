import type { ParsedCubeLut } from './parse-cube-lut.js';
export type LutState = {
    readonly gl: WebGL2RenderingContext;
    readonly program: WebGLProgram;
    readonly vao: WebGLVertexArrayObject;
    readonly vbo: WebGLBuffer;
    readonly sourceTexture: WebGLTexture;
    readonly lutTexture: WebGLTexture;
    readonly uniforms: {
        readonly uSource: WebGLUniformLocation | null;
        readonly uLut: WebGLUniformLocation | null;
        readonly uLutSize: WebGLUniformLocation | null;
        readonly uDomainMin: WebGLUniformLocation | null;
        readonly uDomainMax: WebGLUniformLocation | null;
    };
    cachedContent: string | null;
};
export declare const setupLut: (target: HTMLCanvasElement) => LutState;
export declare const applyLut: ({ state, source, width, height, content, parsed, flipSourceY, }: {
    readonly state: LutState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly content: string;
    readonly parsed: ParsedCubeLut;
    readonly flipSourceY: boolean;
}) => void;
export declare const cleanupLut: ({ gl, program, vao, vbo, sourceTexture, lutTexture, }: LutState) => void;
