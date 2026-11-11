"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrerenderedVideoActions = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const preview_server_events_1 = require("../../helpers/preview-server-events");
const undo_1 = require("../../icons/undo");
const call_api_1 = require("../call-api");
const NotificationCenter_1 = require("../Notifications/NotificationCenter");
const use_static_files_1 = require("../use-static-files");
const common_1 = require("./common");
const iconStyle = {
    display: 'block',
    height: 14,
    width: 14,
};
const PrerenderedVideoActions = ({ nodePathInfo, src, sourceActionsDisabled }) => {
    var _a, _b, _c;
    const staticFiles = (0, use_static_files_1.useStaticFiles)();
    const [info, setInfo] = (0, react_1.useState)(null);
    const [busy, setBusy] = (0, react_1.useState)(false);
    const staticFile = (_a = staticFiles.find((file) => file.src === src)) !== null && _a !== void 0 ? _a : null;
    const sidecar = (0, react_1.useMemo)(() => {
        var _a;
        if (staticFile === null) {
            return null;
        }
        return ((_a = staticFiles.find((file) => file.name === `${staticFile.name}.json`)) !== null && _a !== void 0 ? _a : null);
    }, [staticFile, staticFiles]);
    const [buildHash, setBuildHash] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        return (0, preview_server_events_1.subscribeToPreviewServerEvents)((event) => {
            var _a;
            if (event.type === 'hmr' && event.hmrEvent.action === 'built') {
                setBuildHash((_a = event.hmrEvent.hash) !== null && _a !== void 0 ? _a : null);
            }
        });
    }, []);
    const publicPath = (_b = staticFile === null || staticFile === void 0 ? void 0 : staticFile.name) !== null && _b !== void 0 ? _b : null;
    const sidecarLastModified = (_c = sidecar === null || sidecar === void 0 ? void 0 : sidecar.lastModified) !== null && _c !== void 0 ? _c : null;
    (0, react_1.useEffect)(() => {
        if (publicPath === null || sidecarLastModified === null) {
            setInfo(null);
            return;
        }
        let cancelled = false;
        (0, call_api_1.callApi)('/api/prerendered-scene-info', { src: publicPath })
            .then((response) => {
            if (!cancelled) {
                setInfo(response);
            }
        })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [publicPath, sidecarLastModified, buildHash]);
    const onRestore = (0, react_1.useCallback)(() => {
        if (publicPath === null) {
            return;
        }
        setBusy(true);
        (0, call_api_1.callApi)('/api/restore-prerendered-scene', {
            fileName: nodePathInfo.sequenceSubscriptionKey.absolutePath,
            nodePath: nodePathInfo.sequenceSubscriptionKey.nodePath,
            src: publicPath,
        })
            .then((response) => {
            if (!response.success) {
                throw new Error(response.reason);
            }
        })
            .catch((error) => {
            (0, NotificationCenter_1.showNotification)(error.message, 4000);
        })
            .finally(() => setBusy(false));
    }, [nodePathInfo, publicPath]);
    if (sourceActionsDisabled || (info === null || info === void 0 ? void 0 : info.type) !== 'prerendered') {
        return null;
    }
    return ((0, jsx_runtime_1.jsx)(common_1.InspectorQuickAction, { disabled: busy || nodePathInfo.numberOfSequencesWithThisNodePath !== 1, onClick: onRestore, "aria-label": info.stale
            ? `${info.compositionId} was edited after it was rendered`
            : `Rendered from ${info.compositionId}`, renderIcon: (color) => (0, jsx_runtime_1.jsx)(undo_1.UndoIcon, { color: color, style: iconStyle }), children: info.stale ? 'Restore unrendered (out of date)' : 'Restore unrendered' }));
};
exports.PrerenderedVideoActions = PrerenderedVideoActions;
