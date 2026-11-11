import React from 'react';
import type { RenderInlineAction } from './InlineAction';
export declare const inspectorHeaderIconStyle: React.CSSProperties;
export declare const InspectorHeaderActionSlot: React.FC<{
    readonly children: React.ReactNode;
}>;
export declare const InspectorHeaderAction: React.FC<{
    readonly label: string;
    readonly disabled: boolean;
    readonly onClick: React.MouseEventHandler<HTMLButtonElement>;
    readonly renderIcon: RenderInlineAction;
}>;
export declare const InspectorLocationCopy: React.FC<{
    readonly children: React.ReactNode;
    readonly contextForAgents: string | null;
    readonly actions: React.ReactNode;
    readonly leadingActions: React.ReactNode;
    readonly isEditing: boolean;
}>;
