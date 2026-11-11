"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaEnabledProvider = exports.useAudioEnabled = exports.useVideoEnabled = exports.MediaEnabledContext = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
exports.MediaEnabledContext = (0, react_1.createContext)(null);
const useVideoEnabled = () => {
    const context = (0, react_1.useContext)(exports.MediaEnabledContext);
    if (context && context.videoEnabled !== null) {
        return context.videoEnabled;
    }
    // Only the renderer sets the global; the Player and tests leave it undefined.
    return typeof window === 'undefined'
        ? true
        : window.remotion_videoEnabled !== false;
};
exports.useVideoEnabled = useVideoEnabled;
const useAudioEnabled = () => {
    const context = (0, react_1.useContext)(exports.MediaEnabledContext);
    if (!context) {
        return typeof window === 'undefined' ? true : window.remotion_audioEnabled;
    }
    if (context.audioEnabled === null) {
        return typeof window === 'undefined' ? true : window.remotion_audioEnabled;
    }
    return context.audioEnabled;
};
exports.useAudioEnabled = useAudioEnabled;
const MediaEnabledProvider = ({ children, videoEnabled, audioEnabled, }) => {
    const value = (0, react_1.useMemo)(() => ({ videoEnabled, audioEnabled }), [videoEnabled, audioEnabled]);
    return ((0, jsx_runtime_1.jsx)(exports.MediaEnabledContext.Provider, { value: value, children: children }));
};
exports.MediaEnabledProvider = MediaEnabledProvider;
