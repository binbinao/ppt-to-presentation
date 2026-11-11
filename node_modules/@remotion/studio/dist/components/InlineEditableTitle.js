"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlineEditableTitle = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const colors_1 = require("../helpers/colors");
const hoverable_1 = require("../helpers/hoverable");
const InspectorPanelLayout_1 = require("./InspectorPanelLayout");
const layout_1 = require("./layout");
const titleWrapper = {
    boxSizing: 'border-box',
    color: colors_1.WHITE,
    fontSize: 12,
    height: 18,
    lineHeight: '18px',
    marginLeft: -4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: 'calc(100% + 4px)',
};
const titleInner = {
    borderRadius: 4,
    boxSizing: 'border-box',
    display: 'inline-grid',
    fontSize: 12,
    lineHeight: '18px',
    maxWidth: '100%',
    paddingLeft: 4,
    paddingRight: 4,
    verticalAlign: 'top',
};
const titleGridItem = {
    color: 'inherit',
    fontSize: 12,
    gridArea: '1 / 1',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    whiteSpace: 'nowrap',
};
const titleInput = {
    appearance: 'none',
    backgroundColor: colors_1.TRANSPARENT,
    border: `1px solid ${colors_1.WHITE_ALPHA_10}`,
    borderRadius: 3,
    boxSizing: 'border-box',
    boxShadow: 'none',
    color: colors_1.WHITE,
    fontFamily: 'inherit',
    fontSize: 12,
    height: 18,
    lineHeight: '18px',
    margin: 0,
    marginLeft: -4,
    minWidth: 0,
    outline: 'none',
    overflow: 'hidden',
    padding: '0 3px',
    userSelect: 'text',
    WebkitAppearance: 'none',
    width: 'calc(100% + 8px)',
};
const inspectorTitleWrapper = {
    ...titleWrapper,
    fontFamily: 'sans-serif',
    fontSize: 14,
    height: layout_1.COMPACT_CONTROL_ROW_HEIGHT,
    margin: '0 0 0 4px',
    textOverflow: 'clip',
    width: 'calc(100% - 4px)',
};
const inspectorTitleInner = {
    ...titleInner,
    alignItems: 'center',
    fontFamily: 'sans-serif',
    fontSize: 14,
    height: layout_1.COMPACT_CONTROL_ROW_HEIGHT,
    paddingBottom: 0,
    paddingLeft: InspectorPanelLayout_1.INSPECTOR_PANEL_HORIZONTAL_PADDING - 4,
    paddingRight: 0,
    paddingTop: 0,
    width: '100%',
};
const inspectorTitleGridItem = {
    ...titleGridItem,
    fontFamily: 'sans-serif',
    fontSize: 14,
    lineHeight: '18px',
    maskImage: 'linear-gradient(to right, black calc(100% - 16px), transparent calc(100% - 6px))',
    textOverflow: 'clip',
    WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 16px), transparent calc(100% - 6px))',
};
const inspectorTitleInput = {
    ...titleInput,
    fontFamily: 'sans-serif',
    fontSize: 14,
    height: layout_1.COMPACT_CONTROL_ROW_HEIGHT,
    marginLeft: -6,
    maskImage: 'none',
    padding: '0 5px',
    WebkitMaskImage: 'none',
    width: 'calc(100% + 6px)',
};
const InlineEditableTitle = ({ value, onEditingChange, canRename, getInitialSelection, onClick, onCommit, size = 'default', 'aria-label': ariaLabel, }) => {
    const [isEditing, setIsEditing] = (0, react_1.useState)(false);
    const [draftValue, setDraftValue] = (0, react_1.useState)(value);
    const inputRef = (0, react_1.useRef)(null);
    const cancelledRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        if (!isEditing) {
            setDraftValue(value);
        }
    }, [isEditing, value]);
    const focusInput = (0, react_1.useCallback)((input) => {
        inputRef.current = input;
        if (!input) {
            return;
        }
        input.focus();
        if (getInitialSelection) {
            const [start, end] = getInitialSelection(value);
            input.setSelectionRange(start, end);
            return;
        }
        input.select();
    }, [getInitialSelection, value]);
    const commit = (0, react_1.useCallback)((newValue) => {
        if (cancelledRef.current) {
            return;
        }
        setIsEditing(false);
        onEditingChange === null || onEditingChange === void 0 ? void 0 : onEditingChange(false);
        onCommit(newValue);
    }, [onCommit, onEditingChange]);
    const handleClick = (0, react_1.useCallback)(() => {
        if (onClick) {
            onClick();
            return;
        }
        if (!canRename) {
            return;
        }
        cancelledRef.current = false;
        setDraftValue(value);
        setIsEditing(true);
        onEditingChange === null || onEditingChange === void 0 ? void 0 : onEditingChange(true);
    }, [canRename, onClick, onEditingChange, value]);
    const onChange = (0, react_1.useCallback)((e) => {
        setDraftValue(e.target.value);
    }, []);
    const onBlur = (0, react_1.useCallback)((e) => {
        commit(e.currentTarget.value);
    }, [commit]);
    const onKeyDown = (0, react_1.useCallback)((e) => {
        var _a;
        if (e.key === 'Enter') {
            e.preventDefault();
            (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.blur();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            cancelledRef.current = true;
            setDraftValue(value);
            setIsEditing(false);
            onEditingChange === null || onEditingChange === void 0 ? void 0 : onEditingChange(false);
        }
    }, [onEditingChange, value]);
    const isInteractive = canRename || onClick !== undefined;
    const isInspectorSize = size === 'inspector';
    const innerStyle = (0, react_1.useMemo)(() => {
        return {
            ...(isInspectorSize ? inspectorTitleInner : titleInner),
            ...(0, hoverable_1.hoverableStyle)({
                idleBackground: colors_1.TRANSPARENT,
                hoverBackground: !isEditing && isInteractive ? colors_1.WHITE_ALPHA_06 : colors_1.TRANSPARENT,
                idleColor: isEditing ? colors_1.WHITE : colors_1.LIGHT_TEXT,
                hoverColor: isEditing ? colors_1.WHITE : colors_1.LIGHT_TEXT,
            }),
            cursor: isEditing ? 'text' : 'default',
            userSelect: isEditing ? 'text' : 'none',
            width: isEditing || isInspectorSize ? '100%' : undefined,
        };
    }, [isEditing, isInspectorSize, isInteractive]);
    const gridItemStyle = isInspectorSize
        ? inspectorTitleGridItem
        : titleGridItem;
    const inputStyle = isInspectorSize ? inspectorTitleInput : titleInput;
    return ((0, jsx_runtime_1.jsx)("div", { style: isInspectorSize ? inspectorTitleWrapper : titleWrapper, "aria-label": ariaLabel !== null && ariaLabel !== void 0 ? ariaLabel : value, role: "group", children: (0, jsx_runtime_1.jsxs)("span", { style: innerStyle, className: hoverable_1.HOVERABLE_CLASS_NAME, onClick: isEditing || !isInteractive ? undefined : handleClick, children: [(0, jsx_runtime_1.jsx)("span", { "aria-hidden": isEditing, style: {
                        ...gridItemStyle,
                        visibility: isEditing ? 'hidden' : 'visible',
                    }, children: value }), isEditing ? ((0, jsx_runtime_1.jsx)("input", { ref: focusInput, "aria-label": ariaLabel !== null && ariaLabel !== void 0 ? ariaLabel : value, style: { ...gridItemStyle, ...inputStyle }, value: draftValue, onChange: onChange, onBlur: onBlur, onKeyDown: onKeyDown })) : null] }) }));
};
exports.InlineEditableTitle = InlineEditableTitle;
