export type ShatterState = {
    readonly gl: WebGL2RenderingContext;
    readonly program: WebGLProgram;
    readonly vao: WebGLVertexArrayObject;
    readonly vbo: WebGLBuffer;
    readonly texture: WebGLTexture;
    readonly uSource: WebGLUniformLocation | null;
    readonly uResolution: WebGLUniformLocation | null;
};
export declare const setupShatter: (gl: WebGL2RenderingContext) => ShatterState;
export declare const drawShatter: ({ state, source, width, height, flipSourceY, vertices, }: {
    readonly state: ShatterState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly flipSourceY: boolean;
    readonly vertices: Float32Array;
}) => void;
export declare const cleanupShatter: ({ gl, program, vao, vbo, texture, }: ShatterState) => void;
