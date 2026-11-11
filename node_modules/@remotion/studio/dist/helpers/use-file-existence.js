"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFileExistence = void 0;
const react_1 = require("react");
const actions_1 = require("../components/RenderQueue/actions");
const client_id_1 = require("./client-id");
const requestsByClient = new Map();
const useFileExistence = (outName) => {
    const { previewServerState: state, subscribeToEvent } = (0, react_1.useContext)(client_id_1.StudioServerConnectionCtx);
    const clientId = state.type === 'connected' ? state.clientId : null;
    const [result, setResult] = (0, react_1.useState)({ outName, clientId, exists: false, checkFailed: false });
    (0, react_1.useEffect)(() => {
        var _a;
        setResult({ outName, clientId, exists: false, checkFailed: false });
        if (clientId === null) {
            return;
        }
        const requests = (_a = requestsByClient.get(clientId)) !== null && _a !== void 0 ? _a : {
            pending: Promise.resolve(),
            activeEffects: 0,
        };
        requestsByClient.set(clientId, requests);
        requests.activeEffects++;
        let active = true;
        let subscribed = false;
        let receivedFileEvent = false;
        const listener = (event) => {
            if (!active ||
                (event.type !== 'watched-file-deleted' &&
                    event.type !== 'watched-file-undeleted') ||
                event.file !== outName) {
                return;
            }
            receivedFileEvent = true;
            setResult({
                outName,
                clientId,
                exists: event.type === 'watched-file-undeleted',
                checkFailed: false,
            });
        };
        const unsubscribeDeleted = subscribeToEvent('watched-file-deleted', listener);
        const unsubscribeCreated = subscribeToEvent('watched-file-undeleted', listener);
        requests.pending = requests.pending.then(async () => {
            if (!active) {
                return;
            }
            try {
                const exists = await (0, actions_1.subscribeToFileExistenceWatcher)({
                    file: outName,
                    clientId,
                });
                subscribed = true;
                if (active && !receivedFileEvent) {
                    setResult({ outName, clientId, exists, checkFailed: false });
                }
            }
            catch (_a) {
                if (active) {
                    setResult({ outName, clientId, exists: false, checkFailed: true });
                }
            }
        });
        return () => {
            active = false;
            requests.activeEffects--;
            unsubscribeDeleted();
            unsubscribeCreated();
            const cleanup = requests.pending.then(async () => {
                if (!subscribed) {
                    return;
                }
                await (0, actions_1.unsubscribeFromFileExistenceWatcher)({
                    file: outName,
                    clientId,
                }).catch(() => undefined);
            });
            requests.pending = cleanup;
            cleanup.then(() => {
                if (requests.activeEffects === 0 && requests.pending === cleanup) {
                    requestsByClient.delete(clientId);
                }
            });
        };
    }, [clientId, outName, subscribeToEvent]);
    return result.outName === outName && result.clientId === clientId
        ? { exists: result.exists, checkFailed: result.checkFailed }
        : { exists: false, checkFailed: false };
};
exports.useFileExistence = useFileExistence;
