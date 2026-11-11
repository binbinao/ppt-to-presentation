import { type PreviewServerConnectionState } from '../../helpers/preview-server-events';
import type { SetSelectedModalContextType, WebRenderModalState } from '../../state/modals';
export declare const canRenderOnServer: (readOnlyStudio: boolean, connectionStatus: PreviewServerConnectionState['type']) => boolean;
export declare const openClientRenderModalForComposition: ({ compositionId, defaultProps, getInitialFrame, inFrameMark, outFrameMark, prepareServerBundle, setSelectedModal, }: Pick<WebRenderModalState, 'compositionId' | 'defaultProps' | 'inFrameMark' | 'outFrameMark'> & {
    getInitialFrame: () => number;
    prepareServerBundle: boolean;
    setSelectedModal: SetSelectedModalContextType['setSelectedModal'];
}) => Promise<void>;
