"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderPreview = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const add_asset_cache_bust_1 = require("../helpers/add-asset-cache-bust");
const client_id_1 = require("../helpers/client-id");
const colors_1 = require("../helpers/colors");
const get_asset_metadata_1 = require("../helpers/get-asset-metadata");
const get_preview_file_type_1 = require("../helpers/get-preview-file-type");
const use_media_metadata_1 = require("../helpers/use-media-metadata");
const FilePreview_1 = require("./FilePreview");
const msgStyle = {
    fontSize: 13,
    color: colors_1.WHITE,
    fontFamily: 'sans-serif',
    display: 'flex',
    justifyContent: 'center',
};
const errMsgStyle = {
    ...msgStyle,
    color: colors_1.LIGHT_TEXT,
};
const RenderPreview = ({ path, assetMetadata, getBlob, outputPlaybackContent }) => {
    var _a;
    var _b, _c;
    const fileType = (0, get_preview_file_type_1.getPreviewFileType)(path);
    const connectionStatus = (0, react_1.useContext)(client_id_1.StudioServerConnectionCtx)
        .previewServerState.type;
    const blobIdentity = (0, react_1.useMemo)(() => ({ getBlob }), [getBlob]);
    const [blobSource, setBlobSource] = (0, react_1.useState)(null);
    const [blobFailure, setBlobFailure] = (0, react_1.useState)(null);
    const [resolvedClock, setResolvedClock] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (!getBlob) {
            return;
        }
        let cancelled = false;
        let blobUrlToRevoke = null;
        getBlob()
            .then((blob) => {
            const url = URL.createObjectURL(blob);
            if (cancelled) {
                URL.revokeObjectURL(url);
                return;
            }
            blobUrlToRevoke = url;
            setBlobSource({ identity: blobIdentity, url });
        })
            .catch((err) => {
            if (cancelled) {
                return;
            }
            setBlobFailure({
                identity: blobIdentity,
                error: err instanceof Error ? err : new Error(String(err)),
            });
        });
        return () => {
            cancelled = true;
            if (blobUrlToRevoke) {
                URL.revokeObjectURL(blobUrlToRevoke);
            }
        };
    }, [blobIdentity, getBlob]);
    const blobUrl = (blobSource === null || blobSource === void 0 ? void 0 : blobSource.identity) === blobIdentity ? ((_b = blobSource === null || blobSource === void 0 ? void 0 : blobSource.url) !== null && _b !== void 0 ? _b : null) : null;
    const blobError = (blobFailure === null || blobFailure === void 0 ? void 0 : blobFailure.identity) === blobIdentity
        ? ((_c = blobFailure === null || blobFailure === void 0 ? void 0 : blobFailure.error) !== null && _c !== void 0 ? _c : null)
        : null;
    const src = getBlob
        ? blobUrl
        : (assetMetadata === null || assetMetadata === void 0 ? void 0 : assetMetadata.type) === 'found'
            ? (0, add_asset_cache_bust_1.addAssetCacheBust)({
                src: (0, get_asset_metadata_1.getRenderOutputSrc)(path),
                fetchedAt: assetMetadata.fetchedAt,
            })
            : null;
    const metadata = (assetMetadata === null || assetMetadata === void 0 ? void 0 : assetMetadata.type) === 'found' ? assetMetadata.mediaMetadata : null;
    const needsVideoClock = fileType === 'video' &&
        (Boolean(getBlob) || ((_a = metadata === null || metadata === void 0 ? void 0 : metadata.videoTiming) === null || _a === void 0 ? void 0 : _a.durationInFrames) === null);
    (0, react_1.useEffect)(() => {
        if (!needsVideoClock || src === null)
            return;
        const controller = new AbortController();
        (0, use_media_metadata_1.getRenderOutputVideoClock)(src, controller.signal)
            .then((videoClock) => {
            if (!controller.signal.aborted)
                setResolvedClock({ src, clock: videoClock });
        })
            .catch(() => {
            if (!controller.signal.aborted)
                setResolvedClock({ src, clock: (0, use_media_metadata_1.getMediaPreviewClock)(metadata) });
        });
        return () => controller.abort();
    }, [metadata, needsVideoClock, src]);
    if (!getBlob && connectionStatus === 'disconnected') {
        return (0, jsx_runtime_1.jsx)("div", { style: errMsgStyle, children: "Studio server disconnected" });
    }
    if (getBlob && blobError) {
        return ((0, jsx_runtime_1.jsxs)("div", { style: errMsgStyle, children: ["Failed to load preview: ", blobError.message] }));
    }
    if (src === null) {
        return (0, jsx_runtime_1.jsx)("div", { style: msgStyle, children: "Loading preview..." });
    }
    const clock = needsVideoClock
        ? (resolvedClock === null || resolvedClock === void 0 ? void 0 : resolvedClock.src) === src
            ? resolvedClock.clock
            : null
        : (0, use_media_metadata_1.getMediaPreviewClock)(fileType === 'video' ? metadata : null);
    return ((0, jsx_runtime_1.jsx)(FilePreview_1.FilePreview, { outputPlayback: { content: outputPlaybackContent, clock }, assetMetadata: assetMetadata, currentAsset: path, fileType: fileType, src: src }));
};
exports.RenderPreview = RenderPreview;
