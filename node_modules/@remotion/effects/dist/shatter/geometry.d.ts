export type ShatterGeometryParams = {
    time: number;
    pattern: 'bricks' | 'glass' | 'hexagons' | 'squares' | 'triangles';
    repetitions: number;
    direction: number;
    origin: readonly [number, number];
    center: readonly [number, number];
    radius: number;
    depth: number;
    strength: number;
    rotationSpeed: number;
    randomness: number;
    viscosity: number;
    massVariance: number;
    gravity: number;
    seed: number;
    extrusionDepth: number;
};
export declare const createShatterGeometry: (width: number, height: number, params: ShatterGeometryParams) => Float32Array;
