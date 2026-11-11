"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEscapeCancelableDeferredPointerSession = exports.startEscapeCancelableCapturedPointerSession = exports.startEscapeCancelableSession = exports.cancelActivePointerSessions = exports.getPointerSessionCancellationVersion = void 0;
const pointer_session_1 = require("./pointer-session");
const activeSessions = new Set();
let cancellationVersion = 0;
const getPointerSessionCancellationVersion = () => cancellationVersion;
exports.getPointerSessionCancellationVersion = getPointerSessionCancellationVersion;
const cancelActivePointerSessions = () => {
    cancellationVersion++;
    for (const cancel of [...activeSessions])
        cancel();
};
exports.cancelActivePointerSessions = cancelActivePointerSessions;
const startEscapeCancelableSession = (startSession) => {
    let ended = false;
    const onKeyDown = (event) => {
        if (event.key !== 'Escape') {
            return;
        }
        // Cancel before Escape reaches selection or menu shortcuts.
        event.preventDefault();
        event.stopImmediatePropagation();
        stopSession();
    };
    const onEnd = () => {
        ended = true;
        window.removeEventListener('keydown', onKeyDown, true);
        activeSessions.delete(cancel);
    };
    const cancel = () => {
        onEnd();
        stopSession();
    };
    const stopSession = startSession(onEnd);
    if (!ended) {
        window.addEventListener('keydown', onKeyDown, true);
        activeSessions.add(cancel);
    }
    return cancel;
};
exports.startEscapeCancelableSession = startEscapeCancelableSession;
const withEscapeCancellation = (startSession) => {
    return (options) => {
        return (0, exports.startEscapeCancelableSession)((onEnd) => startSession({
            ...options,
            onEnd: (reason, event) => {
                onEnd();
                options.onEnd(reason, event);
            },
        }));
    };
};
exports.startEscapeCancelableCapturedPointerSession = withEscapeCancellation(pointer_session_1.startCapturedPointerSession);
exports.startEscapeCancelableDeferredPointerSession = withEscapeCancellation(pointer_session_1.startDeferredCapturedPointerSession);
