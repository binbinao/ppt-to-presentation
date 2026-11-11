export type FisheyeState = {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    vao: WebGLVertexArrayObject;
    vbo: WebGLBuffer;
    textureSource: WebGLTexture;
    uniforms: {
        uSource: WebGLUniformLocation | null;
        uCenter: WebGLUniformLocation | null;
        uFieldOfView: WebGLUniformLocation | null;
        uRadius: WebGLUniformLocation | null;
        uZoom: WebGLUniformLocation | null;
        uAspect: WebGLUniformLocation | null;
    };
};
export declare const setupFisheye: (target: HTMLCanvasElement) => FisheyeState;
export declare const cleanupFisheye: (state: FisheyeState) => void;
export declare const applyFisheye: ({ state, source, width, height, center, fieldOfView, radius, zoom, flipSourceY, }: {
    readonly state: FisheyeState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly center: readonly [number, number];
    readonly fieldOfView: number;
    readonly radius: number;
    readonly zoom: number;
    readonly flipSourceY: boolean;
}) => void;
