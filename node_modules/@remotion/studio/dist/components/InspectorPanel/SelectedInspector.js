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
exports.SelectedInspector = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const slide_view_transition_1 = require("../../helpers/slide-view-transition");
const EffectPicker_1 = require("../EffectPicker");
const TimelineSelection_1 = require("../Timeline/TimelineSelection");
const common_1 = require("./common");
const EasingInspector_1 = require("./EasingInspector");
const GuideInspector_1 = require("./GuideInspector");
const inspector_selection_1 = require("./inspector-selection");
const KeyframeInspector_1 = require("./KeyframeInspector");
const SequenceSelectionInspector_1 = require("./SequenceSelectionInspector");
const styles_1 = require("./styles");
const SelectedInspectorContent = react_1.default.memo(({ selection, readOnlyStudio }) => {
    if (selection.type === 'sequence-all-effects') {
        return (0, jsx_runtime_1.jsx)(EffectPicker_1.EffectPicker, { selection: selection });
    }
    if ((0, inspector_selection_1.isSequenceSectionSelection)(selection)) {
        return ((0, jsx_runtime_1.jsx)(SequenceSelectionInspector_1.SequenceSelectionInspector, { selection: selection, readOnlyStudio: readOnlyStudio }));
    }
    if (selection.type === 'keyframe') {
        return (0, jsx_runtime_1.jsx)(KeyframeInspector_1.KeyframeInspector, { selection: selection });
    }
    if (selection.type === 'easing') {
        return (0, jsx_runtime_1.jsx)(EasingInspector_1.EasingInspector, { selection: selection });
    }
    if (selection.type === 'guide') {
        return (0, jsx_runtime_1.jsx)(GuideInspector_1.GuideInspector, { selection: selection });
    }
    return (0, jsx_runtime_1.jsx)(common_1.InspectorMessage, { children: "Inspector unavailable" });
});
const SelectedInspector = ({ selection, readOnlyStudio }) => {
    const panel = (0, react_1.useRef)(null);
    const transition = (0, react_1.useRef)(null);
    const [displayedSelection, setDisplayedSelection] = (0, react_1.useState)(selection);
    const displayedSelectionRef = (0, react_1.useRef)(selection);
    const latestSelection = (0, react_1.useRef)(selection);
    latestSelection.current = selection;
    (0, react_1.useLayoutEffect)(() => {
        return () => { var _a; return (_a = transition.current) === null || _a === void 0 ? void 0 : _a.call(transition); };
    }, []);
    (0, react_1.useLayoutEffect)(() => {
        var _a;
        (_a = transition.current) === null || _a === void 0 ? void 0 : _a.call(transition);
        transition.current = null;
        const previous = displayedSelectionRef.current;
        const update = () => {
            const next = latestSelection.current;
            displayedSelectionRef.current = next;
            setDisplayedSelection(next);
        };
        if (panel.current === null ||
            (previous.type === 'sequence-all-effects') ===
                (selection.type === 'sequence-all-effects') ||
            !(0, inspector_selection_1.isSequenceSectionSelection)(previous) ||
            !(0, inspector_selection_1.isSequenceSectionSelection)(selection) ||
            (0, TimelineSelection_1.getTimelineSequenceSelectionKey)(previous.nodePathInfo) !==
                (0, TimelineSelection_1.getTimelineSequenceSelectionKey)(selection.nodePathInfo)) {
            update();
            return;
        }
        transition.current = (0, slide_view_transition_1.startSlideViewTransition)({
            panels: [
                {
                    element: panel.current,
                    name: 'remotion-inspector',
                    clipY: null,
                },
            ],
            direction: selection.type === 'sequence-all-effects' ? 'forward' : 'backward',
            update,
        });
        if (transition.current === null) {
            update();
        }
    }, [selection]);
    return ((0, jsx_runtime_1.jsx)("div", { ref: panel, style: styles_1.container, children: (0, jsx_runtime_1.jsx)(SelectedInspectorContent, { selection: displayedSelection, readOnlyStudio: readOnlyStudio }) }));
};
exports.SelectedInspector = SelectedInspector;
