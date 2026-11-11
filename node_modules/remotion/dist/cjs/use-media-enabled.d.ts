export declare const MediaEnabledContext: import("react").Context<{
    videoEnabled: boolean | null;
    audioEnabled: boolean | null;
} | null>;
export declare const useVideoEnabled: () => boolean;
export declare const useAudioEnabled: () => boolean;
export declare const MediaEnabledProvider: ({ children, videoEnabled, audioEnabled, }: {
    readonly children: React.ReactNode;
    readonly videoEnabled: boolean | null;
    readonly audioEnabled: boolean | null;
}) => import("react").JSX.Element;
