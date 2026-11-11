export type ObjectFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
export type ObjectFitResult = {
    sourceX: number;
    sourceY: number;
    sourceWidth: number;
    sourceHeight: number;
    destX: number;
    destY: number;
    destWidth: number;
    destHeight: number;
};
type ObjectFitParams = {
    containerSize: {
        width: number;
        height: number;
        left: number;
        top: number;
    };
    intrinsicSize: {
        width: number;
        height: number;
    };
};
export declare const calculateObjectFit: ({ objectFit, objectPosition, containerSize, intrinsicSize, }: {
    objectFit: ObjectFit;
    objectPosition: string;
} & ObjectFitParams) => ObjectFitResult;
/**
 * Parse an object-fit CSS value string into our ObjectFit type.
 * Returns 'fill' as the default if the value is not recognized.
 */
export declare const parseObjectFit: (value: string | null | undefined) => ObjectFit;
export {};
