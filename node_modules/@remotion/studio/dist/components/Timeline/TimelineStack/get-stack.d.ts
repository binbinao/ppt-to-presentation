export declare const compiledSourceFrame = "\n    at remotionCompiledSource (remotion-source-sha256:";
export declare const getSequenceLocationStack: (stack: string | null) => string | null;
export declare const getCompiledSourceHash: (stack: string | null, fileName: string) => string | null;
export declare const getSourceMapFilesForSource: (source: string) => Record<string, string> | null;
export declare const getOriginalLocationFromStack: (stack: string, type: 'sequence' | 'visual-control') => Promise<import("../../../error-overlay/react-overlay/utils/get-source-map").OriginalPosition | null>;
