"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCurrentTimeOfMediaTag = void 0;
const react_1 = __importDefault(require("react"));
const useCurrentTimeOfMediaTag = (mediaRef) => {
    var _a, _b;
    var _c, _d;
    const currentTime = react_1.default.useRef({
        time: (_c = (_a = mediaRef.current) === null || _a === void 0 ? void 0 : _a.currentTime) !== null && _c !== void 0 ? _c : 0,
    });
    const nowCurrentTime = (_d = (_b = mediaRef.current) === null || _b === void 0 ? void 0 : _b.currentTime) !== null && _d !== void 0 ? _d : null;
    if (nowCurrentTime !== null) {
        currentTime.current.time = nowCurrentTime;
    }
    return currentTime;
};
exports.useCurrentTimeOfMediaTag = useCurrentTimeOfMediaTag;
