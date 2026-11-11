export type CornerPinState = {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    vao: WebGLVertexArrayObject;
    vbo: WebGLBuffer;
    textureSource: WebGLTexture;
    uniforms: {
        uSource: WebGLUniformLocation | null;
        uTopLeft: WebGLUniformLocation | null;
        uTopRight: WebGLUniformLocation | null;
        uBottomRight: WebGLUniformLocation | null;
        uBottomLeft: WebGLUniformLocation | null;
    };
};
export declare const setupCornerPin: (target: HTMLCanvasElement) => CornerPinState;
export declare const cleanupCornerPin: (state: CornerPinState) => void;
export declare const applyCornerPin: ({ state, source, width, height, topLeft, topRight, bottomRight, bottomLeft, flipSourceY, }: {
    readonly state: CornerPinState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly topLeft: readonly [number, number];
    readonly topRight: readonly [number, number];
    readonly bottomRight: readonly [number, number];
    readonly bottomLeft: readonly [number, number];
    readonly flipSourceY: boolean;
}) => void;
