export declare const highContrastOption: {
    name: string;
    addedIn: string;
    cliFlag: "high-contrast";
    id: "high-contrast";
    description: () => import("react").JSX.Element;
    ssrName: null;
    docLink: string;
    type: boolean;
    getValue: ({ commandLine }: {
        commandLine: Record<string, unknown>;
    }) => {
        value: boolean;
        source: 'cli';
    } | {
        value: boolean;
        source: 'config';
    };
    setConfig(value: boolean): void;
    getConfigValue: () => boolean | null;
    reset: () => void;
};
