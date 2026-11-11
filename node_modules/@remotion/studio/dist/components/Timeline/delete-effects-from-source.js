"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDeleteEffects = exports.deleteEffectsFromSource = void 0;
const react_1 = require("react");
const browser_studio_operations_1 = require("../../helpers/browser-studio-operations");
const effect_operations_api_1 = require("../effect-operations-api");
const NotificationCenter_1 = require("../Notifications/NotificationCenter");
const TimelineSelection_1 = require("./TimelineSelection");
const deleteEffectsFromSource = async (targets, currentSelection) => {
    var _a;
    if (!(0, browser_studio_operations_1.canUseEffectOperations)() ||
        (currentSelection !== null && !currentSelection.current.canSelect))
        return { status: 'error', reason: 'Effect editing is unavailable' };
    const grouped = new Map();
    for (const target of targets) {
        if (target.effectIndices.some((index) => !Number.isInteger(index) ||
            index < 0 ||
            index >= target.effects.length))
            return {
                status: 'error',
                reason: 'The effect could not be found. Try the edit again.',
            };
        const key = JSON.stringify([
            target.nodePath.absolutePath,
            target.nodePath.nodePath,
        ]);
        const existing = grouped.get(key);
        grouped.set(key, {
            ...target,
            effectIndices: [
                ...new Set([
                    ...((_a = existing === null || existing === void 0 ? void 0 : existing.effectIndices) !== null && _a !== void 0 ? _a : []),
                    ...target.effectIndices,
                ]),
            ],
        });
    }
    if (grouped.size === 0)
        return { status: 'error', reason: 'No effects were selected' };
    try {
        const request = [...grouped.values()].flatMap(({ nodePath, effectIndices }) => effectIndices.map((effectIndex) => ({
            type: 'single-effect',
            fileName: nodePath.absolutePath,
            sequenceNodePath: nodePath,
            effectIndex,
        })));
        const result = await (0, effect_operations_api_1.deleteEffects)(request);
        if (!result.success)
            throw new Error(result.reason);
        return { status: 'success' };
    }
    catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        (0, NotificationCenter_1.showNotification)(`Could not delete effect: ${reason}`, 4000);
        return { status: 'error', reason };
    }
};
exports.deleteEffectsFromSource = deleteEffectsFromSource;
const useDeleteEffects = () => {
    const currentSelection = (0, TimelineSelection_1.useCurrentTimelineSelectionStateAsRef)();
    return (0, react_1.useCallback)((targets) => (0, exports.deleteEffectsFromSource)(targets, currentSelection), [currentSelection]);
};
exports.useDeleteEffects = useDeleteEffects;
