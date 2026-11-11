"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequenceInspectorSections = exports.SequenceInspectorDuplicationSection = exports.SequenceInspectorHeader = exports.useSequenceInspectorSourceLocation = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const client_id_1 = require("../../helpers/client-id");
const format_file_location_1 = require("../../helpers/format-file-location");
const book_1 = require("../../icons/book");
const react_2 = require("../../icons/react");
const InlineEditableTitle_1 = require("../InlineEditableTitle");
const InspectorInfoHeader_1 = require("../InspectorInfoHeader");
const InspectorLocationCopy_1 = require("../InspectorLocationCopy");
const InspectorOpenInEditor_1 = require("../InspectorOpenInEditor");
const use_rename_sequence_1 = require("../Timeline/use-rename-sequence");
const use_sequence_source_location_1 = require("../Timeline/use-sequence-source-location");
const common_1 = require("./common");
const ConnectedCompositionsSection_1 = require("./ConnectedCompositionsSection");
const renderReactIcon = (color) => ((0, jsx_runtime_1.jsx)(react_2.ReactIcon, { color: color, style: { ...InspectorLocationCopy_1.inspectorHeaderIconStyle, width: 20 } }));
const renderDocsIcon = (color) => ((0, jsx_runtime_1.jsx)(book_1.BookIcon, { color: color, style: { ...InspectorLocationCopy_1.inspectorHeaderIconStyle, width: 14 } }));
const useSequenceInspectorSourceLocation = (track) => {
    var _a;
    var _b;
    const { location: originalLocation } = (0, use_sequence_source_location_1.useSequenceSourceLocation)(track.sequence, (_b = (_a = track.nodePathInfo) === null || _a === void 0 ? void 0 : _a.sequenceSubscriptionKey) !== null && _b !== void 0 ? _b : null);
    const validatedLocation = (0, react_1.useMemo)(() => {
        var _a;
        if (!originalLocation ||
            !originalLocation.source ||
            !originalLocation.line) {
            return null;
        }
        return {
            source: originalLocation.source,
            line: originalLocation.line,
            column: (_a = originalLocation.column) !== null && _a !== void 0 ? _a : 0,
        };
    }, [originalLocation]);
    return {
        validatedLocation,
    };
};
exports.useSequenceInspectorSourceLocation = useSequenceInspectorSourceLocation;
const SequenceInspectorHeader = ({ sourceLocation, track }) => {
    var _a;
    const [isEditing, setIsEditing] = (0, react_1.useState)(false);
    const { previewServerState } = (0, react_1.useContext)(client_id_1.StudioServerConnectionCtx);
    const { canRename, displayName, fallbackDisplayName, saveName } = (0, use_rename_sequence_1.useRenameSequence)({
        clientId: previewServerState.type === 'connected'
            ? previewServerState.clientId
            : null,
        nodePathInfo: track.nodePathInfo,
        sequence: track.sequence,
        validatedLocation: sourceLocation.validatedLocation,
    });
    const sequenceDisplayName = displayName || fallbackDisplayName;
    const { documentationLink } = track.sequence;
    const componentName = (_a = track.sequence.controls) === null || _a === void 0 ? void 0 : _a.componentName;
    const contextForAgents = (0, react_1.useMemo)(() => (0, format_file_location_1.formatContextForAgents)({
        location: sourceLocation.validatedLocation,
        name: componentName !== null && componentName !== void 0 ? componentName : null,
        root: window.remotion_cwd,
    }), [componentName, sourceLocation.validatedLocation]);
    const openDocumentationLink = (0, react_1.useCallback)(() => {
        if (documentationLink) {
            window.open(documentationLink, '_blank', 'noopener,noreferrer');
        }
    }, [documentationLink]);
    const onRename = (0, react_1.useCallback)((newName) => {
        saveName(newName).catch(() => undefined);
    }, [saveName]);
    return ((0, jsx_runtime_1.jsx)(InspectorInfoHeader_1.InspectorInfoHeader, { contentSized: true, padding: "4px 0 0", children: (0, jsx_runtime_1.jsx)(InspectorLocationCopy_1.InspectorLocationCopy, { contextForAgents: contextForAgents, isEditing: isEditing, actions: (0, jsx_runtime_1.jsx)(InspectorLocationCopy_1.InspectorHeaderActionSlot, { children: sourceLocation.validatedLocation ? ((0, jsx_runtime_1.jsx)(InspectorOpenInEditor_1.InspectorOpenInEditor, { menuTrigger: { label: 'Component', renderIcon: renderReactIcon }, annotationName: componentName !== null && componentName !== void 0 ? componentName : null, contextForAgents: contextForAgents, locationType: null, location: sourceLocation.validatedLocation, showTooltips: true })) : null }), leadingActions: (0, jsx_runtime_1.jsx)(InspectorLocationCopy_1.InspectorHeaderActionSlot, { children: documentationLink ? ((0, jsx_runtime_1.jsx)(InspectorLocationCopy_1.InspectorHeaderAction, { label: `Open docs for ${componentName !== null && componentName !== void 0 ? componentName : fallbackDisplayName}`, disabled: false, onClick: openDocumentationLink, renderIcon: renderDocsIcon })) : null }), children: (0, jsx_runtime_1.jsx)(InlineEditableTitle_1.InlineEditableTitle, { value: sequenceDisplayName, canRename: canRename, onCommit: onRename, onEditingChange: setIsEditing, size: "inspector" }) }) }));
};
exports.SequenceInspectorHeader = SequenceInspectorHeader;
const SequenceInspectorDuplicationSection = ({ track }) => {
    var _a;
    var _b;
    const numberOfInstances = (_b = (_a = track.nodePathInfo) === null || _a === void 0 ? void 0 : _a.numberOfSequencesWithThisNodePath) !== null && _b !== void 0 ? _b : 0;
    if (numberOfInstances <= 1) {
        return null;
    }
    return ((0, jsx_runtime_1.jsx)(common_1.InspectorSection, { expanded: true, header: (0, jsx_runtime_1.jsxs)("span", { style: {
                color: 'inherit',
                display: 'block',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                fontWeight: 'normal',
                lineHeight: 'inherit',
                margin: '2px 0',
            }, children: [numberOfInstances, " instances"] }), children: null }));
};
exports.SequenceInspectorDuplicationSection = SequenceInspectorDuplicationSection;
const SequenceInspectorSections = ({ track }) => {
    const sourceLocation = (0, exports.useSequenceInspectorSourceLocation)(track);
    const connectedCompositions = (0, ConnectedCompositionsSection_1.useConnectedCompositions)({ track });
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(exports.SequenceInspectorHeader, { sourceLocation: sourceLocation, track: track }), (0, jsx_runtime_1.jsx)(exports.SequenceInspectorDuplicationSection, { track: track }), connectedCompositions.length > 0 ? ((0, jsx_runtime_1.jsx)(ConnectedCompositionsSection_1.ConnectedCompositionsSection, { connectedCompositions: connectedCompositions })) : null] }));
};
exports.SequenceInspectorSections = SequenceInspectorSections;
