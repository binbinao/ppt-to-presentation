import React from 'react';
import type { OriginalPosition } from '../error-overlay/react-overlay/utils/get-source-map';
export declare const InspectorOpenInEditor: React.FC<{
    readonly menuTrigger: {
        readonly label: string;
        readonly renderIcon: (color: string) => React.ReactNode;
    } | null;
    readonly annotationName: string | null;
    readonly contextForAgents?: string | null;
    readonly location: OriginalPosition | null;
    readonly label?: React.ReactNode;
    readonly locationType: 'file' | 'folder' | null;
    readonly showTooltips: boolean;
}>;
