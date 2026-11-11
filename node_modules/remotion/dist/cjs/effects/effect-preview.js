"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEffectPreview = exports.EffectPreviewProvider = exports.EffectPreviewContext = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const use_sync_external_store_js_1 = require("../use-sync-external-store.js");
exports.EffectPreviewContext = react_1.default.createContext({
    setPreview: () => undefined,
    subscribe: () => () => undefined,
    getSnapshot: () => null,
});
const EffectPreviewProvider = ({ children }) => {
    const [store] = (0, react_1.useState)(() => {
        let preview = null;
        const listeners = new Map();
        return {
            setPreview: (next) => {
                var _a;
                if ((preview === null || preview === void 0 ? void 0 : preview.runtimeValues) === (next === null || next === void 0 ? void 0 : next.runtimeValues) &&
                    (preview === null || preview === void 0 ? void 0 : preview.effect) === (next === null || next === void 0 ? void 0 : next.effect)) {
                    return;
                }
                const previousTarget = preview === null || preview === void 0 ? void 0 : preview.runtimeValues;
                preview = next;
                const targets = new Set([previousTarget, next === null || next === void 0 ? void 0 : next.runtimeValues]);
                for (const target of targets) {
                    if (target === undefined) {
                        continue;
                    }
                    for (const listener of (_a = listeners.get(target)) !== null && _a !== void 0 ? _a : []) {
                        listener();
                    }
                }
            },
            subscribe: (runtimeValues, listener) => {
                if (runtimeValues === null) {
                    return () => undefined;
                }
                let targetListeners = listeners.get(runtimeValues);
                if (targetListeners === undefined) {
                    targetListeners = new Set();
                    listeners.set(runtimeValues, targetListeners);
                }
                targetListeners.add(listener);
                return () => {
                    targetListeners.delete(listener);
                    if (targetListeners.size === 0) {
                        listeners.delete(runtimeValues);
                    }
                };
            },
            getSnapshot: (runtimeValues) => (preview === null || preview === void 0 ? void 0 : preview.runtimeValues) === runtimeValues ? preview.effect : null,
        };
    });
    return ((0, jsx_runtime_1.jsx)(exports.EffectPreviewContext.Provider, { value: store, children: children }));
};
exports.EffectPreviewProvider = EffectPreviewProvider;
const useEffectPreview = (runtimeValues) => {
    const store = (0, react_1.useContext)(exports.EffectPreviewContext);
    const subscribe = (0, react_1.useCallback)((listener) => store.subscribe(runtimeValues, listener), [runtimeValues, store]);
    const getSnapshot = (0, react_1.useCallback)(() => store.getSnapshot(runtimeValues), [runtimeValues, store]);
    return (0, use_sync_external_store_js_1.useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
};
exports.useEffectPreview = useEffectPreview;
