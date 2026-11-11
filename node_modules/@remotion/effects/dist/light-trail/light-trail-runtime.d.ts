import type { ParsedColorRgba } from '../color-utils.js';
export type LightTrailState = {
    readonly gl: WebGL2RenderingContext;
    readonly program: WebGLProgram;
    readonly vao: WebGLVertexArrayObject;
    readonly vbo: WebGLBuffer;
    readonly textureSource: WebGLTexture;
    readonly uniforms: {
        readonly uSource: WebGLUniformLocation | null;
        readonly uDirection: WebGLUniformLocation | null;
        readonly uTexelSize: WebGLUniformLocation | null;
        readonly uColor: WebGLUniformLocation | null;
        readonly uDistance: WebGLUniformLocation | null;
        readonly uIntensity: WebGLUniformLocation | null;
        readonly uDecay: WebGLUniformLocation | null;
        readonly uThreshold: WebGLUniformLocation | null;
        readonly uSamples: WebGLUniformLocation | null;
    };
    readonly colorCtx: CanvasRenderingContext2D;
    cachedColorStr: string;
    cachedColorRgba: ParsedColorRgba;
};
export declare const setupLightTrail: (target: HTMLCanvasElement) => LightTrailState;
export declare const cleanupLightTrail: (state: LightTrailState) => void;
export declare const applyLightTrail: ({ state, source, width, height, direction, distance, intensity, decay, threshold, samples, color, flipSourceY, }: {
    readonly state: LightTrailState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly direction: number;
    readonly distance: number;
    readonly intensity: number;
    readonly decay: number;
    readonly threshold: number;
    readonly samples: number;
    readonly color: ParsedColorRgba;
    readonly flipSourceY: boolean;
}) => void;
