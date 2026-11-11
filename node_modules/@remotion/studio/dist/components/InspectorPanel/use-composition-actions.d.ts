import { type MouseEvent } from 'react';
export declare const useCompositionActions: () => {
    canInsertAsset: boolean;
    canInsertComposition: boolean;
    canInsertSolid: boolean;
    canInsertText: boolean;
    canShowInsertAsset: boolean;
    canShowInsertComposition: boolean;
    canShowInsertSolid: boolean;
    canShowInsertText: boolean;
    canShowGenerateWithAgent: boolean;
    insertAsset: () => Promise<void>;
    insertComposition: () => Promise<void>;
    insertSolid: () => Promise<void>;
    insertText: () => Promise<void>;
    generateWithAgent: (event: MouseEvent<HTMLButtonElement>) => void;
};
