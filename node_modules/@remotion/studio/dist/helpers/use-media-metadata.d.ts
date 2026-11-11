import type { FrameRateMetrics, InputAudioTrack, InputVideoTrack } from 'mediabunny';
export type MediaMetadata = {
    duration: number;
    videoTiming: {
        durationInFrames: number | null;
        startTime: number;
        timeResolution: number;
        frameRateIsConstant: boolean;
    } | null;
    format: string | null;
    width: number | null;
    height: number | null;
    videoCodec: InputVideoTrack['codec'] | null;
    audioCodec: InputAudioTrack['codec'] | null;
    fps: number | null;
    isHdr: boolean | null;
    sampleRate: number | null;
    hasVideoTrack: boolean | null;
    hasAudioTrack: boolean | null;
};
export declare const getMediaDurationInFrames: (duration: number, fps: number) => number;
export declare const getMediaPreviewClock: (metadata: MediaMetadata | null) => {
    fps: number;
    videoTiming: {
        durationInFrames: number | null;
        startTime: number;
        timeResolution: number;
        frameRateIsConstant: boolean;
    } | null;
};
export declare const getFrameRateFromMetrics: (metrics: Pick<FrameRateMetrics, 'bestGuessFrameRate' | 'probedPacketCount'> | null) => number | null;
export declare const getCachedMediaMetadata: (src: string) => MediaMetadata | null;
export declare const getMediaMetadata: (src: string) => Promise<MediaMetadata | null>;
export declare const getRenderOutputVideoClock: (src: string, signal: AbortSignal) => Promise<{
    fps: number;
    videoTiming: {
        durationInFrames: number | null;
        startTime: number;
        timeResolution: number;
        frameRateIsConstant: boolean;
    } | null;
}>;
export declare const useMediaMetadata: (src: string | null) => MediaMetadata | null;
