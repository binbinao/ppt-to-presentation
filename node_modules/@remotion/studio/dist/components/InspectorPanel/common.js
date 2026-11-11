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
exports.InspectorDefaultPropsWarnings = exports.InspectorQuickAction = exports.largeInspectorActionIconContainerStyle = exports.largeInspectorActionIconStyle = exports.inspectorActionIconContainerStyle = exports.inspectorActionIconStyle = exports.inspectorHeaderActionStyle = exports.INSPECTOR_HEADER_ACTION_WIDTH = exports.InspectorDetailRow = exports.InspectorMessage = exports.InspectorBackAction = exports.InspectorSection = exports.InspectorSectionBody = exports.InspectorQuickActionsSection = exports.InspectorSectionHeader = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const colors_1 = require("../../helpers/colors");
const hoverable_1 = require("../../helpers/hoverable");
const InspectorPanelLayout_1 = require("../InspectorPanelLayout");
const layout_1 = require("../layout");
const ValidationMessage_1 = require("../NewComposition/ValidationMessage");
const styles_1 = require("./styles");
const InspectorSectionHeader = ({ children }) => (0, jsx_runtime_1.jsx)("div", { style: styles_1.sectionHeader, children: children });
exports.InspectorSectionHeader = InspectorSectionHeader;
const InspectorQuickActionsSection = ({ children }) => (0, jsx_runtime_1.jsx)("div", { style: styles_1.inspectorQuickActionsSection, children: children });
exports.InspectorQuickActionsSection = InspectorQuickActionsSection;
const InspectorSectionBody = ({ children, expanded, keepMounted, paddingBottom }) => {
    const [transition, setTransition] = (0, react_1.useState)({
        expanded,
        active: false,
        fromHidden: false,
    });
    const contentRef = (0, react_1.useRef)(null);
    const clipRef = (0, react_1.useRef)(null);
    const lastExpandedChildren = (0, react_1.useRef)(children);
    if (transition.expanded !== expanded) {
        setTransition({
            expanded,
            active: true,
            fromHidden: !transition.expanded && !transition.active,
        });
    }
    if (expanded) {
        lastExpandedChildren.current = children;
    }
    (0, react_1.useLayoutEffect)(() => {
        if (!transition.active) {
            return;
        }
        const content = contentRef.current;
        const clip = clipRef.current;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const finishTransition = () => {
            setTransition({ expanded, active: false, fromHidden: false });
        };
        if (reducedMotion.matches ||
            !content ||
            !clip ||
            lastExpandedChildren.current === null) {
            finishTransition();
            return;
        }
        if (expanded && transition.fromHidden) {
            content.style.gridTemplateRows = '0fr';
            content.style.opacity = '0';
            clip.style.maskSize = '100% 100%';
            clip.style.webkitMaskSize = '100% 100%';
            content.getBoundingClientRect();
            content.style.gridTemplateRows = '1fr';
            content.style.opacity = '1';
            clip.style.removeProperty('mask-size');
            clip.style.removeProperty('-webkit-mask-size');
        }
        const onReducedMotionChange = () => {
            if (reducedMotion.matches) {
                finishTransition();
            }
        };
        reducedMotion.addEventListener('change', onReducedMotionChange);
        return () => {
            reducedMotion.removeEventListener('change', onReducedMotionChange);
        };
    }, [expanded, transition.active, transition.fromHidden]);
    if (expanded && children === null) {
        return null;
    }
    return ((0, jsx_runtime_1.jsx)("div", { ref: contentRef, className: "__remotion-inspector-section-content", "data-expanded": expanded, "data-animating": transition.active, "aria-hidden": !expanded, inert: !expanded, onTransitionEnd: (event) => {
            if (event.target === event.currentTarget &&
                event.propertyName === 'opacity') {
                setTransition({ expanded, active: false, fromHidden: false });
            }
        }, style: {
            display: expanded || transition.active ? 'grid' : 'none',
            gridTemplateRows: expanded ? '1fr' : '0fr',
            opacity: expanded ? 1 : 0,
            visibility: expanded ? 'visible' : 'hidden',
            pointerEvents: expanded ? undefined : 'none',
        }, children: (0, jsx_runtime_1.jsx)("div", { ref: clipRef, className: "__remotion-inspector-section-clip", style: { minHeight: 0, overflow: 'hidden' }, children: (0, jsx_runtime_1.jsx)("div", { style: { ...styles_1.inspectorSectionBody, paddingBottom }, children: expanded || keepMounted
                    ? children
                    : transition.active
                        ? lastExpandedChildren.current
                        : null }) }) }));
};
exports.InspectorSectionBody = InspectorSectionBody;
const InspectorSection = ({ children, expanded, header }) => {
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(exports.InspectorSectionHeader, { children: header }), (0, jsx_runtime_1.jsx)(exports.InspectorSectionBody, { expanded: expanded, keepMounted: false, paddingBottom: 8, children: children })] }));
};
exports.InspectorSection = InspectorSection;
const backArrowIcon = {
    display: 'block',
    height: 15,
    width: 15,
};
const BackArrow = ({ color }) => {
    return ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 512 512", style: backArrowIcon, children: (0, jsx_runtime_1.jsx)("path", { d: "M7 239c-9.4 9.4-9.4 24.6 0 33.9L175 441c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9L81.9 280 488 280c13.3 0 24-10.7 24-24s-10.7-24-24-24L81.9 232 209 105c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0L7 239z", fill: color }) }));
};
const InspectorBackAction = ({ children, disabled, onClick, 'aria-label': ariaLabel }) => {
    return ((0, jsx_runtime_1.jsx)("div", { style: styles_1.inspectorQuickActionsSection, children: (0, jsx_runtime_1.jsx)(exports.InspectorQuickAction, { disabled: disabled, onClick: onClick, renderIcon: (color) => (0, jsx_runtime_1.jsx)(BackArrow, { color: color }), "aria-label": ariaLabel, children: children }) }));
};
exports.InspectorBackAction = InspectorBackAction;
const InspectorMessage = ({ children }) => (0, jsx_runtime_1.jsx)("div", { style: styles_1.centeredMessage, children: children });
exports.InspectorMessage = InspectorMessage;
const InspectorDetailRow = ({ label, children }) => {
    const [hovered, setHovered] = react_1.default.useState(false);
    return ((0, jsx_runtime_1.jsxs)("div", { style: styles_1.detailRow, onPointerEnter: () => setHovered(true), onPointerLeave: () => setHovered(false), children: [(0, jsx_runtime_1.jsx)("div", { style: styles_1.detailLabel, children: typeof label === 'function' ? label(hovered) : label }), (0, jsx_runtime_1.jsx)("div", { style: styles_1.detailValue, children: children })] }));
};
exports.InspectorDetailRow = InspectorDetailRow;
const INLINE_LABEL_BUTTON_MARGIN = 4;
const inlineLabelButton = {
    alignItems: 'center',
    appearance: 'none',
    border: 'none',
    borderRadius: 4,
    boxSizing: 'border-box',
    cursor: 'default',
    display: 'flex',
    fontFamily: 'sans-serif',
    fontSize: 13,
    gap: 8,
    height: layout_1.COMPACT_CONTROL_ROW_HEIGHT,
    lineHeight: '18px',
    margin: `0 ${INLINE_LABEL_BUTTON_MARGIN}px`,
    padding: `0 ${InspectorPanelLayout_1.INSPECTOR_PANEL_HORIZONTAL_PADDING - INLINE_LABEL_BUTTON_MARGIN}px`,
    textAlign: 'left',
    width: `calc(100% - ${INLINE_LABEL_BUTTON_MARGIN * 2}px)`,
};
const inlineLabelButtonDisabled = {
    ...inlineLabelButton,
    opacity: 0.35,
};
const compactInlineLabelButton = {
    height: layout_1.COMPACT_INLINE_ROW_HEIGHT,
};
const inlineLabelText = {
    flex: 1,
    fontFamily: 'sans-serif',
    fontSize: 13,
    lineHeight: '18px',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    whiteSpace: 'nowrap',
};
const INSPECTOR_ACTION_ICON_SIZE = 18;
exports.INSPECTOR_HEADER_ACTION_WIDTH = 34;
exports.inspectorHeaderActionStyle = {
    ...hoverable_1.NO_HOVER_BACKGROUND_STYLE,
    padding: '0 7px',
    width: exports.INSPECTOR_HEADER_ACTION_WIDTH,
    flexShrink: 0,
};
exports.inspectorActionIconStyle = {
    display: 'block',
    height: INSPECTOR_ACTION_ICON_SIZE,
    width: INSPECTOR_ACTION_ICON_SIZE,
};
exports.inspectorActionIconContainerStyle = {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    height: INSPECTOR_ACTION_ICON_SIZE,
    justifyContent: 'center',
    width: INSPECTOR_ACTION_ICON_SIZE,
};
exports.largeInspectorActionIconStyle = {
    height: 22,
    width: 22,
};
exports.largeInspectorActionIconContainerStyle = {
    height: 22,
    marginLeft: -2,
    marginRight: -2,
    width: 22,
};
const InspectorQuickAction = ({ children, disabled, iconContainerStyle, onClick, renderIcon, size = 'default', style, 'aria-label': ariaLabel, }) => {
    const showsHover = !disabled && onClick !== null;
    const buttonStyle = react_1.default.useMemo(() => ({
        ...(disabled ? inlineLabelButtonDisabled : inlineLabelButton),
        ...(0, hoverable_1.hoverableStyle)({
            idleBackground: colors_1.TRANSPARENT,
            hoverBackground: showsHover
                ? (0, colors_1.getBackgroundFromHoverState)({ hovered: true, selected: false })
                : colors_1.TRANSPARENT,
            idleColor: colors_1.LIGHT_TEXT,
            hoverColor: showsHover ? colors_1.WHITE : colors_1.LIGHT_TEXT,
        }),
        ...(size === 'compact' ? compactInlineLabelButton : null),
        ...style,
    }), [disabled, showsHover, size, style]);
    const mainContent = ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [renderIcon ? ((0, jsx_runtime_1.jsx)("span", { style: { ...exports.inspectorActionIconContainerStyle, ...iconContainerStyle }, children: renderIcon(colors_1.CURRENT_COLOR) })) : null, (0, jsx_runtime_1.jsx)("span", { style: inlineLabelText, children: children })] }));
    const mainAction = onClick ? ((0, jsx_runtime_1.jsx)("button", { className: `__remotion-inspector-quick-action ${hoverable_1.HOVERABLE_CLASS_NAME}`, type: "button", disabled: disabled, style: buttonStyle, "aria-label": ariaLabel, onClick: onClick, children: mainContent })) : ((0, jsx_runtime_1.jsx)("div", { className: hoverable_1.HOVERABLE_CLASS_NAME, style: buttonStyle, "aria-label": ariaLabel, role: "group", children: mainContent }));
    return mainAction;
};
exports.InspectorQuickAction = InspectorQuickAction;
const InspectorDefaultPropsWarnings = ({ warnings }) => {
    return ((0, jsx_runtime_1.jsx)("div", { style: styles_1.defaultPropsWarningMessages, children: warnings.map((warning) => ((0, jsx_runtime_1.jsx)(ValidationMessage_1.ValidationMessage, { message: warning.message, align: "flex-start", type: "warning", size: "compact", action: warning.resolveLink ? ((0, jsx_runtime_1.jsx)("a", { href: warning.resolveLink, target: "_blank", rel: "noopener noreferrer", style: styles_1.resolveLinkStyle, children: "Resolve" })) : null }, warning.id))) }));
};
exports.InspectorDefaultPropsWarnings = InspectorDefaultPropsWarnings;
