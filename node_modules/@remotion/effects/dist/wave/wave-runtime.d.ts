export type WaveState = {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    vao: WebGLVertexArrayObject;
    vbo: WebGLBuffer;
    textureSource: WebGLTexture;
    uniforms: {
        uSource: WebGLUniformLocation | null;
        uResolution: WebGLUniformLocation | null;
        uAmplitude: WebGLUniformLocation | null;
        uWavelength: WebGLUniformLocation | null;
        uPhase: WebGLUniformLocation | null;
        uDirection: WebGLUniformLocation | null;
    };
};
export declare const setupWave: (target: HTMLCanvasElement) => WaveState;
export declare const cleanupWave: (state: WaveState) => void;
type ApplyWaveParams = {
    readonly state: WaveState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly flipSourceY: boolean;
    readonly amplitude: number;
    readonly wavelength: number;
    readonly phase: number;
    readonly direction: 'horizontal' | 'vertical';
};
export declare const applyWave: ({ state, source, width, height, flipSourceY, amplitude, wavelength, phase, direction, }: ApplyWaveParams) => void;
export {};
