"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InspectorLocationCopy = exports.InspectorHeaderAction = exports.InspectorHeaderActionSlot = exports.inspectorHeaderIconStyle = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const copy_text_1 = require("../helpers/copy-text");
const use_copy_feedback_1 = require("../helpers/use-copy-feedback");
const copy_1 = require("../icons/copy");
const ActionTooltip_1 = require("./ActionTooltip");
const InlineAction_1 = require("./InlineAction");
const common_1 = require("./InspectorPanel/common");
const InspectorPanelLayout_1 = require("./InspectorPanelLayout");
const NotificationCenter_1 = require("./Notifications/NotificationCenter");
const row = {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 8,
    maxWidth: 'round(down, 100%, 1px)',
    minWidth: 0,
    width: '100%',
};
const content = {
    display: 'flex',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
};
const action = {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    height: 24,
    marginLeft: 0,
    marginRight: InspectorPanelLayout_1.INSPECTOR_CONTENT_RIGHT_INSET - (common_1.INSPECTOR_HEADER_ACTION_WIDTH - 12) / 2,
};
exports.inspectorHeaderIconStyle = {
    ...common_1.inspectorActionIconStyle,
    flexShrink: 0,
};
const clipboardIconStyle = {
    ...exports.inspectorHeaderIconStyle,
    height: 16,
    overflow: 'visible',
    width: 12,
};
const copyIconContainer = {
    display: 'flex',
    justifyContent: 'center',
    width: 12,
};
const actionSlot = {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    height: 24,
    width: common_1.INSPECTOR_HEADER_ACTION_WIDTH,
};
const InspectorHeaderActionSlot = ({ children }) => (0, jsx_runtime_1.jsx)("span", { style: actionSlot, children: children });
exports.InspectorHeaderActionSlot = InspectorHeaderActionSlot;
const InspectorHeaderAction = ({ label, disabled, onClick, renderIcon }) => ((0, jsx_runtime_1.jsx)(ActionTooltip_1.ActionTooltip, { label: label, shortcut: null, delay: 800, dismissOnClick: true, children: (0, jsx_runtime_1.jsx)(InlineAction_1.InlineAction, { variant: null, disabled: disabled, onClick: onClick, renderAction: renderIcon, "aria-label": label, style: common_1.inspectorHeaderActionStyle }) }));
exports.InspectorHeaderAction = InspectorHeaderAction;
const InspectorLocationCopy = ({ children, contextForAgents, actions, leadingActions, isEditing }) => {
    const { copied, markCopied } = (0, use_copy_feedback_1.useCopyFeedback)();
    const renderCopyAction = (0, react_1.useCallback)((color) => {
        return ((0, jsx_runtime_1.jsx)("span", { style: copyIconContainer, children: (0, jsx_runtime_1.jsx)(copy_1.CopyIcon, { copied: copied, style: clipboardIconStyle, viewBox: copied ? '0 0 512 512' : '0 32 384 480', preserveAspectRatio: copied ? 'xMidYMid meet' : 'none', color: color }) }));
    }, [copied]);
    const onCopy = (0, react_1.useCallback)((event) => {
        event.stopPropagation();
        if (!contextForAgents) {
            return;
        }
        (0, copy_text_1.copyText)(contextForAgents)
            .then(markCopied)
            .catch((err) => {
            (0, NotificationCenter_1.showNotification)(`Could not copy to clipboard: ${err.message}`, 2000);
        });
    }, [contextForAgents, markCopied]);
    return ((0, jsx_runtime_1.jsxs)("div", { "aria-label": "Inspector source location", role: "group", style: row, children: [(0, jsx_runtime_1.jsx)("div", { style: content, children: children }), isEditing ? null : ((0, jsx_runtime_1.jsxs)("div", { style: action, children: [leadingActions, actions, contextForAgents ? ((0, jsx_runtime_1.jsx)(exports.InspectorHeaderAction, { label: "Copy context for agents", disabled: false, onClick: onCopy, renderIcon: renderCopyAction })) : null] }))] }));
};
exports.InspectorLocationCopy = InspectorLocationCopy;
