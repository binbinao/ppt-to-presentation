export type BarrelDistortionState = {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    vao: WebGLVertexArrayObject;
    vbo: WebGLBuffer;
    textureSource: WebGLTexture;
    uniforms: {
        uSource: WebGLUniformLocation | null;
        uAmount: WebGLUniformLocation | null;
    };
};
export declare const setupBarrelDistortion: (target: HTMLCanvasElement) => BarrelDistortionState;
export declare const cleanupBarrelDistortion: (state: BarrelDistortionState) => void;
export declare const applyBarrelDistortion: ({ state, source, width, height, amount, flipSourceY, }: {
    readonly state: BarrelDistortionState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly amount: number;
    readonly flipSourceY: boolean;
}) => void;
