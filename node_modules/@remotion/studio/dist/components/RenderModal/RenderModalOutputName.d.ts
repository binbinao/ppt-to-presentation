import React from 'react';
type Props = {
    readonly ariaLabel: string | null;
    readonly existingOutputPath: string | null;
    readonly existence: boolean;
    readonly existenceCheckFailed: boolean;
    readonly inputStyle: React.CSSProperties;
    readonly outName: string;
    readonly onValueChange: React.ChangeEventHandler<HTMLInputElement>;
    readonly validationMessage: string | null;
    readonly label: string;
};
export declare const RenderModalOutputName: ({ ariaLabel, existingOutputPath, existence, existenceCheckFailed, inputStyle, outName, onValueChange, validationMessage, label: labelText, }: Props) => React.JSX.Element;
export {};
