"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectOptimisticEffect = exports.selectOptimisticEffects = exports.registerOptimisticEffectSelection = void 0;
let selectEffects = null;
const registerOptimisticEffectSelection = (callback) => {
    selectEffects = callback;
    return () => {
        if (selectEffects === callback)
            selectEffects = null;
    };
};
exports.registerOptimisticEffectSelection = registerOptimisticEffectSelection;
const selectOptimisticEffects = (items, reveal) => selectEffects === null || selectEffects === void 0 ? void 0 : selectEffects(items, reveal);
exports.selectOptimisticEffects = selectOptimisticEffects;
const selectOptimisticEffect = (nodePathInfo, id, reveal) => (0, exports.selectOptimisticEffects)([{ nodePathInfo, id }], reveal);
exports.selectOptimisticEffect = selectOptimisticEffect;
