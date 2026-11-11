"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParentTimelineSelection = void 0;
const parse_keyframe_field_from_node_path_1 = require("./parse-keyframe-field-from-node-path");
const getParentTimelineSelection = (item) => {
    if (item.type === 'sequence' || item.type === 'guide') {
        return null;
    }
    const nodePathInfo = { ...item.nodePathInfo, auxiliaryKeys: [] };
    if (item.type === 'keyframe' || item.type === 'easing') {
        const field = (0, parse_keyframe_field_from_node_path_1.parseKeyframeFieldFromNodePath)(item.nodePathInfo.auxiliaryKeys);
        if ((field === null || field === void 0 ? void 0 : field.type) === 'sequence') {
            return {
                type: 'sequence-prop',
                nodePathInfo: item.nodePathInfo,
                key: field.fieldKey,
            };
        }
        if ((field === null || field === void 0 ? void 0 : field.type) === 'effect') {
            return {
                type: 'sequence-effect-prop',
                nodePathInfo: item.nodePathInfo,
                i: field.effectIndex,
                key: field.fieldKey,
            };
        }
    }
    return { type: 'sequence', nodePathInfo };
};
exports.getParentTimelineSelection = getParentTimelineSelection;
